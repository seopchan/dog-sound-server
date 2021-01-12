class ErrorStore {
    INVALID_PARAM = "Invalid Param";
    isInvalidParamError(error: Error) {
        return error.message == this.INVALID_PARAM;
    }

    NOT_FOUND = "Not Found";
    isNotFoundError(error: Error) {
        return error.message == this.NOT_FOUND;
    }

    BAD_REQUEST = "Bad Request";
    isBadRequestError(error: Error) {
        return error.message == this.BAD_REQUEST;
    }

    CONFLICT = "Conflict";
    UNEXPECTED = "Unexpected";

}
export const errorStore = new ErrorStore();
