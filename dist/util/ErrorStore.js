"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorStore = void 0;
class ErrorStore {
    constructor() {
        this.INVALID_PARAM = "Invalid Param";
        this.NOT_FOUND = "Not Found";
        this.BAD_REQUEST = "Bad Request";
        this.CONFLICT = "Conflict";
        this.UNEXPECTED = "Unexpected";
    }
    isInvalidParamError(error) {
        return error.message == this.INVALID_PARAM;
    }
    isNotFoundError(error) {
        return error.message == this.NOT_FOUND;
    }
    isBadRequestError(error) {
        return error.message == this.BAD_REQUEST;
    }
}
exports.errorStore = new ErrorStore();
//# sourceMappingURL=ErrorStore.js.map