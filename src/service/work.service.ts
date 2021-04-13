import {WorkGroup} from "../models/table/work/workgroup.model";
import {WorkStatus, WorkType} from "../models/schema/work/workgroup.schema";
import {Work} from "../models/table/work/work.model";
import {WorkSchema} from "../models/schema/work/work.schema";
import {Op} from "sequelize";
import {errorStore} from "../util/ErrorStore";
import AWS from "aws-sdk";
import {JsonObject} from "swagger-ui-express";
import Semaphore from "semaphore";
import {workGroupService} from "./workGroup.service";
import {transactionManager} from "../models/DB";

class WorkService {
    async getAllKeys(workGroupId: string, s3: AWS.S3, allKeys: string[], bucket: string, params?: any) {
        if(!params) {
            params = {
                Bucket: bucket,
                Prefix: workGroupId
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
            allKeys = await this.getAllKeys(workGroupId, s3, allKeys, bucket, params);
        }

        return allKeys;
    }

    async executeQuestionMetadataExtract(workGroup: WorkGroup, works: Work[], allKeys: string[], dynamicContents: JsonObject) {
        const layoutFileKey = `${process.env.LAYOUT_FILE}`;
        const totalWorkCount = await workService.countWork(workGroup);
        let semaphore: Semaphore.Semaphore | null = Semaphore(10);
        const responses: JSON[] = [];

        for (const key of allKeys) {
            const work = works[allKeys.indexOf(key)];

            if (dynamicContents == null) {
                dynamicContents = {
                    data : null
                };
            }
            const set = {
                layout: layoutFileKey,
                source : key,
                dynamicContents : JSON.stringify(dynamicContents),
            };
            const params = {
                FunctionName: `${process.env.SINGLE_MODULE_URL}`,
                InvocationType: "RequestResponse",
                Payload: JSON.stringify(set)
            };

            semaphore.take(function () {
                const lambda = new AWS.Lambda();
                lambda.invoke(params, async function (err, data) {
                    let otherError = undefined;
                    if (typeof data.Payload == "string") {
                        otherError = JSON.parse(data.Payload).errorMessage;
                    }

                    if (err || otherError) {
                        await workService.updateStatus(work, WorkStatus.FAIL);
                        const workGroupStatus = await workGroupService.checkStatus(workGroup);
                        if (workGroupStatus == WorkStatus.WAIT) {
                            await transactionManager.runOnTransaction(null, async (t) => {
                                const updateWorkGroup = await workGroupService.updateWorkGroupStatus(workGroup, WorkStatus.FAIL);
                                await workGroupService.callbackToApiServer(updateWorkGroup);
                            });
                        }
                        semaphore!.capacity = 0;
                        semaphore = null;
                        throw new Error(otherError || err);
                    } else if (data && data.Payload) {
                        responses.push(JSON.parse(data.Payload.toString()));
                        await workService.updateStatus(work, WorkStatus.SUCCESS);
                        const isSuccess = await workService.checkIsSuccess(workGroup, totalWorkCount);
                        if (isSuccess) {
                            await transactionManager.runOnTransaction(null, async (t) => {
                                const updateWorkGroup = await workGroupService.updateWorkGroupStatus(workGroup, WorkStatus.SUCCESS);
                                await workGroupService.callbackToApiServer(updateWorkGroup, responses);
                            });
                        }
                    }
                    semaphore!.leave();
                });
            });
        }
    }

    async executeQuestionSplit(workGroup: WorkGroup, work: Work, questionFileKey: string, answerFileKey: string, ) {
        const layoutFileKey = `${process.env.LAYOUT_FILE}`;
        const responses: JSON[] = [];

        const set = {
            layoutFileKey: layoutFileKey,
            questionFileKey: questionFileKey,
            answerFileKey: answerFileKey
        };
        const params = {
            FunctionName: `${process.env.QUESTION_SPLIT}`,
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
                    await workService.updateStatus(work, WorkStatus.FAIL);
                    const updateWorkGroup = await workGroupService.updateWorkGroupStatus(workGroup, WorkStatus.FAIL);
                    await workGroupService.callbackToApiServer(updateWorkGroup);
                });
                throw new Error(otherError || err);
            } else if (data && data.Payload) {
                responses.push(JSON.parse(data.Payload.toString()));
                await transactionManager.runOnTransaction(null, async (t) => {
                    await workService.updateStatus(work, WorkStatus.SUCCESS);
                    const updateWorkGroup = await workGroupService.updateWorkGroupStatus(workGroup, WorkStatus.SUCCESS);
                    await workGroupService.callbackToApiServer(updateWorkGroup, responses);
                });
            }
        });
    }

    async executeMakePaper(workGroup: WorkGroup, work: Work, sources: string[], dynamicContents: JsonObject, workType: WorkType) {
        const layoutFileKey = `${process.env.LAYOUT_FILE}`;

        const set = {
            layoutFileKey: layoutFileKey,
            source: sources,
            dynamicContents: dynamicContents,
            workType: workType
        };

        const params = {
            FunctionName: `${process.env.QUESTION_SPLIT}`,
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
                    await workService.updateStatus(work, WorkStatus.FAIL);
                    const updateWorkGroup = await workGroupService.updateWorkGroupStatus(workGroup, WorkStatus.FAIL);
                    await workGroupService.callbackToApiServer(updateWorkGroup);
                });
                throw new Error(otherError || err);
            } else if (data && data.Payload) {
                const response = JSON.parse(data.Payload.toString());
                await transactionManager.runOnTransaction(null, async (t) => {
                    await workService.updateStatus(work, WorkStatus.SUCCESS);
                    const updateWorkGroup = await workGroupService.updateWorkGroupStatus(workGroup, WorkStatus.SUCCESS);
                    await workGroupService.callbackToApiServer(updateWorkGroup, [response]);
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

    async createWorks(workGroup: WorkGroup, keys: string[]): Promise<Work[]> {
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

        const createdWorks: Work[] = await Work.createList(workSchemas);

        return createdWorks as Work[];
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

    async updateStatus(work: Work, status: WorkStatus): Promise<Work> {
        return await work.update({
            status: status
        });
    }

    async checkIsSuccess(workGroup: WorkGroup, totalWorkCount: number): Promise<boolean> {
        const successCount = await Work.count({
            where: {
                [Op.and] : [
                    {workGroupId: workGroup.workGroupId} ,
                    {status: { [Op.like]: WorkStatus.SUCCESS } }
                ]
            }
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
}

export const workService = new WorkService();