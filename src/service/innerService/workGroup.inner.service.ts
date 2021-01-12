import {WorkGroup} from "../../models/table/work/workgroup.model";
import {CallbackStatus} from "../../models/schema/work/workgroup.schema";

export default class WorkGroupInnerService {
    async updateCallbackStatus(workGroup: WorkGroup, status: CallbackStatus): Promise<WorkGroup> {
        let updateWorkGroup;
        switch (status) {
            case CallbackStatus.SUCCESS:
                updateWorkGroup = await workGroup.update({
                    callbackStatus: status,
                });
                break;
            case CallbackStatus.FAIL:
                const retryCount = workGroup.retryCount;
                if(retryCount == 5) {
                    updateWorkGroup = await workGroup.update({
                        callbackStatus: CallbackStatus.FAIL
                    });
                }
                updateWorkGroup = await workGroup.update({
                    callbackStatus: CallbackStatus.RETRY,
                    retryCount: retryCount+1
                });
                break;
        }
        return updateWorkGroup as WorkGroup;
    }
}

export const workGroupInnerService = new WorkGroupInnerService();
