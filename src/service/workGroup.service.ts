import {CallbackStatus, WorkGroupSchema, WorkStatus} from "../models/schema/work/workgroup.schema";
import {WorkGroup} from "../models/table/work/workgroup.model";
import {errorStore} from "../util/ErrorStore";
import {transactionManager} from "../models/DB";
import {Transaction} from "sequelize";
import {paramUtil} from "../util/param";
import {SQSMessage} from "sqs-consumer";
import {workService} from "./work.service";
import {Work} from "../models/table/work/work.model";
import {MetadataResult, Result} from "./innerService/work.inner.service";
import {resultDataService} from "./resultdata.service";
import {MessageBodyAttributeMap} from "aws-sdk/clients/sqs";
import {awsService} from "./aws.service";
import AWS from "aws-sdk";
import {AWS_ACCESS_KEY, AWS_REGION, AWS_SECRET_ACCESS_KEY} from "../util/secrets";

AWS.config.update({
    region: AWS_REGION,
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
});

class WorkGroupService {
    async createWorkGroup(workGroupId: string, outerTransaction?: Transaction, workKey?: string): Promise<WorkGroup> {
        return await transactionManager.runOnTransaction(outerTransaction, async (t) => {
            if (typeof workKey == "undefined") {
                workKey = Math.random().toString(8).substring(7) as string;
            }
            const status = WorkStatus.WAIT as WorkStatus;

            const workGroupSchema: WorkGroupSchema = {
                workGroupId: workGroupId,
                workKey: workKey,
                status: status,
                callbackStatus: CallbackStatus.NONE,
                retryCount: 0
            };

            const workGroup: WorkGroup = await WorkGroup.create(
                workGroupSchema,
                {transaction: t}
            );

            return workGroup as WorkGroup;
        });
    }

    async getWorkGroup(workGroupId: string, outerTransaction?: Transaction): Promise<WorkGroup> {
        const workGroup = await WorkGroup.findByPk(workGroupId, {transaction: outerTransaction});

        if (!workGroup) {
            throw new Error(errorStore.NOT_FOUND);
        }

        return workGroup;
    }

    async updateWorkGroupStatus(workGroup: WorkGroup, status: WorkStatus, outerTransaction?: Transaction): Promise<WorkGroup> {
        return await transactionManager.runOnTransaction(outerTransaction, async (t) => {
            return await workGroup.update({status: status}, {transaction: t});
        });
    }

    async checkStatus(workGroup: WorkGroup, outerTransaction?: Transaction): Promise<string> {
        return await transactionManager.runOnTransaction(outerTransaction, async (t) => {
            const workGroupId = workGroup.workGroupId as string;
            const work = await WorkGroup.findByPk(workGroupId, {transaction: t});
            if (work == null) {
                throw new Error(errorStore.NOT_FOUND);
            }

            const status = work.status;
            return status;
        });
    }

    async getWorkGroupStatus(workGroupId: string, outerTransaction?: Transaction): Promise<WorkStatus | null> {
        const invalidParam = !paramUtil.checkParam(workGroupId);

        if (invalidParam) {
            throw new Error(errorStore.INVALID_PARAM);
        }

        const workGroup: WorkGroup | null = await WorkGroup.findOne({
            where: {
                workGroupId: workGroupId,
            },
            transaction: outerTransaction
        });

        if (workGroup) {
            return workGroup.status as WorkStatus;
        }

        return null;
    }

    async extractMetadata(message: SQSMessage): Promise<any> {
        const params = message.MessageAttributes as MessageBodyAttributeMap;
        if (!params) {
            throw new Error(errorStore.INVALID_PARAM);
        }

        const questionWorkGroupId = params.questionWorkGroupId.StringValue as string;
        const questionKeys = params.questionKeys.StringValue?.split(",") as string[];
        const answerWorkGroupId = params.answerWorkGroupId.StringValue as string;
        const answerKeys = params.answerKeys.StringValue?.split(",") as string[];
        const metadataKeys = params.metadataKeys.StringValue?.split(",") as string[];
        const bucket = params.bucket.StringValue as string;
        const workKey = params.workKey.StringValue as string;

        const invalidParam = !paramUtil.checkParam(questionWorkGroupId, questionKeys, answerWorkGroupId, answerKeys, metadataKeys, bucket, workKey);

        if (invalidParam) {
            throw new Error(errorStore.INVALID_PARAM);
        }

        const questionWorkGroup: WorkGroup = await this.getWorkGroup(questionWorkGroupId);
        const answerWorkGroup: WorkGroup = await this.getWorkGroup(answerWorkGroupId);

        const s3 = new AWS.S3({apiVersion: "2006-03-01"});

        let questionWorks: Work[];
        let answerWorks: Work[];
        try {
            [questionWorks, answerWorks] = await transactionManager.runOnTransaction(null, async (t) => {
                const questionWorks = await workService.createWorks(questionWorkGroup, questionKeys, t);
                const answerWorks = await workService.createWorks(answerWorkGroup, answerKeys, t);

                return [questionWorks, answerWorks];
            });
        } catch (e) {
            console.log(e);
            await awsService.SNSNotification(String(e));
            return;
        }

        let metadataResponse: MetadataResult[];
        let questionExtractResponse: string[];
        let answerExtractResponse: string[];
        try {
            metadataResponse = await workService.getMetadataList(metadataKeys, s3, bucket);
            questionExtractResponse = await workService.executeQuestionMetadataExtract(questionWorkGroup, questionWorks, questionKeys);
            answerExtractResponse = await workService.executeQuestionMetadataExtract(answerWorkGroup, answerWorks, answerKeys);
        } catch (e) {
            console.log(e);
            await awsService.SNSNotification(String(e));
            return;
        }


        /**
         * 1. 일반문제 -> 문제+답+메타데이터
         * 2. 공통문제 -> 문제+답+메타데이터+그룹ID+WC
         * 3. 공통문제_WC -> pass
         */
        let data: Result[];
        try {
            data = await transactionManager.runOnTransaction(null, async (t) => {
                const data: Result[] = await workService.mappingData(questionExtractResponse, answerExtractResponse, metadataResponse, t);
                await resultDataService.createResultData(workKey, data, t);

                return data;
            });
        } catch (e) {
            console.log(e);
            await awsService.SNSNotification(String(e));
            return;
        }

        const snsMessage = {
            data: data,
            workKey: workKey
        };

        await awsService.SNSNotification(JSON.stringify(snsMessage));
        return;
    }
}

export const workGroupService = new WorkGroupService();