import {CallbackStatus, WorkGroupSchema, WorkStatus} from "../models/schema/work/workgroup.schema";
import {WorkGroup} from "../models/table/work/workgroup.model";
import {errorStore} from "../util/ErrorStore";
import {transactionManager} from "../models/DB";
import {Transaction} from "sequelize";

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

    // async callbackToApiServer(workGroup: WorkGroup, responses?: JSON[]) {
    //     const workGroupId = workGroup.workGroupId as string;
    //     const callbackUrl = workGroup.callbackUrl as string;
    //     const workKey = workGroup.workKey as string;
    //     const workGroupStatus = workGroup.status as string;
    //     const secretKey = process.env.SECRET_KEY as string;
    //     const data = {
    //         secretKey: secretKey,
    //         metadatas: responses
    //     };
    //
    //     return axios.post(
    //         `${callbackUrl}${workKey}?workGroupStatus=${workGroupStatus}`, data
    //     ).then(async (data) => {
    //         await workGroupInnerService.updateCallbackStatus(workGroup, CallbackStatus.SUCCESS);
    //         return {data, error:null};
    //     }).catch(async (error) => {
    //         await workGroupInnerService.updateCallbackStatus(workGroup, CallbackStatus.RETRY);
    //         return {data:null, error};
    //     });
    //
    //     return;
    // }
}

export const workGroupService = new WorkGroupService();