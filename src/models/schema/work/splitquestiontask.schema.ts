export interface SplitQuestionTaskAttributes {
    taskId?: string;
    questionFileKey?: string;
    answerFileKey?: string;
}

export interface SplitQuestionTaskSchema extends SplitQuestionTaskAttributes {
    taskId: string;
    questionFileKey: string;
    answerFileKey: string;
}