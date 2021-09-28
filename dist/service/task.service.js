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
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskService = void 0;
const sequelize_1 = require("sequelize");
const task_model_1 = require("../models/table/work/task.model");
const task_schema_1 = require("../models/schema/work/task.schema");
const taskgroup_schema_1 = require("../models/schema/work/taskgroup.schema");
const ErrorStore_1 = require("../util/ErrorStore");
class TaskService {
    createTask(taskGroup, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const taskGroupId = taskGroup.taskGroupId;
            const taskId = Math.random().toString(8).substring(7);
            const status = task_schema_1.TaskStatus.WAIT;
            const taskSchema = {
                taskGroupId: taskGroupId,
                taskId: taskId,
                status: status,
                type: taskgroup_schema_1.TaskType.EXTRACT_METADATA
            };
            const task = yield task_model_1.Task.create(taskSchema, {
                transaction: outerTransaction
            });
            return task;
        });
    }
    createTasks(taskGroup, keys, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const taskGroupId = taskGroup.taskGroupId;
            const status = task_schema_1.TaskStatus.WAIT;
            const taskSchemas = [];
            for (const key of keys) {
                taskSchemas.push({
                    taskGroupId: taskGroupId,
                    taskId: key,
                    status: status,
                    type: taskgroup_schema_1.TaskType.EXTRACT_METADATA
                });
            }
            const tasks = yield task_model_1.Task.createList(taskSchemas, {
                transaction: outerTransaction
            });
            return tasks;
        });
    }
    updateStatus(task, status, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield task.update({
                status: status,
            }, { transaction: outerTransaction });
        });
    }
    checkIsSuccess(taskGroup, totalTaskCount, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const successCount = yield task_model_1.Task.count({
                where: {
                    [sequelize_1.Op.and]: [
                        { taskGroupId: taskGroup.taskGroupId },
                        { status: task_schema_1.TaskStatus.SUCCESS }
                    ]
                },
                transaction: outerTransaction
            });
            if (successCount == totalTaskCount) {
                return true;
            }
            return false;
        });
    }
    updateResult(task, result, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield task.update({
                result: result
            }, {
                transaction: outerTransaction
            });
        });
    }
    getTask(taskId, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const task = yield task_model_1.Task.findByPk(taskId, {
                transaction: outerTransaction
            });
            if (!task) {
                throw new Error(ErrorStore_1.errorStore.NOT_FOUND);
            }
            return task;
        });
    }
}
exports.taskService = new TaskService();
//# sourceMappingURL=task.service.js.map