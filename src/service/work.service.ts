import {WorkGroup} from "../models/table/work/workgroup.model";
import {WorkStatus, WorkType} from "../models/schema/work/workgroup.schema";
import {Work} from "../models/table/work/work.model";
import {WorkSchema} from "../models/schema/work/work.schema";
import {Op, Transaction} from "sequelize";
import {errorStore} from "../util/ErrorStore";
import AWS, {S3} from "aws-sdk";
import {JsonObject} from "swagger-ui-express";
import Semaphore from "semaphore";
import {workGroupService} from "./workGroup.service";
import {transactionManager} from "../models/DB";
import cloneDeep from "lodash.clonedeep";
import {MetadataResult, Result, FileMetadata, workInnerService, WC, Metadata} from "./innerService/work.inner.service";
import {HWP_METADATA_BUCKET, LAYOUT_FILE, QUESTION_EXTRACTOR_LAMBDA, QUESTION_SPLIT_LAMBDA} from "../util/secrets";
import {resultDataService} from "./resultdata.service";

class WorkService {
    async getAllKeys(workGroupId: string, s3: AWS.S3, bucket: string, params?: any): Promise<string[]> {
        const allKeys: string[] = [];
        if(!params) {
            params = {
                Bucket: bucket,
                Prefix: workGroupId+"/"
            };
        }

        const response = await s3.listObjectsV2(params).promise();
        if(response.Contents) {
            response.Contents.forEach( content => {
                const key = content.Key as string;
                allKeys.push(key);
            } );
        }
        if (response.NextContinuationToken) {
            params.ContinuationToken = response.NextContinuationToken;
            const nextAllKeys = await this.getAllKeys(workGroupId, s3, bucket, params);
            allKeys.concat(nextAllKeys);
        }

        return allKeys;
    }

    /**
     * 날짜/randomId -> 받고
     * 1. question을 붙여서 key를 받아옴
     * 2. answer를 붙여서 key를 받아옴
     * 3. metadata를 붙여서 key를 받아옴
     * -> controller에서 진행
     *
     * 4. question들을 extract
     * 5. answer들을 extract
     * -> 각각 for문으로 semaphore 대기 -> 람다 문제 개수만큼 실행 -> 모두 완료되면 lambda.invoke에서 callback
     * -> 두 개의 callback이 모두 되면 -> 두 개의 response를 message의 data에 넣음
     *
     * 6. metadata를 AWS SNS에 보낼 message의 data에 넣어줌
    */
    async executeQuestionMetadataExtract(workGroup: WorkGroup, works: Work[], outerTransaction?: Transaction): Promise<string[]> {
        return new Promise(async (resolve, reject) => {
            const layoutFileKey = LAYOUT_FILE;
            const totalWorkCount = await workService.countWork(workGroup);
            let semaphore: Semaphore.Semaphore | null = Semaphore(10);
            const responses: string[] = [];

            for (const work of works) {
                // const work = works[allKeys.indexOf(key)];
                const set = {
                    layout: layoutFileKey,
                    source: {
                        key: work.workId,
                        height: null
                    }
                };
                const params = {
                    FunctionName: QUESTION_EXTRACTOR_LAMBDA as string,
                    InvocationType: "RequestResponse",
                    Payload: JSON.stringify(set)
                };

                const lambda = new AWS.Lambda();
                semaphore.take(function () {
                    lambda.invoke(params, async function (err, responseData) {
                        let otherError = undefined;
                        if (typeof responseData.Payload == "string") {
                            otherError = JSON.parse(responseData.Payload).errorMessage || null;
                            if (err || otherError) {
                                await transactionManager.runOnTransaction(null, async (t) => {
                                    await workService.updateStatus(work, WorkStatus.FAIL, t);
                                    const workGroupStatus = await workGroupService.checkStatus(workGroup, t);
                                    if (workGroupStatus == WorkStatus.WAIT) {
                                        await workGroupService.updateWorkGroupStatus(workGroup, WorkStatus.FAIL, t);
                                    }
                                });

                                if (semaphore != null) {
                                    semaphore!.capacity = 0;
                                    semaphore = null;
                                }

                                if (err) {
                                    return reject(new Error(JSON.stringify(err)));
                                } else if (otherError) {
                                    return reject(new Error(responseData.Payload));
                                }
                            } else if (responseData && responseData.Payload) {
                                responses.push(responseData.Payload);
                                const updateWorkGroup = await transactionManager.runOnTransaction(null, async (t) => {
                                    await workService.updateStatus(work, WorkStatus.SUCCESS, t);
                                    const isSuccess = await workService.checkIsSuccess(workGroup, totalWorkCount, t);
                                    if (isSuccess) {
                                        const updateWorkGroup = await workGroupService.updateWorkGroupStatus(workGroup, WorkStatus.SUCCESS, t);
                                        return updateWorkGroup;
                                    }
                                });
                                if (updateWorkGroup && updateWorkGroup.status == WorkStatus.SUCCESS) {
                                    semaphore!.capacity = 0;
                                    semaphore = null;
                                    return resolve(responses);
                                }
                            }
                            if (semaphore) {
                                semaphore.leave();
                            }
                            return;
                        } else {
                            await transactionManager.runOnTransaction(null, async (t) => {
                                await workService.updateStatus(work, WorkStatus.FAIL, t);
                                const workGroupStatus = await workGroupService.checkStatus(workGroup, t);
                                if (workGroupStatus == WorkStatus.WAIT) {
                                    await workGroupService.updateWorkGroupStatus(workGroup, WorkStatus.FAIL, t);
                                }
                            });

                            semaphore!.capacity = 0;
                            semaphore = null;

                            return reject(new Error("Wrong AWS Lambda Payload"));
                        }
                    });
                });
            }
        });
    }

    async executeQuestionSplit(workGroup: WorkGroup, work: Work, questionFileKey: string, answerFileKey: string): Promise<object> {
        return new Promise(async (resolve, reject) => {
            const layoutFileKey = LAYOUT_FILE;
            const responses: JSON[] = [];

            const set = {
                layoutFileKey: layoutFileKey,
                questionFileKey: questionFileKey,
                answerFileKey: answerFileKey
            };
            const params = {
                FunctionName: QUESTION_SPLIT_LAMBDA as string,
                InvocationType: "RequestResponse",
                Payload: JSON.stringify(set)
            };

            const lambda = new AWS.Lambda();
            lambda.invoke(params, async function (err, data) {
                let otherError = undefined;
                if (typeof data.Payload == "string") {
                    otherError = JSON.parse(data.Payload).errorMessage;
                }

                if (err || otherError) {
                    await transactionManager.runOnTransaction(null, async (t) => {
                        await workService.updateStatus(work, WorkStatus.FAIL, t);
                        await workGroupService.updateWorkGroupStatus(workGroup, WorkStatus.FAIL);
                    });
                    return reject(otherError || err);
                } else if (data && data.Payload) {
                    responses.push(JSON.parse(data.Payload.toString()));
                    const updateWorkGroup = await transactionManager.runOnTransaction(null, async (t) => {
                        await workService.updateStatus(work, WorkStatus.SUCCESS, t);
                        const updateWorkGroup = await workGroupService.updateWorkGroupStatus(workGroup, WorkStatus.SUCCESS, t);
                        return updateWorkGroup;
                    });

                    let fileKeys;
                    if (typeof data.Payload === "string") {
                        fileKeys = JSON.parse(data.Payload);
                    } else {
                        reject("SplitResponse Payload Is Not String");
                    }


                    const splitResponse = {
                        workKey: updateWorkGroup.workKey,
                        fileKeys: JSON.parse(fileKeys)
                    };

                    await resultDataService.createResultData(updateWorkGroup.workKey, JSON.stringify(fileKeys));

                    return resolve(splitResponse);
                }
            });
        });
    }

    async executeMakePaper(workGroup: WorkGroup, work: Work, sources: string[], dynamicContents: JsonObject) {
        const layoutFileKey = LAYOUT_FILE as string;
        const workType = WorkType.MAKE_PAPER;

        const set = {
            layoutFileKey: layoutFileKey,
            source: sources,
            dynamicContents: dynamicContents,
            workType: workType
        };

        const params = {
            FunctionName: QUESTION_SPLIT_LAMBDA as string,
            InvocationType: "RequestResponse",
            Payload: JSON.stringify(set)
        };

        const lambda = new AWS.Lambda();
        lambda.invoke(params, async function (err, data) {
            let otherError = undefined;
            if (typeof data.Payload == "string") {
                otherError = JSON.parse(data.Payload).errorMessage;
            }

            if (err || otherError) {
                await transactionManager.runOnTransaction(null, async (t) => {
                    await workService.updateStatus(work, WorkStatus.FAIL, t);
                    const updateWorkGroup = await workGroupService.updateWorkGroupStatus(workGroup, WorkStatus.FAIL, t);
                    //TODO AWS SNS PUB
                });
                throw new Error(otherError || err);
            } else if (data && data.Payload) {
                const response = JSON.parse(data.Payload.toString());
                await transactionManager.runOnTransaction(null, async (t) => {
                    await workService.updateStatus(work, WorkStatus.SUCCESS, t);
                    const updateWorkGroup = await workGroupService.updateWorkGroupStatus(workGroup, WorkStatus.SUCCESS, t);
                    //TODO AWS SNS PUB
                });
            }
        });
    }

    async createWork(workGroup: WorkGroup, key: string): Promise<Work> {
        const workGroupId = workGroup.workGroupId as string;
        const status = WorkStatus.WAIT as WorkStatus;
        const workSchema: WorkSchema = {
            workGroupId: workGroupId,
            workId: key,
            status: status
        };

        const work = await Work.create(workSchema);
        return work as Work;
    }

    async createWorks(workGroup: WorkGroup, keys: string[], outerTransaction?: Transaction): Promise<Work[]> {
        return await transactionManager.runOnTransaction(outerTransaction, async (t) => {
            const workGroupId = workGroup.workGroupId as string;
            const status = WorkStatus.WAIT as WorkStatus;
            const workSchemas: WorkSchema[] = [];

            for (const key of keys) {
                workSchemas.push({
                    workGroupId: workGroupId,
                    workId: key,
                    status: status
                });
            }

            const createdWorks: Work[] = await Work.createList(workSchemas, {transaction: t});

            return createdWorks as Work[];
        });
    }

    async countWork(workGroup: WorkGroup): Promise<number> {
        const count = await WorkGroup.count({
            include: [{
                model: Work,
                where: {
                    workGroupId: workGroup.workGroupId
                }
            }]
        });

        return count as number;
    }

    async updateStatus(work: Work, status: WorkStatus, outerTransaction?: Transaction): Promise<Work> {
        return await work.update({
            status: status,
        }, {transaction: outerTransaction});
    }

    async checkIsSuccess(workGroup: WorkGroup, totalWorkCount: number, outerTransaction: Transaction): Promise<boolean> {
        const successCount = await Work.count({
            where: {
                [Op.and] : [
                    {workGroupId: workGroup.workGroupId} ,
                    {status: { [Op.like]: WorkStatus.SUCCESS } }
                ]
            },
            transaction: outerTransaction
        });

        if (successCount == totalWorkCount) {
            return true;
        }
        return false;
    }

    async checkStatus(workId: string): Promise<string> {
        const work = await Work.findByPk(workId);
        if (work == null) {
            throw new Error(errorStore.NOT_FOUND);
        }

        const status = work.status;
        return status;
    }

    async getMetadataList(metadataKeys: string[], s3: S3, bucket: string): Promise<MetadataResult[]> {
        return new Promise(async (resolve, reject) => {
            const metadataResultList: MetadataResult[] = [];
            const promises = [];

            for (const key of metadataKeys) {
                const params = {
                    Bucket: bucket,
                    Key: key
                };

                const promise = s3.getObject(params).promise().then((result) => {
                    return Promise.resolve({
                        response: result,
                        key
                    });
                });
                promises.push(promise);
            }
            try {
                const result = await Promise.all(promises);
                result.forEach((result) => {
                    const response = result.response;
                    const key = result.key;

                    if(response.Body){
                        const metadata = response.Body.toString();
                        const metadataResult: MetadataResult = {
                            metadata: metadata,
                            key: key
                        };
                        metadataResultList.push(metadataResult);
                    } else {
                        return reject(new Error("BODY IS NULL"));
                    }
                });
                resolve(metadataResultList as MetadataResult[]);
            } catch(e) {
                reject(e);
            }
        });
    }

    async mappingData(questionExtractResponse: string[], answerExtractResponse: string[], metadataResponse: MetadataResult[], workGroupId: string, outerTransaction?: Transaction): Promise<Result[]> {
        const data: Result[] = [];

        try {
            for (const questionExtractedData of questionExtractResponse ) {
                const qEDObject = JSON.parse(questionExtractedData);

                const cloneQuestionKey = cloneDeep(qEDObject.key);
                const questionKeyData: string[] = cloneQuestionKey.split("/");

                const questionFileName = questionKeyData[questionKeyData.length-1] as string;

                if (!questionFileName.includes("_WC\.")) {
                    const questionKey = qEDObject.key as string;
                    const questionFileMetadata: FileMetadata = {
                        imageHeight: qEDObject.height as number,
                        thumbnailKey: qEDObject.thumbnailKey as string,
                        extractedImageKey: qEDObject.extractedImageKey as string,
                        text: qEDObject.text as string,
                        bucket: HWP_METADATA_BUCKET as string
                    };

                    try {
                        const [answerKey, answerFileMetadata] = await workInnerService.mappingAnswerMetadata(answerExtractResponse, questionFileName);
                        const questionMetadata = await workInnerService.mappingMetadata(metadataResponse, questionKey);

                        let questionGroupKey: string | undefined;
                        let wc: WC | undefined;
                        if (questionKeyData.length == 5) {
                            questionGroupKey = questionKeyData[3];
                            wc = await workInnerService.mappingWC(questionExtractResponse, questionFileName, questionKey);
                        }

                        const metadata: Metadata = await workInnerService.getMetadata(questionMetadata, questionFileMetadata, answerFileMetadata, );
                        const result: Result = await workInnerService.getResult(questionGroupKey, wc, questionKey, answerKey, metadata, workGroupId);

                        data.push(result);
                    } catch (e) {
                        throw new Error(e);
                    }
                }
            }
        } catch (e) {
            throw new Error(e);
        }

        return data as Result[];
    }

    async getWork(workId: string, outerTransaction?: Transaction): Promise<Work> {
        const work = await Work.findByPk(workId, {transaction: outerTransaction});

        if (!work) {
            throw new Error(errorStore.NOT_FOUND);
        }

        return work;
    }
}

export const workService = new WorkService();