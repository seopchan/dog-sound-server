class CheckingUtil{
    checkIsNull(allQuestionKeys: string[], allAnswerKeys: string[], allMetadataKeys: string[]) {
        return allQuestionKeys.length == 0 || allAnswerKeys.length == 0 || allMetadataKeys.length == 0;
    }
}

export const checkingUtil = new CheckingUtil();