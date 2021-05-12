export enum ExtractMetadataTaskType {
    QUESTION = "QUESTION",
    ANSWER = "ANSWER"
}

export interface ExtractMetadataTaskAttributes {
    taskId?: string;
    type?: string;
}

export interface ExtractMetadataTaskSchema extends ExtractMetadataTaskAttributes{
    taskId: string;
    type: string;
}