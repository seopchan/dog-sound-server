import AWS from "aws-sdk";
import {AWS_ACCESS_KEY, AWS_REGION, AWS_SECRET_ACCESS_KEY,} from "../util/secrets";
import {Transaction} from "sequelize";
import {TaskGroup} from "../models/table/work/taskgroup.model";
import {TaskGroupSchema, TaskGroupStatus} from "../models/schema/work/taskgroup.schema";
import {paramUtil} from "../util/param";
import {errorStore} from "../util/ErrorStore";
import {Task} from "../models/table/work/task.model";
import {ExtractMetadataTask} from "../models/table/work/extractmetadatatask.model";

AWS.config.update({
    region: AWS_REGION,
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
});

class TaskGroupService {
    async createTaskGroup(taskGroupId: string, outerTransaction?: Transaction): Promise<TaskGroup> {
        const invalidParam = !paramUtil.checkParam(taskGroupId);

        if (invalidParam) {
            throw new Error(errorStore.INVALID_PARAM);
        }

        const taskGroupSchema: TaskGroupSchema = {
            taskGroupId: taskGroupId,
            status: TaskGroupStatus.WAIT
        };

        const taskGroup = await TaskGroup.create(
            taskGroupSchema,
            {
                transaction : outerTransaction
            }
        );

        return taskGroup;
    }

    async getTaskGroup(taskGroupId: string, outerTransaction?: Transaction): Promise<TaskGroup | null> {
        return await TaskGroup.findOne({
            where: {
                taskGroupId: taskGroupId
            },
            transaction: outerTransaction
        }) as TaskGroup | null;
    }

    async updateStatus(taskGroup: TaskGroup, status: TaskGroupStatus, outerTransaction?: Transaction): Promise<TaskGroup> {
        return await taskGroup.update({
            status: status
        }, {
            transaction: outerTransaction
        });
    }

    async updateResult(taskGroup: TaskGroup, result: string, outerTransaction?: Transaction): Promise<TaskGroup> {
        return await taskGroup.update({
            result: result
        }, {
            transaction: outerTransaction
        });
    }

    async getAllKeys(taskGroupId: string, s3: AWS.S3, bucket: string, params?: any): Promise<string[]> {
        const allKeys: string[] = [];

        if(!params) {
            params = {
                Bucket: bucket,
                Prefix: taskGroupId+"/"
            };
        }

        const response = await s3.listObjectsV2(params).promise();
        if(response.Contents) {
            response.Contents.forEach( content => {
                const key = content.Key as string;
                allKeys.push(key);
            } );
        }
        if (response.NextContinuationToken) {
            params.ContinuationToken = response.NextContinuationToken;
            const nextAllKeys = await this.getAllKeys(taskGroupId, s3, bucket, params);
            allKeys.concat(nextAllKeys);
        }

        return allKeys as string[];
    }

    async getTasks(taskGroup: TaskGroup): Promise<Task[]> {
        const taskGroupId = taskGroup.taskGroupId as string;

        const tasks: Task[] = await Task.findAll({
            include: [{
                model: ExtractMetadataTask,
            }],
            where: {
                taskGroupId: taskGroupId
            }
        });

        if (!tasks || tasks.length == 0) {
            throw new Error(errorStore.NOT_FOUND);
        }

        return tasks as Task[];
    }
}

export const taskGroupService = new TaskGroupService();