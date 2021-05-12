export enum TaskStatus {
    SUCCESS = "SUCCESS",
    WAIT = "WAIT",
    FAIL = "FAIL"
}

export interface TaskAttributes {
    taskId?: string;
    taskGroupId?: string;
    type?: string;
    status?: string;
    result?: string;
}

export interface TaskSchema extends TaskAttributes {
    taskId: string;
    taskGroupId: string;
    type: string;
    status: string;
    result?: string;
}