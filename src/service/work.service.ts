import AWS from "aws-sdk";
import {AWS_ACCESS_KEY, AWS_REGION, AWS_SECRET_ACCESS_KEY} from "../util/secrets";
import {Work} from "../models/table/work/work.model";
import {WorkSchema} from "../models/schema/work/work.schema";
import {Op, Transaction} from "sequelize";
import {errorStore} from "../util/ErrorStore";
import {paramUtil} from "../util/param";

AWS.config.update({
    region: AWS_REGION,
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
});

class WorkService {
    async createWork(taskGroupId: string, outerTransaction?: Transaction): Promise<Work> {
        const invalidParam = !paramUtil.checkParam(taskGroupId);

        if (invalidParam) {
            throw new Error(errorStore.INVALID_PARAM);
        }

        const workKey = Math.random().toString(8).substring(7) as string;

        const workSchema: WorkSchema = {
            workKey: workKey,
            taskGroupId: taskGroupId
        };

        const work = await Work.create(workSchema, {
            transaction: outerTransaction
        });

        return work as Work;
    }

    async getWork(workKey: string, outerTransaction?: Transaction): Promise<Work | null> {
        const work = await Work.findByPk(workKey, {transaction: outerTransaction});

        return work;
    }

    async getWorkByTaskGroup(taskGroupId: string, outerTransaction?: Transaction): Promise<Work> {
        const work = await Work.findOne({
            where: {
                [Op.like] : {
                    taskGroupId: taskGroupId
                }
            },
            transaction: outerTransaction
        });

        if (!work) {
            throw new Error(errorStore.NOT_FOUND);
        }

        return work as Work;
    }
}

export const workService = new WorkService();