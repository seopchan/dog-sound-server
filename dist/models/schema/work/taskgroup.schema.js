"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskType = exports.TaskGroupStatus = void 0;
var TaskGroupStatus;
(function (TaskGroupStatus) {
    TaskGroupStatus["SUCCESS"] = "SUCCESS";
    TaskGroupStatus["WAIT"] = "WAIT";
    TaskGroupStatus["FAIL"] = "FAIL";
})(TaskGroupStatus = exports.TaskGroupStatus || (exports.TaskGroupStatus = {}));
var TaskType;
(function (TaskType) {
    TaskType["EXTRACT_METADATA"] = "EXTRACT_METADATA";
    TaskType["SPLIT_QUESTION"] = "SPLIT_QUESTION";
    TaskType["MAKE_PAPER"] = "MAKE_PAPER";
})(TaskType = exports.TaskType || (exports.TaskType = {}));
//# sourceMappingURL=taskgroup.schema.js.map