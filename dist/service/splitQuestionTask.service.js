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
exports.splitQuestionTaskService = void 0;
const ErrorStore_1 = require("../util/ErrorStore");
const aws_service_1 = require("./aws.service");
const secrets_1 = require("../util/secrets");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const DB_1 = require("../models/DB");
const taskGroup_service_1 = require("./taskGroup.service");
const splitquestiontask_model_1 = require("../models/table/work/splitquestiontask.model");
const task_service_1 = require("./task.service");
const task_schema_1 = require("../models/schema/work/task.schema");
const taskgroup_schema_1 = require("../models/schema/work/taskgroup.schema");
const work_service_1 = require("./work.service");
class SplitQuestionTaskService {
    createTask(task, questionFileKey, answerFileKey, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const taskId = task.taskId;
            const splitQuestionTaskSchema = {
                taskId: taskId,
                questionFileKey: questionFileKey,
                answerFileKey: answerFileKey
            };
            const splitQuestionTask = splitquestiontask_model_1.SplitQuestionTask.create(splitQuestionTaskSchema, {
                transaction: outerTransaction
            });
            return splitQuestionTask;
        });
    }
    splitQuestion(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = message.MessageAttributes;
            if (!params) {
                throw new Error(ErrorStore_1.errorStore.INVALID_PARAM);
            }
            const taskGroupId = params.taskGroupId.StringValue;
            const taskId = params.taskId.StringValue;
            const splitQuestionTaskId = params.splitQuestionTaskId.StringValue;
            try {
                const taskGroup = yield taskGroup_service_1.taskGroupService.getTaskGroup(taskGroupId);
                if (!taskGroup) {
                    throw new Error(ErrorStore_1.errorStore.NOT_FOUND);
                }
                const task = yield task_service_1.taskService.getTask(taskId);
                const splitQuestionTask = yield exports.splitQuestionTaskService.getSplitQuestionTask(splitQuestionTaskId);
                const questionFileKey = splitQuestionTask.questionFileKey;
                const answerFileKey = splitQuestionTask.answerFileKey;
                if (!questionFileKey || !answerFileKey) {
                    throw new Error(ErrorStore_1.errorStore.NOT_FOUND);
                }
                const updatedTaskGroup = yield this.executeQuestionSplit(taskGroup, task, questionFileKey, answerFileKey);
                const updatedWork = yield work_service_1.workService.getWorkByTaskGroup(updatedTaskGroup);
                const fileKeys = JSON.parse(JSON.parse(updatedTaskGroup.result));
                const snsMessage = {
                    workKey: updatedWork.workKey,
                    fileKeys: fileKeys
                };
                yield aws_service_1.awsService.SNSNotification(JSON.stringify(snsMessage), secrets_1.SPLIT_QUESTION_SNS);
            }
            catch (e) {
                yield aws_service_1.awsService.SNSNotification(String(e), secrets_1.SPLIT_QUESTION_SNS);
            }
            return;
        });
    }
    executeQuestionSplit(taskGroup, task, questionFileKey, answerFileKey) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const layoutFileKey = secrets_1.LAYOUT_FILE;
                const set = {
                    layoutFileKey: layoutFileKey,
                    questionFileKey: questionFileKey,
                    answerFileKey: answerFileKey
                };
                const params = {
                    FunctionName: secrets_1.QUESTION_SPLIT_LAMBDA,
                    InvocationType: "RequestResponse",
                    Payload: JSON.stringify(set)
                };
                const lambda = new aws_sdk_1.default.Lambda();
                lambda.invoke(params, function (err, data) {
                    return __awaiter(this, void 0, void 0, function* () {
                        let otherError = undefined;
                        if (typeof data.Payload == "string") {
                            otherError = JSON.parse(data.Payload).errorMessage;
                        }
                        if (err || otherError) {
                            yield DB_1.transactionManager.runOnTransaction(null, (t) => __awaiter(this, void 0, void 0, function* () {
                                yield task_service_1.taskService.updateStatus(task, task_schema_1.TaskStatus.FAIL, t);
                                yield taskGroup_service_1.taskGroupService.updateStatus(taskGroup, taskgroup_schema_1.TaskGroupStatus.FAIL, t);
                            }));
                            return reject(otherError || err);
                        }
                        else if (data && data.Payload) {
                            let fileKeys;
                            if (typeof data.Payload === "string") {
                                fileKeys = data.Payload;
                            }
                            else {
                                reject("SplitResponse Payload Is Not String");
                            }
                            const updateTaskGroup = yield DB_1.transactionManager.runOnTransaction(null, (t) => __awaiter(this, void 0, void 0, function* () {
                                yield task_service_1.taskService.updateStatus(task, task_schema_1.TaskStatus.SUCCESS, t);
                                yield task_service_1.taskService.updateResult(task, fileKeys, t);
                                const updateTaskGroup = yield taskGroup_service_1.taskGroupService.updateStatus(taskGroup, taskgroup_schema_1.TaskGroupStatus.SUCCESS, t);
                                const resultAddedTaskGroup = yield taskGroup_service_1.taskGroupService.updateResult(updateTaskGroup, fileKeys, t);
                                return resultAddedTaskGroup;
                            }));
                            return resolve(updateTaskGroup);
                        }
                    });
                });
            }));
        });
    }
    getSplitQuestionTask(splitQuestionTaskId, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const splitQuestionTask = yield splitquestiontask_model_1.SplitQuestionTask.findByPk(splitQuestionTaskId, {
                transaction: outerTransaction
            });
            if (!splitQuestionTask) {
                throw new Error(ErrorStore_1.errorStore.NOT_FOUND);
            }
            return splitQuestionTask;
        });
    }
}
exports.splitQuestionTaskService = new SplitQuestionTaskService();
//# sourceMappingURL=splitQuestionTask.service.js.map