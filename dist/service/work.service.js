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
exports.workService = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const secrets_1 = require("../util/secrets");
const work_model_1 = require("../models/table/work/work.model");
const ErrorStore_1 = require("../util/ErrorStore");
const param_1 = require("../util/param");
aws_sdk_1.default.config.update({
    region: secrets_1.AWS_REGION,
    accessKeyId: secrets_1.AWS_ACCESS_KEY,
    secretAccessKey: secrets_1.AWS_SECRET_ACCESS_KEY
});
class WorkService {
    createWork(taskGroupId, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const invalidParam = !param_1.paramUtil.checkParam(taskGroupId);
            if (invalidParam) {
                throw new Error(ErrorStore_1.errorStore.INVALID_PARAM);
            }
            const workKey = Math.random().toString(8).substring(7);
            const workSchema = {
                workKey: workKey,
                taskGroupId: taskGroupId
            };
            const work = yield work_model_1.Work.create(workSchema, {
                transaction: outerTransaction
            });
            return work;
        });
    }
    getWork(workKey, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const work = yield work_model_1.Work.findByPk(workKey, { transaction: outerTransaction });
            return work;
        });
    }
    getWorkByTaskGroup(taskGroup, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const taskGroupId = taskGroup.taskGroupId;
            const work = yield work_model_1.Work.findOne({
                where: {
                    taskGroupId: taskGroupId
                }
            });
            if (!work) {
                throw new Error(ErrorStore_1.errorStore.NOT_FOUND);
            }
            return work;
        });
    }
}
exports.workService = new WorkService();
//# sourceMappingURL=work.service.js.map