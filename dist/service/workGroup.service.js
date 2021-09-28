// import {CallbackStatus, WorkGroupSchema, WorkStatus} from "../models/schema/work/workgroup.schema";
// import {WorkGroup} from "../models/table/work/workgroup.model";
// import {errorStore} from "../util/ErrorStore";
// import {transactionManager} from "../models/DB";
// import {Transaction} from "sequelize";
// import {paramUtil} from "../util/param";
// import {SQSMessage} from "sqs-consumer";
// import {work2Service} from "./work2.service";
// import {Work} from "work2.model.ts";
// import {MetadataResult, Result} from "./innerService/work.inner.service";
// import {resultDataService} from "./resultdata.service";
// import {MessageBodyAttributeMap} from "aws-sdk/clients/sqs";
// import {awsService} from "./aws.service";
// import AWS from "aws-sdk";
// import {
//     AWS_ACCESS_KEY,
//     AWS_REGION,
//     AWS_SECRET_ACCESS_KEY,
//     EXTRACT_METADATA_SNS,
//     QUESTIONS_BUCKET, SPLIT_QUESTION_SNS
// } from "../util/secrets";
// import {TaskGroup} from "../models/table/work/taskgroup.model";
// import {Task} from "../models/table/work/task.model";
// import {workService} from "./work.service";
// import {taskGroupService} from "./taskGroup.service";
// import {taskService} from "./task.service";
//
// AWS.config.update({
//     region: AWS_REGION,
//     accessKeyId: AWS_ACCESS_KEY,
//     secretAccessKey: AWS_SECRET_ACCESS_KEY
// });
//
// class WorkGroupService {
//     async createWorkGroup(workGroupId: string, outerTransaction?: Transaction, workKey?: string): Promise<WorkGroup> {
//         return await transactionManager.runOnTransaction(outerTransaction, async (t) => {
//             if (typeof workKey == "undefined") {
//                 workKey = Math.random().toString(8).substring(7) as string;
//             }
//             const status = WorkStatus.WAIT as WorkStatus;
//
//             const workGroupSchema: WorkGroupSchema = {
//                 workGroupId: workGroupId,
//                 workKey: workKey,
//                 status: status,
//                 callbackStatus: CallbackStatus.NONE,
//                 retryCount: 0
//             };
//
//             const workGroup: WorkGroup = await WorkGroup.create(
//                 workGroupSchema,
//                 {transaction: t}
//             );
//
//             return workGroup as WorkGroup;
//         });
//     }
//
//     async getWorkGroup(workGroupId: string, outerTransaction?: Transaction): Promise<WorkGroup> {
//         const workGroup = await WorkGroup.findByPk(workGroupId, {transaction: outerTransaction});
//
//         if (!workGroup) {
//             throw new Error(errorStore.NOT_FOUND);
//         }
//
//         return workGroup;
//     }
//
//     async updateWorkGroupStatus(workGroup: WorkGroup, status: WorkStatus, outerTransaction?: Transaction): Promise<WorkGroup> {
//         return await transactionManager.runOnTransaction(outerTransaction, async (t) => {
//             return await workGroup.update({status: status}, {transaction: t});
//         });
//     }
//
//     async checkStatus(workGroup: WorkGroup, outerTransaction?: Transaction): Promise<string> {
//         return await transactionManager.runOnTransaction(outerTransaction, async (t) => {
//             const workGroupId = workGroup.workGroupId as string;
//             const work = await WorkGroup.findByPk(workGroupId, {transaction: t});
//             if (work == null) {
//                 throw new Error(errorStore.NOT_FOUND);
//             }
//
//             const status = work.status;
//             return status;
//         });
//     }
//
//     async getWorkGroupStatus(workGroupId: string, outerTransaction?: Transaction): Promise<WorkStatus | null> {
//         const invalidParam = !paramUtil.checkParam(workGroupId);
//
//         if (invalidParam) {
//             throw new Error(errorStore.INVALID_PARAM);
//         }
//
//         const workGroup: WorkGroup | null = await WorkGroup.findOne({
//             where: {
//                 workGroupId: workGroupId,
//             },
//             transaction: outerTransaction
//         });
//
//         if (workGroup) {
//             return workGroup.status as WorkStatus;
//         }
//
//         return null;
//     }
//
//     async splitQuestion(message: SQSMessage): Promise<any> {
//         const params = message.MessageAttributes as MessageBodyAttributeMap;
//         if (!params) {
//             throw new Error(errorStore.INVALID_PARAM);
//         }
//
//         const workKey = params.workKey.StringValue as string;
//         const taskGroupId = params.taskGroupId.StringValue as string;
//
//         try {
//             const work = await workService.getWork(workKey);
//             const taskGroup = await taskGroupService.getTaskGroup(taskGroupId);
//             if (!taskGroup) {
//                 throw new Error(errorStore.NOT_FOUND);
//             }
//             const tasks = taskGroup.tasks;
//
//             const splitResponse = await work2Service.executeQuestionSplit(questionWorkGroup, questionWork, questionFileKey, answerFileKey);
//
//             await awsService.SNSNotification(JSON.stringify(splitResponse), SPLIT_QUESTION_SNS);
//         } catch (e) {
//             await awsService.SNSNotification(e, SPLIT_QUESTION_SNS);
//         }
//
//         return;
//     }
// }
//
// export const workGroupService = new WorkGroupService();
//# sourceMappingURL=workGroup.service.js.map