"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMetadataTaskService = void 0;
const secrets_1 = require("../util/secrets");
const semaphore_1 = __importDefault(require("semaphore"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const DB_1 = require("../models/DB");
const task_service_1 = require("./task.service");
const task_schema_1 = require("../models/schema/work/task.schema");
const taskGroup_service_1 = require("./taskGroup.service");
const taskgroup_schema_1 = require("../models/schema/work/taskgroup.schema");
const extractmetadatatask_schema_1 = require("../models/schema/work/extractmetadatatask.schema");
const extractmetadatatask_model_1 = require("../models/table/work/extractmetadatatask.model");
const ErrorStore_1 = require("../util/ErrorStore");
const param_1 = require("../util/param");
const aws_service_1 = require("./aws.service");
const lodash_clonedeep_1 = __importDefault(require("lodash.clonedeep"));
const extractMetadataTask_inner_service_1 = require("./innerService/extractMetadataTask.inner.service");
class ExtractMetadataTaskService {
    extractMetadata(message) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const params = message.MessageAttributes;
            if (!params) {
                throw new Error(ErrorStore_1.errorStore.INVALID_PARAM);
            }
            const metadataKeys = (_a = params.metadataKeys.StringValue) === null || _a === void 0 ? void 0 : _a.split(",");
            const workKey = params.workKey.StringValue;
            const taskGroupId = params.taskGroupId.StringValue;
            const invalidParam = !param_1.paramUtil.checkParam(metadataKeys, workKey, taskGroupId);
            if (invalidParam) {
                throw new Error(ErrorStore_1.errorStore.INVALID_PARAM);
            }
            let taskGroup;
            let tasks;
            try {
                taskGroup = yield taskGroup_service_1.taskGroupService.getTaskGroup(taskGroupId);
                if (!taskGroup) {
                    throw new Error(ErrorStore_1.errorStore.NOT_FOUND);
                }
                tasks = yield taskGroup_service_1.taskGroupService.getTasks(taskGroup);
            }
            catch (e) {
                console.log(e);
                throw new Error(e);
            }
            const s3 = new aws_sdk_1.default.S3({ apiVersion: "2006-03-01" });
            let metadataResponse;
            let updateTaskGroup;
            try {
                metadataResponse = yield this.getMetadataList(metadataKeys, s3, secrets_1.QUESTIONS_BUCKET);
                updateTaskGroup = yield this.executeQuestionMetadataExtract(taskGroup, tasks);
            }
            catch (e) {
                console.log(e);
                throw new Error(e);
            }
            const updateTasks = yield taskGroup_service_1.taskGroupService.getTasks(updateTaskGroup);
            const questionExtractResponse = [];
            const answerExtractResponse = [];
            for (const task of updateTasks) {
                if (task.extractMetadataTask.type == extractmetadatatask_schema_1.ExtractMetadataTaskType.QUESTION) {
                    questionExtractResponse.push(task.result);
                }
                else if (task.extractMetadataTask.type == extractmetadatatask_schema_1.ExtractMetadataTaskType.ANSWER) {
                    answerExtractResponse.push(task.result);
                }
            }
            /**
             * 1. 일반문제 -> 문제+답+메타데이터
             * 2. 공통문제 -> 문제+답+메타데이터+그룹ID+WC
             * 3. 공통문제_WC -> pass
             */
            let data;
            try {
                data = yield this.mappingData(questionExtractResponse, answerExtractResponse, metadataResponse, taskGroupId);
                yield updateTaskGroup.update({
                    result: JSON.stringify(data)
                });
            }
            catch (e) {
                console.log(e);
                throw new Error(e);
            }
            const snsMessage = {
                data: data,
                workKey: workKey
            };
            yield aws_service_1.awsService.SNSNotification(JSON.stringify(snsMessage), secrets_1.EXTRACT_METADATA_SNS);
            return;
        });
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
    executeQuestionMetadataExtract(taskGroup, tasks) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const layoutFileKey = secrets_1.LAYOUT_FILE;
                const totalTaskCount = tasks.length;
                let semaphore = semaphore_1.default(10);
                const responses = [];
                for (const task of tasks) {
                    const set = {
                        layout: layoutFileKey,
                        source: {
                            key: task.taskId,
                            height: null
                        }
                    };
                    const params = {
                        FunctionName: secrets_1.QUESTION_EXTRACTOR_LAMBDA,
                        InvocationType: "RequestResponse",
                        Payload: JSON.stringify(set)
                    };
                    const lambda = new aws_sdk_1.default.Lambda();
                    semaphore.take(function () {
                        lambda.invoke(params, function (err, responseData) {
                            return __awaiter(this, void 0, void 0, function* () {
                                let otherError = undefined;
                                if (typeof responseData.Payload === "string") {
                                    const payload = responseData.Payload;
                                    otherError = JSON.parse(responseData.Payload).errorMessage || null;
                                    if (err || otherError) {
                                        yield DB_1.transactionManager.runOnTransaction(null, (t) => __awaiter(this, void 0, void 0, function* () {
                                            yield task_service_1.taskService.updateStatus(task, task_schema_1.TaskStatus.FAIL, t);
                                            const taskGroupStatus = taskGroup.status;
                                            if (taskGroupStatus == task_schema_1.TaskStatus.WAIT) {
                                                yield taskGroup_service_1.taskGroupService.updateStatus(taskGroup, taskgroup_schema_1.TaskGroupStatus.FAIL, t);
                                            }
                                        }));
                                        if (semaphore) {
                                            semaphore.capacity = 0;
                                            semaphore = null;
                                        }
                                        if (err) {
                                            return reject(new Error(JSON.stringify(err)));
                                        }
                                        else if (otherError) {
                                            return reject(new Error(payload));
                                        }
                                    }
                                    else if (responseData && payload) {
                                        responses.push(payload);
                                        const updateTaskGroup = yield DB_1.transactionManager.runOnTransaction(null, (t) => __awaiter(this, void 0, void 0, function* () {
                                            yield task_service_1.taskService.updateStatus(task, task_schema_1.TaskStatus.SUCCESS, t);
                                            yield task_service_1.taskService.updateResult(task, payload, t);
                                            const isSuccess = yield task_service_1.taskService.checkIsSuccess(taskGroup, totalTaskCount, t);
                                            if (isSuccess) {
                                                const updateTaskGroup = yield taskGroup_service_1.taskGroupService.updateStatus(taskGroup, taskgroup_schema_1.TaskGroupStatus.SUCCESS, t);
                                                const addResultTaskGroup = yield taskGroup_service_1.taskGroupService.updateResult(updateTaskGroup, responses.toString(), t);
                                                return addResultTaskGroup;
                                            }
                                        }));
                                        if (updateTaskGroup && updateTaskGroup.status == taskgroup_schema_1.TaskGroupStatus.SUCCESS) {
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
                                }
                                else {
                                    yield DB_1.transactionManager.runOnTransaction(null, (t) => __awaiter(this, void 0, void 0, function* () {
                                        yield task_service_1.taskService.updateStatus(task, task_schema_1.TaskStatus.FAIL, t);
                                        const taskGroupStatus = taskGroup.status;
                                        if (taskGroupStatus == taskgroup_schema_1.TaskGroupStatus.WAIT) {
                                            yield taskGroup_service_1.taskGroupService.updateStatus(taskGroup, taskgroup_schema_1.TaskGroupStatus.FAIL, t);
                                        }
                                    }));
                                    if (semaphore) {
                                        semaphore.capacity = 0;
                                        semaphore = null;
                                    }
                                    return reject(new Error("Wrong AWS Lambda Payload"));
                                }
                            });
                        });
                    });
                }
            }));
        });
    }
    createTasks(tasks, questionKeys, answerKeys, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const extractMetadataTaskSchemas = [];
            for (const task of tasks) {
                for (const questionKey of questionKeys) {
                    if (task.taskId == questionKey) {
                        extractMetadataTaskSchemas.push({
                            taskId: task.taskId,
                            type: extractmetadatatask_schema_1.ExtractMetadataTaskType.QUESTION
                        });
                    }
                    ;
                }
                for (const answerKey of answerKeys) {
                    if (task.taskId == answerKey) {
                        extractMetadataTaskSchemas.push({
                            taskId: task.taskId,
                            type: extractmetadatatask_schema_1.ExtractMetadataTaskType.ANSWER
                        });
                    }
                    ;
                }
            }
            const extractMetadataTasks = yield extractmetadatatask_model_1.ExtractMetadataTask.createList(extractMetadataTaskSchemas, { transaction: outerTransaction });
            return extractMetadataTasks;
        });
    }
    getMetadataList(metadataKeys, s3, bucket) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const metadataResultList = [];
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
                    const result = yield Promise.all(promises);
                    result.forEach((result) => {
                        const response = result.response;
                        const key = result.key;
                        if (response.Body) {
                            const metadata = response.Body.toString();
                            const metadataResult = {
                                metadata: metadata,
                                key: key
                            };
                            metadataResultList.push(metadataResult);
                        }
                        else {
                            return reject(new Error("BODY IS NULL"));
                        }
                    });
                    resolve(metadataResultList);
                }
                catch (e) {
                    reject(e);
                }
            }));
        });
    }
    mappingData(questionExtractResponse, answerExtractResponse, metadataResponse, taskGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = [];
            try {
                for (const questionExtractedData of questionExtractResponse) {
                    const qEDObject = JSON.parse(questionExtractedData);
                    const cloneQuestionKey = lodash_clonedeep_1.default(qEDObject.key);
                    const questionKeyData = cloneQuestionKey.split("/");
                    const questionFileName = questionKeyData[questionKeyData.length - 1];
                    if (!questionFileName.includes("_WC\.")) {
                        const questionKey = qEDObject.key;
                        const questionFileMetadata = {
                            imageHeight: qEDObject.height,
                            thumbnailKey: qEDObject.thumbnailKey,
                            extractedImageKey: qEDObject.extractedImageKey,
                            text: qEDObject.text,
                            bucket: secrets_1.HWP_METADATA_BUCKET
                        };
                        try {
                            const [answerKey, answerFileMetadata] = yield extractMetadataTask_inner_service_1.extractMetadataTaskInnerService.mappingAnswerMetadata(answerExtractResponse, questionFileName);
                            const questionMetadata = yield extractMetadataTask_inner_service_1.extractMetadataTaskInnerService.mappingMetadata(metadataResponse, questionKey);
                            let questionGroupKey;
                            let wc;
                            if (questionKeyData.length == 5) {
                                questionGroupKey = questionKeyData[3];
                                wc = yield extractMetadataTask_inner_service_1.extractMetadataTaskInnerService.mappingWC(questionExtractResponse, questionFileName, questionKey);
                            }
                            const metadata = yield extractMetadataTask_inner_service_1.extractMetadataTaskInnerService.getMetadata(questionMetadata, questionFileMetadata, answerFileMetadata);
                            const result = yield extractMetadataTask_inner_service_1.extractMetadataTaskInnerService.getResult(questionGroupKey, wc, questionKey, answerKey, metadata, taskGroupId);
                            data.push(result);
                        }
                        catch (e) {
                            throw new Error(e);
                        }
                    }
                }
            }
            catch (e) {
                throw new Error(e);
            }
            return data;
        });
    }
}
exports.extractMetadataTaskService = new ExtractMetadataTaskService();
//# sourceMappingURL=extractMetadataTask.service.js.map