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
exports.taskGroupService = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const secrets_1 = require("../util/secrets");
const taskgroup_model_1 = require("../models/table/work/taskgroup.model");
const taskgroup_schema_1 = require("../models/schema/work/taskgroup.schema");
const param_1 = require("../util/param");
const ErrorStore_1 = require("../util/ErrorStore");
const task_model_1 = require("../models/table/work/task.model");
const extractmetadatatask_model_1 = require("../models/table/work/extractmetadatatask.model");
aws_sdk_1.default.config.update({
    region: secrets_1.AWS_REGION,
    accessKeyId: secrets_1.AWS_ACCESS_KEY,
    secretAccessKey: secrets_1.AWS_SECRET_ACCESS_KEY
});
class TaskGroupService {
    createTaskGroup(taskGroupId, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const invalidParam = !param_1.paramUtil.checkParam(taskGroupId);
            if (invalidParam) {
                throw new Error(ErrorStore_1.errorStore.INVALID_PARAM);
            }
            const taskGroupSchema = {
                taskGroupId: taskGroupId,
                status: taskgroup_schema_1.TaskGroupStatus.WAIT
            };
            const taskGroup = yield taskgroup_model_1.TaskGroup.create(taskGroupSchema, {
                transaction: outerTransaction
            });
            return taskGroup;
        });
    }
    getTaskGroup(taskGroupId, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield taskgroup_model_1.TaskGroup.findOne({
                where: {
                    taskGroupId: taskGroupId
                },
                transaction: outerTransaction
            });
        });
    }
    updateStatus(taskGroup, status, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield taskGroup.update({
                status: status
            }, {
                transaction: outerTransaction
            });
        });
    }
    updateResult(taskGroup, result, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield taskGroup.update({
                result: result
            }, {
                transaction: outerTransaction
            });
        });
    }
    getAllKeys(taskGroupId, s3, bucket, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const allKeys = [];
            if (!params) {
                params = {
                    Bucket: bucket,
                    Prefix: taskGroupId + "/"
                };
            }
            const response = yield s3.listObjectsV2(params).promise();
            if (response.Contents) {
                response.Contents.forEach(content => {
                    const key = content.Key;
                    allKeys.push(key);
                });
            }
            if (response.NextContinuationToken) {
                params.ContinuationToken = response.NextContinuationToken;
                const nextAllKeys = yield this.getAllKeys(taskGroupId, s3, bucket, params);
                allKeys.concat(nextAllKeys);
            }
            return allKeys;
        });
    }
    getTasks(taskGroup) {
        return __awaiter(this, void 0, void 0, function* () {
            const taskGroupId = taskGroup.taskGroupId;
            const tasks = yield task_model_1.Task.findAll({
                include: [{
                        model: extractmetadatatask_model_1.ExtractMetadataTask,
                    }],
                where: {
                    taskGroupId: taskGroupId
                }
            });
            if (!tasks || tasks.length == 0) {
                throw new Error(ErrorStore_1.errorStore.NOT_FOUND);
            }
            return tasks;
        });
    }
}
exports.taskGroupService = new TaskGroupService();
//# sourceMappingURL=taskGroup.service.js.map