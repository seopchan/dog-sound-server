import {NextFunction, Request, Response} from "express";
import AWS from "aws-sdk";
import {paramUtil} from "../util/param";
import {checkingUtil} from "../util/checking";
import {transactionManager} from "../models/DB";
import {errorStore} from "../util/ErrorStore";
import {
    AWS_ACCESS_KEY,
    AWS_REGION,
    AWS_SECRET_ACCESS_KEY, EXTRACT_METADATA_SNS,
    EXTRACT_METADATA_SQS_URL,
    QUESTIONS_BUCKET, SPLIT_QUESTION_SQS_URL
} from "../util/secrets";
import {awsService} from "../service/aws.service";
import {TaskGroup} from "../models/table/work/taskgroup.model";
import {taskGroupService} from "../service/taskGroup.service";
import {Work} from "../models/table/work/work.model";
import {workService} from "../service/work.service";
import {TaskGroupStatus} from "../models/schema/work/taskgroup.schema";
import {taskService} from "../service/task.service";
import {extractMetadataTaskService} from "../service/extractMetadataTask.service";
import {Task} from "../models/table/work/task.model";
import {splitQuestionTaskService} from "../service/splitQuestionTask.service";
import {SplitQuestionTask} from "../models/table/work/splitquestiontask.model";
import {JsonObject} from "swagger-ui-express";

AWS.config.update({
   region: AWS_REGION,
   accessKeyId: AWS_ACCESS_KEY,
   secretAccessKey: AWS_SECRET_ACCESS_KEY
});

export const hwpMetadataExtract = async(req: Request, res: Response, next: NextFunction) => {
    const taskGroupId = req.body.taskGroupId as string;

    if (!paramUtil.checkParam(taskGroupId)) {
        console.log(Error(errorStore.BAD_REQUEST));
        return res.sendBadRequestError();
    }

    const s3 = new AWS.S3();

    const bucket = QUESTIONS_BUCKET as string;

    const questionKeyPrefix = taskGroupId + "/question";
    const answerKeyPrefix = taskGroupId + "/answer";
    const metadataKeyPrefix  = taskGroupId + "/questionMetadata";

    // 이미 taskGroup이 있는지 확인
    const taskGroup: TaskGroup | null = await taskGroupService.getTaskGroup(taskGroupId);

    if (taskGroup == null) {
        const questionKeys = await taskGroupService.getAllKeys(questionKeyPrefix, s3, bucket);
        const answerKeys = await taskGroupService.getAllKeys(answerKeyPrefix, s3, bucket);
        const metadataKeys = await taskGroupService.getAllKeys(metadataKeyPrefix, s3, bucket);

        if (checkingUtil.checkIsNull(questionKeys, answerKeys, metadataKeys)) {
            console.log(Error(errorStore.NOT_FOUND));
            return res.sendNotFoundError();
        }

        const keys: string[] = questionKeys.concat(answerKeys);

        let taskGroup: TaskGroup;
        let work: Work;
        try {
            [taskGroup, work] = await transactionManager.runOnTransaction(null, async (t) => {
                const taskGroup = await taskGroupService.createTaskGroup(taskGroupId, t);
                const work = await workService.createWork(taskGroup.taskGroupId, t);
                const tasks: Task[] = await taskService.createTasks(taskGroup, keys, t);
                await extractMetadataTaskService.createTasks(tasks, questionKeys, answerKeys, t);

                return [taskGroup, work];
            });
        } catch (e) {
            console.log(e);
            await awsService.SNSNotification(String(e), EXTRACT_METADATA_SNS);
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
            QueueUrl: EXTRACT_METADATA_SQS_URL as string
        };
        const sqs = new AWS.SQS({
            apiVersion: "2012-11-05"
        });
        await sqs.sendMessage(sqsParams).promise();
    } else if (taskGroup.status == TaskGroupStatus.SUCCESS){
        try {
            const work = await workService.getWorkByTaskGroup(taskGroup.taskGroupId);

            res.sendRs({
                data: {
                    workKey: work.workKey
                }
            });

            const resultData = JSON.parse(taskGroup.result);

            if (!resultData) {
                console.log(Error(errorStore.NOT_FOUND));
                await awsService.SNSNotification(String(Error(errorStore.NOT_FOUND)), EXTRACT_METADATA_SNS);
            }

            await awsService.SNSNotification(JSON.stringify(resultData), EXTRACT_METADATA_SNS);
            return;

        } catch (e) {
            await awsService.SNSNotification(String(e), EXTRACT_METADATA_SNS);
        }
    } else {
        const work = await workService.getWorkByTaskGroup(taskGroup.taskGroupId);

        return res.sendRs({
            data: {
                workKey: work.workKey
            }
        });
    }

    return;
};

export const questionSplit = async(req: Request, res: Response, next: NextFunction) => {
    // S3에 저장된 문제와 답 파일의 key
    const questionFileKey = req.body.questionFileKey as string;
    const answerFileKey = req.body.answerFileKey as string;

    if (!paramUtil.checkParam(questionFileKey, answerFileKey)) {
        return res.sendBadRequestError();
    }

    const taskGroupId: string = await getTaskGroupId();

    let taskGroup: TaskGroup;
    let work: Work;
    let task: Task;
    let splitQuestionTask: SplitQuestionTask;
    try {
        [taskGroup, work, task, splitQuestionTask] = await transactionManager.runOnTransaction(null, async (t) => {
            const taskGroup = await taskGroupService.createTaskGroup(taskGroupId, t);
            const work = await workService.createWork(taskGroup.taskGroupId, t);
            const task = await taskService.createTask(taskGroup, t);
            const splitQuestionTask = await splitQuestionTaskService.createTask(task, questionFileKey, answerFileKey, t);

            return [taskGroup, work, task, splitQuestionTask];
        });
    } catch(e) {
        console.log(e);
        await awsService.SNSNotification(String(e), EXTRACT_METADATA_SNS);
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
        QueueUrl: SPLIT_QUESTION_SQS_URL as string
    };

    const sqs = new AWS.SQS({
        apiVersion: "2012-11-05"
    });
    await sqs.sendMessage(sqsParams).promise();
};

export const makePaper = async(req: Request, res: Response, next: NextFunction) => {
    const questionFileKeys = req.body.questionFileKeys as string[];
    const dynamicContents = req.body.dynamicContents as JsonObject;

    if (!paramUtil.checkParam(questionFileKeys)) {
        return res.sendBadRequestError();
    }

    const taskGroupId = await getTaskGroupId();

    let taskGroup: TaskGroup;
    let work: Work;
    [taskGroup, work] = await transactionManager.runOnTransaction(null, async (t) => {
        const taskGroup = await taskGroupService.createTaskGroup(taskGroupId);
        const work = await workService.createWork(taskGroup.taskGroupId);

        return [taskGroup, work];
    });

    res.sendRs({
        data: {
            workKey: work.workKey
        }
    });

    try {
        // TODO SQS
        // await workService.executeMakePaper(questionWorkGroup, questionWork, questionFileKeys, dynamicContents);
    } catch (e) {
        return res.sendBadRequestError(e);
    }
};

async function getTaskGroupId(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = ("0" + (1 + date.getMonth())).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);

    return (year + "-" + month + "-" + day+ "/" + await uuidv4()) as string;
}

async function uuidv4(): Promise<string> {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16) as string;
    });
}