export interface WorkAttributes {
    workId?: string;
    status?: string;
}

export interface WorkSchema extends WorkAttributes {
    workGroupId: string;
    workId: string;
    status: string;
}