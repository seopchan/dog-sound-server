export interface WorkAttributes {
    workKey?: string;
    taskGroupId?: string;
}

export interface WorkSchema extends WorkAttributes {
    workKey: string;
    taskGroupId: string;
}