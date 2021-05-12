export enum TaskGroupStatus {
    SUCCESS = "SUCCESS",
    WAIT = "WAIT",
    FAIL = "FAIL"
}

export enum TaskType {
    EXTRACT_METADATA = "EXTRACT_METADATA",
    SPLIT_QUESTION = "SPLIT_QUESTION",
    MAKE_PAPER = "MAKE_PAPER"
}

export interface TaskGroupAttributes {
    taskGroupId?: string;
    status?: string;
    result?: string;
}

export interface TaskGroupSchema extends TaskGroupAttributes {
    taskGroupId: string;
    status: string;
    result?: string;
}