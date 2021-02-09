import {WorkGroup} from "../models/table/work/workgroup.model";
import {WorkStatus} from "../models/schema/work/workgroup.schema";
import {Work} from "../models/table/work/work.model";
import {WorkSchema} from "../models/schema/work/work.schema";
import {Op} from "sequelize";
import {errorStore} from "../util/ErrorStore";

class WorkService {
    async createWorks(workGroup: WorkGroup, keys: string[]): Promise<Work[]> {
        const workGroupId = workGroup.workGroupId as string;
        const status = WorkStatus.WAIT as WorkStatus;
        const workSchemas: WorkSchema[] = [];

        for (const key of keys) {
            workSchemas.push({
                workGroupId: workGroupId,
                workId: key,
                status: status
            });
        }

        const createdWorks: Work[] = await Work.createList(workSchemas);

        return createdWorks as Work[];
    }

    async countWork(workGroup: WorkGroup): Promise<number> {
        const count = await WorkGroup.count({
            include: [{
                model: Work,
                where: {
                    workGroupId: workGroup.workGroupId
                }
            }]
        });

        return count as number;
    }

    async updateStatus(work: Work, status: WorkStatus): Promise<Work> {
        return await work.update({
            status: status
        });
    }

    async checkIsSuccess(workGroup: WorkGroup, totalWorkCount: number): Promise<boolean> {
        const successCount = await Work.count({
            where: {
                [Op.and] : [
                    {workGroupId: workGroup.workGroupId} ,
                    {status: { [Op.like]: WorkStatus.SUCCESS } }
                ]
            }
        });

        if (successCount == totalWorkCount) {
            return true;
        }
        return false;
    }

    async checkStatus(workId: string): Promise<string> {
        const work = await Work.findByPk(workId);
        if (work == null) {
            throw new Error(errorStore.NOT_FOUND);
        }

        const status = work.status;
        return status;
    }
}

export const workService = new WorkService();