"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkingUtil = void 0;
class CheckingUtil {
    checkIsNull(allQuestionKeys, allAnswerKeys, allMetadataKeys) {
        return allQuestionKeys.length == 0 || allAnswerKeys.length == 0 || allMetadataKeys.length == 0;
    }
}
exports.checkingUtil = new CheckingUtil();
//# sourceMappingURL=checking.js.map