import {CallbackStatus, WorkGroupSchema, WorkStatus} from "../models/schema/work/workgroup.schema";
import {WorkGroup} from "../models/table/work/workgroup.model";
import {errorStore} from "../util/ErrorStore";
import {transactionManager} from "../models/DB";
import {Transaction} from "sequelize";
import {paramUtil} from "../util/param";

class WorkGroupService {
    async createWorkGroup(workGroupId: string, outerTransaction?: Transaction, workKey?: string): Promise<WorkGroup> {
        return await transactionManager.runOnTransaction(outerTransaction, async (t) => {
            if (typeof workKey == "undefined") {
                workKey = Math.random().toString(8).substring(7) as string;
            }
            const status = WorkStatus.WAIT as WorkStatus;

            const workGroupSchema: WorkGroupSchema = {
                workGroupId: workGroupId,
                workKey: workKey,
                status: status,
                callbackStatus: CallbackStatus.NONE,
                retryCount: 0
            };

            const workGroup: WorkGroup = await WorkGroup.create(
                workGroupSchema,
                {transaction: t}
            );

            return workGroup as WorkGroup;
        });
    }

    async updateWorkGroupStatus(workGroup: WorkGroup, status: WorkStatus, outerTransaction?: Transaction): Promise<WorkGroup> {
        return await transactionManager.runOnTransaction(outerTransaction, async (t) => {
            return await workGroup.update({status: status});
        });
    }

    async checkStatus(workGroup: WorkGroup, outerTransaction?: Transaction): Promise<string> {
        return await transactionManager.runOnTransaction(outerTransaction, async (t) => {
            const workGroupId = workGroup.workGroupId as string;
            const work = await WorkGroup.findByPk(workGroupId);
            if (work == null) {
                throw new Error(errorStore.NOT_FOUND);
            }

            const status = work.status;
            return status;
        });
    }

    async getWorkGroupStatus(workGroupId: string, outerTransaction?: Transaction): Promise<WorkStatus | null> {
        const invalidParam = !paramUtil.checkParam(workGroupId);

        if (invalidParam) {
            throw new Error(errorStore.INVALID_PARAM);
        }

        const workGroup: WorkGroup | null = await WorkGroup.findOne({
            where: {
                workGroupId: workGroupId,
            },
            transaction: outerTransaction
        });

        if (workGroup) {
            return workGroup.status as WorkStatus;
        }

        return null;
    }
}

export const workGroupService = new WorkGroupService();