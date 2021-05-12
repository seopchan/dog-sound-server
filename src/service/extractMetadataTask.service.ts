import {
    EXTRACT_METADATA_SNS,
    HWP_METADATA_BUCKET,
    LAYOUT_FILE,
    QUESTION_EXTRACTOR_LAMBDA,
    QUESTIONS_BUCKET
} from "../util/secrets";
import Semaphore from "semaphore";
import AWS, {S3} from "aws-sdk";
import {transactionManager} from "../models/DB";
import {TaskGroup} from "../models/table/work/taskgroup.model";
import {Task} from "../models/table/work/task.model";
import {taskService} from "./task.service";
import {TaskStatus} from "../models/schema/work/task.schema";
import {taskGroupService} from "./taskGroup.service";
import {TaskGroupStatus} from "../models/schema/work/taskgroup.schema";
import {Transaction} from "sequelize";
import {ExtractMetadataTaskSchema, ExtractMetadataTaskType} from "../models/schema/work/extractmetadatatask.schema";
import {ExtractMetadataTask} from "../models/table/work/extractmetadatatask.model";
import {SQSMessage} from "sqs-consumer";
import {MessageBodyAttributeMap} from "aws-sdk/clients/sqs";
import {errorStore} from "../util/ErrorStore";
import {paramUtil} from "../util/param";
import {awsService} from "./aws.service";
import cloneDeep from "lodash.clonedeep";
import {
    extractMetadataTaskInnerService, FileMetadata, Metadata,
    MetadataResult,
    Result, WC
} from "./innerService/extractMetadataTask.inner.service";

class ExtractMetadataTaskService {
    async extractMetadata(message: SQSMessage): Promise<void> {
        const params = message.MessageAttributes as MessageBodyAttributeMap;
        if (!params) {
            throw new Error(errorStore.INVALID_PARAM);
        }

        const metadataKeys = params.metadataKeys.StringValue?.split(",") as string[];
        const workKey = params.workKey.StringValue as string;
        const taskGroupId = params.taskGroupId.StringValue as string;

        const invalidParam = !paramUtil.checkParam(metadataKeys, workKey, taskGroupId);

        if (invalidParam) {
            throw new Error(errorStore.INVALID_PARAM);
        }

        let taskGroup: TaskGroup | null;
        let tasks: Task[];
        try {
            taskGroup = await taskGroupService.getTaskGroup(taskGroupId);
            if (!taskGroup) {
                throw new Error(errorStore.NOT_FOUND);
            }
            tasks = await taskGroupService.getTasks(taskGroup);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }

        const s3 = new AWS.S3({apiVersion: "2006-03-01"});

        let metadataResponse: MetadataResult[];
        let updateTaskGroup: TaskGroup;
        try {
            metadataResponse = await this.getMetadataList(metadataKeys, s3, QUESTIONS_BUCKET);
            updateTaskGroup = await this.executeQuestionMetadataExtract(taskGroup, tasks);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }

        const updateTasks: Task[] = await taskGroupService.getTasks(updateTaskGroup);
        const questionExtractResponse: string[] = [];
        const answerExtractResponse: string[] = [];
        for (const task of updateTasks) {
            if (task.extractMetadataTask.type == ExtractMetadataTaskType.QUESTION) {
                questionExtractResponse.push(task.result);
            } else if (task.extractMetadataTask.type == ExtractMetadataTaskType.ANSWER) {
                answerExtractResponse.push(task.result);
            }
        }

        /**
         * 1. 일반문제 -> 문제+답+메타데이터
         * 2. 공통문제 -> 문제+답+메타데이터+그룹ID+WC
         * 3. 공통문제_WC -> pass
         */
        let data: Result[];
        try {
            data = await this.mappingData(questionExtractResponse, answerExtractResponse, metadataResponse, taskGroupId);
            await updateTaskGroup.update({
                result: JSON.stringify(data)
            });

        } catch (e) {
            console.log(e);
            throw new Error(e);
        }

        const snsMessage = {
            data: JSON.stringify(data),
            workKey: workKey
        };

        await awsService.SNSNotification(JSON.stringify(snsMessage), EXTRACT_METADATA_SNS);
        return;
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
    async executeQuestionMetadataExtract(taskGroup: TaskGroup, tasks: Task[]): Promise<TaskGroup> {
        return new Promise(async (resolve, reject) => {
            const layoutFileKey = LAYOUT_FILE;
            const totalTaskCount = tasks.length;
            let semaphore: Semaphore.Semaphore | null = Semaphore(10);
            const responses: string[] = [];

            for (const task of tasks) {
                const set = {
                    layout: layoutFileKey,
                    source: {
                        key: task.taskId,
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
                        if (typeof responseData.Payload === "string") {
                            const payload = responseData.Payload as string;
                            otherError = JSON.parse(responseData.Payload).errorMessage || null;
                            if (err || otherError) {
                                await transactionManager.runOnTransaction(null, async (t) => {
                                    await taskService.updateStatus(task, TaskStatus.FAIL, t);
                                    const taskGroupStatus = taskGroup.status;
                                    if (taskGroupStatus == TaskStatus.WAIT) {
                                        await taskGroupService.updateStatus(taskGroup, TaskGroupStatus.FAIL, t);
                                    }
                                });

                                if (semaphore) {
                                    semaphore.capacity = 0;
                                    semaphore = null;
                                }

                                if (err) {
                                    return reject(new Error(JSON.stringify(err)));
                                } else if (otherError) {
                                    return reject(new Error(payload));
                                }
                            } else if (responseData && payload) {
                                responses.push(payload);
                                const updateTaskGroup = await transactionManager.runOnTransaction(null, async (t) => {
                                    await taskService.updateStatus(task, TaskStatus.SUCCESS, t);
                                    await taskService.updateResult(task, payload, t);

                                    const isSuccess = await taskService.checkIsSuccess(taskGroup, totalTaskCount, t);

                                    if (isSuccess) {
                                        const updateTaskGroup = await taskGroupService.updateStatus(taskGroup, TaskGroupStatus.SUCCESS, t);
                                        const addResultTaskGroup = await taskGroupService.updateResult(updateTaskGroup, responses.toString(), t);

                                        return addResultTaskGroup;
                                    }
                                });
                                if (updateTaskGroup && updateTaskGroup.status == TaskGroupStatus.SUCCESS) {
                                    if (semaphore) {
                                        semaphore.capacity = 0;
                                        semaphore = null;
                                    }
                                    return resolve(updateTaskGroup);
                                }
                            }
                            if (semaphore) {
                                semaphore.leave();
                            }
                            return;
                        } else {
                            await transactionManager.runOnTransaction(null, async (t) => {
                                await taskService.updateStatus(task, TaskStatus.FAIL, t);
                                const taskGroupStatus = taskGroup.status;
                                if (taskGroupStatus == TaskGroupStatus.WAIT) {
                                    await taskGroupService.updateStatus(taskGroup, TaskGroupStatus.FAIL, t);
                                }
                            });

                            if (semaphore) {
                                semaphore.capacity = 0;
                                semaphore = null;
                            }

                            return reject(new Error("Wrong AWS Lambda Payload"));
                        }
                    });
                });
            }
        });
    }

    async createTasks(tasks: Task[], questionKeys: string[], answerKeys: string[], outerTransaction: Transaction): Promise<ExtractMetadataTask[]> {
        const extractMetadataTaskSchemas: ExtractMetadataTaskSchema[] = [];

        for (const task of tasks) {
            for (const questionKey of questionKeys) {
                if (task.taskId == questionKey) {
                    extractMetadataTaskSchemas.push({
                        taskId: task.taskId,
                        type: ExtractMetadataTaskType.QUESTION
                    });
                };
            }
            for (const answerKey of answerKeys) {
                if (task.taskId == answerKey) {
                    extractMetadataTaskSchemas.push({
                        taskId: task.taskId,
                        type: ExtractMetadataTaskType.ANSWER
                    });
                };
            }
        }

        const extractMetadataTasks: ExtractMetadataTask[] = await ExtractMetadataTask.createList(
            extractMetadataTaskSchemas,
            { transaction: outerTransaction}
        );

        return extractMetadataTasks;
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

    async mappingData(questionExtractResponse: string[], answerExtractResponse: string[], metadataResponse: MetadataResult[], workGroupId: string): Promise<Result[]> {
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
                        const [answerKey, answerFileMetadata] = await extractMetadataTaskInnerService.mappingAnswerMetadata(answerExtractResponse, questionFileName);
                        const questionMetadata = await extractMetadataTaskInnerService.mappingMetadata(metadataResponse, questionKey);

                        let questionGroupKey: string | undefined;
                        let wc: WC | undefined;
                        if (questionKeyData.length == 5) {
                            questionGroupKey = questionKeyData[3];
                            wc = await extractMetadataTaskInnerService.mappingWC(questionExtractResponse, questionFileName, questionKey);
                        }

                        const metadata: Metadata = await extractMetadataTaskInnerService.getMetadata(questionMetadata, questionFileMetadata, answerFileMetadata, );
                        const result: Result = await extractMetadataTaskInnerService.getResult(questionGroupKey, wc, questionKey, answerKey, metadata, workGroupId);

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
}

export const extractMetadataTaskService = new ExtractMetadataTaskService();