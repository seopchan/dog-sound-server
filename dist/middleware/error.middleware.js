"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../util/logger"));
const ErrorStore_1 = require("../util/ErrorStore");
function errorMiddleware(error, request, response, next) {
    const status = error.status || 500;
    logger_1.default.error(error.stack || "fail to error stack");
    if (ErrorStore_1.errorStore.isInvalidParamError(error)) {
        return response.status(400).sendRs({
            error: {
                code: "Bad Request",
                message: "잘못된 요청입니다.",
            }
        });
    }
    if (ErrorStore_1.errorStore.isNotFoundError(error)) {
        return response.status(404).sendRs({
            error: {
                code: "Not Found",
                message: "요청한 정보를 찾을 수 없습니다."
            }
        });
    }
    if (ErrorStore_1.errorStore.isBadRequestError(error)) {
        return response.status(400).sendRs({
            error: {
                code: "Bad Request",
                message: "잘못된 요청입니다.",
            }
        });
    }
    logger_1.default.error(`${error.name} : ${error.message}`);
    console.log(error.stack);
    //TODO log url / data
    response
        .status(status)
        .sendRs({
        error: {
            code: "UNEXPECTED_EXCEPTION"
        }
    });
}
exports.default = errorMiddleware;
//# sourceMappingURL=error.middleware.js.map