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
exports.makePaper = exports.questionSplit = exports.hwpMetadataExtract = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const param_1 = require("../util/param");
const checking_1 = require("../util/checking");
const DB_1 = require("../models/DB");
const ErrorStore_1 = require("../util/ErrorStore");
const secrets_1 = require("../util/secrets");
const aws_service_1 = require("../service/aws.service");
const taskGroup_service_1 = require("../service/taskGroup.service");
const work_service_1 = require("../service/work.service");
const taskgroup_schema_1 = require("../models/schema/work/taskgroup.schema");
const task_service_1 = require("../service/task.service");
const extractMetadataTask_service_1 = require("../service/extractMetadataTask.service");
const splitQuestionTask_service_1 = require("../service/splitQuestionTask.service");
aws_sdk_1.default.config.update({
    region: secrets_1.AWS_REGION,
    accessKeyId: secrets_1.AWS_ACCESS_KEY,
    secretAccessKey: secrets_1.AWS_SECRET_ACCESS_KEY
});
exports.hwpMetadataExtract = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const taskGroupId = req.body.taskGroupId;
    if (!param_1.paramUtil.checkParam(taskGroupId)) {
        console.log(Error(ErrorStore_1.errorStore.BAD_REQUEST));
        return res.sendBadRequestError();
    }
    const s3 = new aws_sdk_1.default.S3();
    const bucket = secrets_1.QUESTIONS_BUCKET;
    const questionKeyPrefix = taskGroupId + "/question";
    const answerKeyPrefix = taskGroupId + "/answer";
    const metadataKeyPrefix = taskGroupId + "/questionMetadata";
    // 이미 taskGroup이 있는지 확인
    const taskGroup = yield taskGroup_service_1.taskGroupService.getTaskGroup(taskGroupId);
    if (taskGroup == null) {
        const questionKeys = yield taskGroup_service_1.taskGroupService.getAllKeys(questionKeyPrefix, s3, bucket);
        const answerKeys = yield taskGroup_service_1.taskGroupService.getAllKeys(answerKeyPrefix, s3, bucket);
        const metadataKeys = yield taskGroup_service_1.taskGroupService.getAllKeys(metadataKeyPrefix, s3, bucket);
        if (checking_1.checkingUtil.checkIsNull(questionKeys, answerKeys, metadataKeys)) {
            console.log(Error(ErrorStore_1.errorStore.NOT_FOUND));
            return res.sendNotFoundError();
        }
        const keys = questionKeys.concat(answerKeys);
        let taskGroup;
        let work;
        try {
            [taskGroup, work] = yield DB_1.transactionManager.runOnTransaction(null, (t) => __awaiter(void 0, void 0, void 0, function* () {
                const taskGroup = yield taskGroup_service_1.taskGroupService.createTaskGroup(taskGroupId, t);
                const work = yield work_service_1.workService.createWork(taskGroup.taskGroupId, t);
                const tasks = yield task_service_1.taskService.createTasks(taskGroup, keys, t);
                yield extractMetadataTask_service_1.extractMetadataTaskService.createTasks(tasks, questionKeys, answerKeys, t);
                return [taskGroup, work];
            }));
        }
        catch (e) {
            console.log(e);
            yield aws_service_1.awsService.SNSNotification(String(e), secrets_1.EXTRACT_METADATA_SNS);
            return res.sendRs(e);
        }
        // 즉각 응답
        res.sendRs({
            data: {
                workKey: work.workKey
            }
        });
        // 후처리를 queue로 동작
        const sqsParams = {
            DelaySeconds: 10,
            MessageAttributes: {
                "metadataKeys": {
                    DataType: "String",
                    StringValue: metadataKeys.toString()
                },
                "workKey": {
                    DataType: "String",
                    StringValue: work.workKey
                },
                "taskGroupId": {
                    DataType: "String",
                    StringValue: taskGroup.taskGroupId
                }
            },
            MessageBody: "Lambda(hwp-metadata-extractor) Invoke",
            QueueUrl: secrets_1.EXTRACT_METADATA_SQS_URL
        };
        const sqs = new aws_sdk_1.default.SQS({
            apiVersion: "2012-11-05"
        });
        yield sqs.sendMessage(sqsParams).promise();
    }
    else if (taskGroup.status == taskgroup_schema_1.TaskGroupStatus.SUCCESS) {
        try {
            const work = yield work_service_1.workService.getWorkByTaskGroup(taskGroup);
            res.sendRs({
                data: {
                    workKey: work.workKey
                }
            });
            const resultData = JSON.parse(taskGroup.result);
            if (!resultData) {
                console.log(Error(ErrorStore_1.errorStore.NOT_FOUND));
                yield aws_service_1.awsService.SNSNotification(String(Error(ErrorStore_1.errorStore.NOT_FOUND)), secrets_1.EXTRACT_METADATA_SNS);
            }
            yield aws_service_1.awsService.SNSNotification(JSON.stringify(resultData), secrets_1.EXTRACT_METADATA_SNS);
            return;
        }
        catch (e) {
            yield aws_service_1.awsService.SNSNotification(String(e), secrets_1.EXTRACT_METADATA_SNS);
        }
    }
    else {
        const work = yield work_service_1.workService.getWorkByTaskGroup(taskGroup);
        return res.sendRs({
            data: {
                workKey: work.workKey
            }
        });
    }
    return;
});
exports.questionSplit = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // S3에 저장된 문제와 답 파일의 key
    const questionFileKey = req.body.questionFileKey;
    const answerFileKey = req.body.answerFileKey;
    if (!param_1.paramUtil.checkParam(questionFileKey, answerFileKey)) {
        return res.sendBadRequestError();
    }
    const taskGroupId = yield getTaskGroupId();
    let taskGroup;
    let work;
    let task;
    let splitQuestionTask;
    try {
        [taskGroup, work, task, splitQuestionTask] = yield DB_1.transactionManager.runOnTransaction(null, (t) => __awaiter(void 0, void 0, void 0, function* () {
            const taskGroup = yield taskGroup_service_1.taskGroupService.createTaskGroup(taskGroupId, t);
            const work = yield work_service_1.workService.createWork(taskGroup.taskGroupId, t);
            const task = yield task_service_1.taskService.createTask(taskGroup, t);
            const splitQuestionTask = yield splitQuestionTask_service_1.splitQuestionTaskService.createTask(task, questionFileKey, answerFileKey, t);
            return [taskGroup, work, task, splitQuestionTask];
        }));
    }
    catch (e) {
        console.log(e);
        yield aws_service_1.awsService.SNSNotification(String(e), secrets_1.EXTRACT_METADATA_SNS);
        return res.sendRs(e);
    }
    const workKey = work.workKey;
    res.sendRs({
        data: {
            workKey: workKey
        }
    });
    // TODO 후처리 SQS 통해서 동작
    const sqsParams = {
        DelaySeconds: 10,
        MessageAttributes: {
            "taskGroupId": {
                DataType: "String",
                StringValue: taskGroup.taskGroupId
            },
            "taskId": {
                DataType: "String",
                StringValue: task.taskId
            },
            "splitQuestionTaskId": {
                DataType: "String",
                StringValue: splitQuestionTask.taskId
            }
        },
        MessageBody: "Lambda(question-split) Invoke",
        QueueUrl: secrets_1.SPLIT_QUESTION_SQS_URL
    };
    const sqs = new aws_sdk_1.default.SQS({
        apiVersion: "2012-11-05"
    });
    yield sqs.sendMessage(sqsParams).promise();
});
exports.makePaper = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const questionFileKeys = req.body.questionFileKeys;
    const dynamicContents = req.body.dynamicContents;
    if (!param_1.paramUtil.checkParam(questionFileKeys)) {
        return res.sendBadRequestError();
    }
    const taskGroupId = yield getTaskGroupId();
    let taskGroup;
    let work;
    try {
        [taskGroup, work] = yield DB_1.transactionManager.runOnTransaction(null, (t) => __awaiter(void 0, void 0, void 0, function* () {
            const taskGroup = yield taskGroup_service_1.taskGroupService.createTaskGroup(taskGroupId, t);
            const work = yield work_service_1.workService.createWork(taskGroup.taskGroupId, t);
            return [taskGroup, work];
        }));
    }
    catch (e) {
        console.log(e);
        yield aws_service_1.awsService.SNSNotification(String(e), secrets_1.EXTRACT_METADATA_SNS);
        return res.sendRs(e);
    }
    res.sendRs({
        data: {
            workKey: work.workKey
        }
    });
    try {
        // TODO SQS
        // await workService.executeMakePaper(questionWorkGroup, questionWork, questionFileKeys, dynamicContents);
    }
    catch (e) {
        return res.sendBadRequestError(e);
    }
});
function getTaskGroupId() {
    return __awaiter(this, void 0, void 0, function* () {
        const date = new Date();
        const year = date.getFullYear();
        const month = ("0" + (1 + date.getMonth())).slice(-2);
        const day = ("0" + date.getDate()).slice(-2);
        return (year + "-" + month + "-" + day + "/" + (yield uuidv4()));
    });
}
function uuidv4() {
    return __awaiter(this, void 0, void 0, function* () {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    });
}
//# sourceMappingURL=work.controller.js.map