import {SQSMessage} from "sqs-consumer";
import {MessageBodyAttributeMap} from "aws-sdk/clients/sqs";
import {errorStore} from "../util/ErrorStore";
import {awsService} from "./aws.service";
import {LAYOUT_FILE, QUESTION_SPLIT_LAMBDA, SPLIT_QUESTION_SNS} from "../util/secrets";
import {Task} from "../models/table/work/task.model";
import {Transaction} from "sequelize";
import AWS from "aws-sdk";
import {transactionManager} from "../models/DB";
import {taskGroupService} from "./taskGroup.service";
import {TaskGroup} from "../models/table/work/taskgroup.model";
import {SplitQuestionTaskSchema} from "../models/schema/work/splitquestiontask.schema";
import {SplitQuestionTask} from "../models/table/work/splitquestiontask.model";
import {taskService} from "./task.service";
import {TaskStatus} from "../models/schema/work/task.schema";
import {TaskGroupStatus} from "../models/schema/work/taskgroup.schema";
import {workService} from "./work.service";

class SplitQuestionTaskService {
    async createTask(task: Task, questionFileKey: string, answerFileKey: string, outerTransaction?: Transaction): Promise<SplitQuestionTask> {
        const taskId = task.taskId as string;

        const splitQuestionTaskSchema: SplitQuestionTaskSchema = {
            taskId: taskId,
            questionFileKey: questionFileKey,
            answerFileKey: answerFileKey
        };

        const splitQuestionTask = SplitQuestionTask.create(
            splitQuestionTaskSchema,
            {
                transaction: outerTransaction
            }
        );

        return splitQuestionTask;
    }

    async splitQuestion(message: SQSMessage): Promise<void> {
        const params = message.MessageAttributes as MessageBodyAttributeMap;
        if (!params) {
            throw new Error(errorStore.INVALID_PARAM);
        }

        const taskGroupId = params.taskGroupId.StringValue as string;
        const taskId = params.taskId.StringValue as string;
        const splitQuestionTaskId = params.splitQuestionTaskId.StringValue as string;

        try {
            const taskGroup = await taskGroupService.getTaskGroup(taskGroupId);
            if (!taskGroup) {
                throw new Error(errorStore.NOT_FOUND);
            }
            const task = await taskService.getTask(taskId);
            const splitQuestionTask = await splitQuestionTaskService.getSplitQuestionTask(splitQuestionTaskId);

            const questionFileKey: string = splitQuestionTask.questionFileKey;
            const answerFileKey: string = splitQuestionTask.answerFileKey;

            if (!questionFileKey || !answerFileKey) {
                throw new Error(errorStore.NOT_FOUND);
            }

            const updatedTaskGroup = await this.executeQuestionSplit(taskGroup, task, questionFileKey, answerFileKey);
            const updatedWork = await workService.getWorkByTaskGroup(updatedTaskGroup);

            const snsMessage = {
                workKey: updatedWork.workKey,
                fileKeys: JSON.parse(updatedTaskGroup.result)
            };

            await awsService.SNSNotification(JSON.stringify(snsMessage), SPLIT_QUESTION_SNS);
        } catch (e) {
            await awsService.SNSNotification(String(e), SPLIT_QUESTION_SNS);
        }

        return;
    }

    async executeQuestionSplit(taskGroup: TaskGroup, task: Task, questionFileKey: string, answerFileKey: string): Promise<TaskGroup> {
        return new Promise(async (resolve, reject) => {
            const layoutFileKey = LAYOUT_FILE;

            const set = {
                layoutFileKey: layoutFileKey,
                questionFileKey: questionFileKey,
                answerFileKey: answerFileKey
            };
            const params = {
                FunctionName: QUESTION_SPLIT_LAMBDA as string,
                InvocationType: "RequestResponse",
                Payload: JSON.stringify(set)
            };

            const lambda = new AWS.Lambda();
            lambda.invoke(params, async function (err, data) {
                let otherError = undefined;
                if (typeof data.Payload == "string") {
                    otherError = JSON.parse(data.Payload).errorMessage;
                }

                if (err || otherError) {
                    await transactionManager.runOnTransaction(null, async (t) => {
                        await taskService.updateStatus(task, TaskStatus.FAIL, t);
                        await taskGroupService.updateStatus(taskGroup, TaskGroupStatus.FAIL, t);
                    });
                    return reject(otherError || err);
                } else if (data && data.Payload) {
                    let fileKeys: string;
                    if (typeof data.Payload === "string") {
                        fileKeys = data.Payload;
                    } else {
                        reject("SplitResponse Payload Is Not String");
                    }

                    const updateTaskGroup = await transactionManager.runOnTransaction(null, async (t) => {
                        await taskService.updateStatus(task, TaskStatus.SUCCESS, t);
                        await taskService.updateResult(task, fileKeys, t);
                        const updateTaskGroup = await taskGroupService.updateStatus(taskGroup, TaskGroupStatus.SUCCESS, t);
                        const resultAddedTaskGroup = await taskGroupService.updateResult(updateTaskGroup, fileKeys, t);
                        return resultAddedTaskGroup;
                    });

                    return resolve(updateTaskGroup);
                }
            });
        });
    }

    async getSplitQuestionTask(splitQuestionTaskId: string, outerTransaction?: Transaction): Promise<SplitQuestionTask> {
        const splitQuestionTask = await SplitQuestionTask.findByPk(
            splitQuestionTaskId,
            {
                transaction: outerTransaction
            }
        );

        if (!splitQuestionTask) {
            throw new Error(errorStore.NOT_FOUND);
        }

        return splitQuestionTask as SplitQuestionTask;
    }
}

export const splitQuestionTaskService = new SplitQuestionTaskService();