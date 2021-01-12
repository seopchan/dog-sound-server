export enum WorkStatus {
    SUCCESS = "SUCCESS",
    WAIT = "WAIT",
    FAIL = "FAIL"
}
export enum CallbackStatus {
    NONE = "NONE",
    SUCCESS = "SUCCESS",
    RETRY = "RETRY",
    FAIL = "FAIL"
}

export interface WorkgroupAttributes {
    workGroupId?: string;
    taskKey?: string;
    status?: string;
    callbackUrl?: string;
    callbackStatus?: string;
    retryCount?: number;
}

export interface WorkGroupSchema extends WorkgroupAttributes {
    workGroupId: string;
    taskKey: string;
    status: string;
    callbackUrl: string;
    callbackStatus: string;
    retryCount: number;
}