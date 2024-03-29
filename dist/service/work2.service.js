// import {WorkGroup} from "../models/table/work/workgroup.model";
// import {WorkStatus, WorkType} from "../models/schema/work/workgroup.schema";
// import {Work} from "work2.model.ts";
// import {Work2Schema} from "work2.schema.ts";
// import {Op, Transaction} from "sequelize";
// import {errorStore} from "../util/ErrorStore";
// import AWS, {S3} from "aws-sdk";
// import {JsonObject} from "swagger-ui-express";
// import Semaphore from "semaphore";
// import {workGroupService} from "./workGroup.service";
// import {transactionManager} from "../models/DB";
// import cloneDeep from "lodash.clonedeep";
// import {MetadataResult, Result, FileMetadata, workInnerService, WC, Metadata} from "./innerService/work.inner.service";
// import {HWP_METADATA_BUCKET, LAYOUT_FILE, QUESTION_EXTRACTOR_LAMBDA, QUESTION_SPLIT_LAMBDA} from "../util/secrets";
// import {resultDataService} from "./resultdata.service";
//
// class Work2Service {
//     async getAllKeys(workGroupId: string, s3: AWS.S3, bucket: string, params?: any): Promise<string[]> {
//         const allKeys: string[] = [];
//         if(!params) {
//             params = {
//                 Bucket: bucket,
//                 Prefix: workGroupId+"/"
//             };
//         }
//
//         const response = await s3.listObjectsV2(params).promise();
//         if(response.Contents) {
//             response.Contents.forEach( content => {
//                 const key = content.Key as string;
//                 allKeys.push(key);
//             } );
//         }
//         if (response.NextContinuationToken) {
//             params.ContinuationToken = response.NextContinuationToken;
//             const nextAllKeys = await this.getAllKeys(workGroupId, s3, bucket, params);
//             allKeys.concat(nextAllKeys);
//         }
//
//         return allKeys;
//     }
//
//     async executeQuestionSplit(workGroup: WorkGroup, work: Work, questionFileKey: string, answerFileKey: string): Promise<object> {
//         return new Promise(async (resolve, reject) => {
//             const layoutFileKey = LAYOUT_FILE;
//             const responses: JSON[] = [];
//
//             const set = {
//                 layoutFileKey: layoutFileKey,
//                 questionFileKey: questionFileKey,
//                 answerFileKey: answerFileKey
//             };
//             const params = {
//                 FunctionName: QUESTION_SPLIT_LAMBDA as string,
//                 InvocationType: "RequestResponse",
//                 Payload: JSON.stringify(set)
//             };
//
//             const lambda = new AWS.Lambda();
//             lambda.invoke(params, async function (err, data) {
//                 let otherError = undefined;
//                 if (typeof data.Payload == "string") {
//                     otherError = JSON.parse(data.Payload).errorMessage;
//                 }
//
//                 if (err || otherError) {
//                     await transactionManager.runOnTransaction(null, async (t) => {
//                         await work2Service.updateStatus(work, WorkStatus.FAIL, t);
//                         await workGroupService.updateWorkGroupStatus(workGroup, WorkStatus.FAIL);
//                     });
//                     return reject(otherError || err);
//                 } else if (data && data.Payload) {
//                     responses.push(JSON.parse(data.Payload.toString()));
//                     const updateWorkGroup = await transactionManager.runOnTransaction(null, async (t) => {
//                         await work2Service.updateStatus(work, WorkStatus.SUCCESS, t);
//                         const updateWorkGroup = await workGroupService.updateWorkGroupStatus(workGroup, WorkStatus.SUCCESS, t);
//                         return updateWorkGroup;
//                     });
//
//                     let fileKeys;
//                     if (typeof data.Payload === "string") {
//                         fileKeys = JSON.parse(data.Payload);
//                     } else {
//                         reject("SplitResponse Payload Is Not String");
//                     }
//
//
//                     const splitResponse = {
//                         workKey: updateWorkGroup.workKey,
//                         fileKeys: JSON.parse(fileKeys)
//                     };
//
//                     await resultDataService.createResultData(updateWorkGroup.workKey, JSON.stringify(fileKeys));
//
//                     return resolve(splitResponse);
//                 }
//             });
//         });
//     }
//
//     async executeMakePaper(workGroup: WorkGroup, work: Work, sources: string[], dynamicContents: JsonObject) {
//         const layoutFileKey = LAYOUT_FILE as string;
//         const workType = WorkType.MAKE_PAPER;
//
//         const set = {
//             layoutFileKey: layoutFileKey,
//             source: sources,
//             dynamicContents: dynamicContents,
//             workType: workType
//         };
//
//         const params = {
//             FunctionName: QUESTION_SPLIT_LAMBDA as string,
//             InvocationType: "RequestResponse",
//             Payload: JSON.stringify(set)
//         };
//
//         const lambda = new AWS.Lambda();
//         lambda.invoke(params, async function (err, data) {
//             let otherError = undefined;
//             if (typeof data.Payload == "string") {
//                 otherError = JSON.parse(data.Payload).errorMessage;
//             }
//
//             if (err || otherError) {
//                 await transactionManager.runOnTransaction(null, async (t) => {
//                     await work2Service.updateStatus(work, WorkStatus.FAIL, t);
//                     const updateWorkGroup = await workGroupService.updateWorkGroupStatus(workGroup, WorkStatus.FAIL, t);
//                     //TODO AWS SNS PUB
//                 });
//                 throw new Error(otherError || err);
//             } else if (data && data.Payload) {
//                 const response = JSON.parse(data.Payload.toString());
//                 await transactionManager.runOnTransaction(null, async (t) => {
//                     await work2Service.updateStatus(work, WorkStatus.SUCCESS, t);
//                     const updateWorkGroup = await workGroupService.updateWorkGroupStatus(workGroup, WorkStatus.SUCCESS, t);
//                     //TODO AWS SNS PUB
//                 });
//             }
//         });
//     }
//
//     async createWork(workGroup: WorkGroup, key: string): Promise<Work> {
//         const workGroupId = workGroup.workGroupId as string;
//         const status = WorkStatus.WAIT as WorkStatus;
//         const workSchema: Work2Schema = {
//             workGroupId: workGroupId,
//             workId: key,
//             status: status
//         };
//
//         const work = await Work.create(workSchema);
//         return work as Work;
//     }
//
//     async createWorks(workGroup: WorkGroup, keys: string[], outerTransaction?: Transaction): Promise<Work[]> {
//         return await transactionManager.runOnTransaction(outerTransaction, async (t) => {
//             const workGroupId = workGroup.workGroupId as string;
//             const status = WorkStatus.WAIT as WorkStatus;
//             const workSchemas: Work2Schema[] = [];
//
//             for (const key of keys) {
//                 workSchemas.push({
//                     workGroupId: workGroupId,
//                     workId: key,
//                     status: status
//                 });
//             }
//
//             const createdWorks: Work[] = await Work.createList(workSchemas, {transaction: t});
//
//             return createdWorks as Work[];
//         });
//     }
//
//     async countWork(workGroup: WorkGroup): Promise<number> {
//         const count = await WorkGroup.count({
//             include: [{
//                 model: Work,
//                 where: {
//                     workGroupId: workGroup.workGroupId
//                 }
//             }]
//         });
//
//         return count as number;
//     }
//
//     async updateStatus(work: Work, status: WorkStatus, outerTransaction?: Transaction): Promise<Work> {
//         return await work.update({
//             status: status,
//         }, {transaction: outerTransaction});
//     }
//
//     async checkIsSuccess(workGroup: WorkGroup, totalWorkCount: number, outerTransaction: Transaction): Promise<boolean> {
//         const successCount = await Work.count({
//             where: {
//                 [Op.and] : [
//                     {workGroupId: workGroup.workGroupId} ,
//                     {status: { [Op.like]: WorkStatus.SUCCESS } }
//                 ]
//             },
//             transaction: outerTransaction
//         });
//
//         if (successCount == totalWorkCount) {
//             return true;
//         }
//         return false;
//     }
//
//     async checkStatus(workId: string): Promise<string> {
//         const work = await Work.findByPk(workId);
//         if (work == null) {
//             throw new Error(errorStore.NOT_FOUND);
//         }
//
//         const status = work.status;
//         return status;
//     }
//
//
//
//     async mappingData(questionExtractResponse: string[], answerExtractResponse: string[], metadataResponse: MetadataResult[], workGroupId: string, outerTransaction?: Transaction): Promise<Result[]> {
//         const data: Result[] = [];
//
//         try {
//             for (const questionExtractedData of questionExtractResponse ) {
//                 const qEDObject = JSON.parse(questionExtractedData);
//
//                 const cloneQuestionKey = cloneDeep(qEDObject.key);
//                 const questionKeyData: string[] = cloneQuestionKey.split("/");
//
//                 const questionFileName = questionKeyData[questionKeyData.length-1] as string;
//
//                 if (!questionFileName.includes("_WC\.")) {
//                     const questionKey = qEDObject.key as string;
//                     const questionFileMetadata: FileMetadata = {
//                         imageHeight: qEDObject.height as number,
//                         thumbnailKey: qEDObject.thumbnailKey as string,
//                         extractedImageKey: qEDObject.extractedImageKey as string,
//                         text: qEDObject.text as string,
//                         bucket: HWP_METADATA_BUCKET as string
//                     };
//
//                     try {
//                         const [answerKey, answerFileMetadata] = await workInnerService.mappingAnswerMetadata(answerExtractResponse, questionFileName);
//                         const questionMetadata = await workInnerService.mappingMetadata(metadataResponse, questionKey);
//
//                         let questionGroupKey: string | undefined;
//                         let wc: WC | undefined;
//                         if (questionKeyData.length == 5) {
//                             questionGroupKey = questionKeyData[3];
//                             wc = await workInnerService.mappingWC(questionExtractResponse, questionFileName, questionKey);
//                         }
//
//                         const metadata: Metadata = await workInnerService.getMetadata(questionMetadata, questionFileMetadata, answerFileMetadata, );
//                         const result: Result = await workInnerService.getResult(questionGroupKey, wc, questionKey, answerKey, metadata, workGroupId);
//
//                         data.push(result);
//                     } catch (e) {
//                         throw new Error(e);
//                     }
//                 }
//             }
//         } catch (e) {
//             throw new Error(e);
//         }
//
//         return data as Result[];
//     }
//
//     async getWork(workId: string, outerTransaction?: Transaction): Promise<Work> {
//         const work = await Work.findByPk(workId, {transaction: outerTransaction});
//
//         if (!work) {
//             throw new Error(errorStore.NOT_FOUND);
//         }
//
//         return work;
//     }
// }
//
// export const work2Service = new Work2Service();
//# sourceMappingURL=work2.service.js.map