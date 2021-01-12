import {CallbackStatus, WorkGroupSchema, WorkStatus} from "../models/schema/work/workgroup.schema";
import {WorkGroup} from "../models/table/work/workgroup.model";
import {errorStore} from "../util/ErrorStore";
import axios from "axios";
import {workGroupInnerService} from "./innerService/workGroup.inner.service";

class WorkGroupService {
    async createWorkGroup(callbackUrl: string, workGroupId: string): Promise<WorkGroup> {
        const taskKey = Math.random().toString(8).substring(7) as string;
        const status = WorkStatus.WAIT as WorkStatus;

        const workGroupSchema: WorkGroupSchema = {
            workGroupId: workGroupId,
            taskKey: taskKey,
            status: status,
            callbackUrl: callbackUrl,
            callbackStatus: CallbackStatus.NONE,
            retryCount: 0
        };

        const workGroup: WorkGroup = await WorkGroup.create(
            workGroupSchema
        );

        return workGroup as WorkGroup;
    }

    async updateWorkGroupStatus(workGroup: WorkGroup, status: WorkStatus): Promise<WorkGroup> {
        return await workGroup.update({status: status});
    }

    async checkStatus(workGroup: WorkGroup): Promise<string> {
        const workGroupId = workGroup.workGroupId as string;
        const work = await WorkGroup.findByPk(workGroupId);
        if (work == null) {
            throw new Error(errorStore.NOT_FOUND);
        }

        const status = work.status;
        return status;
    }

    async callbackToApiServer(workGroup: WorkGroup) {
        const workGroupId = workGroup.workGroupId as string;
        const callbackUrl = workGroup.callbackUrl as string;
        const taskKey = workGroup.taskKey as string;
        const workGroupStatus = workGroup.status as string;
        const secretKey = process.env.SECRET_KEY as string;
        const data = {
            secretKey: secretKey,
            files: [{
                questionFileUrl: workGroupId,
                questionImage: "/gongback/question/Image",
                answerFileUrl: "/gongback/answer/file",
                answerImage: "/gongback/answer/Image",
                questionContent: "/gongback/question/Content",
                answerContent: "/gongback/answer/Content"
            }]
        };

        return axios.post(
            `${callbackUrl}${taskKey}?workGroupStatus=${workGroupStatus}`, data
        ).then(async (data) => {
            await workGroupInnerService.updateCallbackStatus(workGroup, CallbackStatus.SUCCESS);
            return {data, error:null};
        }).catch(async (error) => {
            await workGroupInnerService.updateCallbackStatus(workGroup, CallbackStatus.RETRY);
            return {data:null, error};
        });

        return;
    }

}

export const workGroupService = new WorkGroupService();