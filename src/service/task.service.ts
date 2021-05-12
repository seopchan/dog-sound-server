import {Op, Transaction} from "sequelize";
import {Task} from "../models/table/work/task.model";
import {TaskSchema, TaskStatus} from "../models/schema/work/task.schema";
import {TaskGroup} from "../models/table/work/taskgroup.model";
import {TaskGroupStatus, TaskType} from "../models/schema/work/taskgroup.schema";
import {errorStore} from "../util/ErrorStore";

class TaskService {
    async createTask(taskGroup: TaskGroup, outerTransaction?: Transaction): Promise<Task> {
        const taskGroupId = taskGroup.taskGroupId as string;
        const taskId = Math.random().toString(8).substring(7) as string;
        const status = TaskStatus.WAIT as TaskStatus;

        const taskSchema: TaskSchema = {
            taskGroupId: taskGroupId,
            taskId: taskId,
            status: status,
            type: TaskType.EXTRACT_METADATA
        };

        const task: Task = await Task.create(
            taskSchema,
            {
                transaction: outerTransaction
            }
        );

        return task;
    }

    async createTasks(taskGroup: TaskGroup, keys: string[], outerTransaction?: Transaction): Promise<Task[]> {
        const taskGroupId = taskGroup.taskGroupId as string;
        const status = TaskStatus.WAIT as TaskStatus;
        const taskSchemas: TaskSchema[] = [];

        for (const key of keys) {
            taskSchemas.push({
                taskGroupId: taskGroupId,
                taskId: key,
                status: status,
                type: TaskType.EXTRACT_METADATA
            });
        }

        const tasks: Task[] = await Task.createList(
            taskSchemas, {
                transaction: outerTransaction
            }
        );

        return tasks as Task[];
    }

    async updateStatus(task: Task, status: TaskStatus, outerTransaction?: Transaction): Promise<Task> {
        return await task.update({
            status: status,
        }, {transaction: outerTransaction});
    }

    async checkIsSuccess(taskGroup: TaskGroup, totalTaskCount: number, outerTransaction: Transaction): Promise<boolean> {
        const successCount = await Task.count({
            where: {
                [Op.and] : [
                    { taskGroupId: taskGroup.taskGroupId } ,
                    { status: TaskStatus.SUCCESS }
                ]
            },
            transaction: outerTransaction
        });

        if (successCount == totalTaskCount) {
            return true;
        }
        return false;
    }

    async updateResult(task: Task, result: string, outerTransaction?: Transaction): Promise<Task> {
        return await task.update({
            result: result
        }, {
            transaction: outerTransaction
        });
    }

    async getTask(taskId: string, outerTransaction?: Transaction): Promise<Task> {
        const task = await Task.findByPk(taskId, {
            transaction: outerTransaction
        });

        if (!task) {
            throw new Error(errorStore.NOT_FOUND);
        }

        return task as Task;
    }
}

export const taskService = new TaskService();