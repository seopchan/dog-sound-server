import { NextFunction, Request, Response } from "express";
import HttpException from "../exception/HttpException";
import logger from "../util/logger";
import {errorStore} from "../util/ErrorStore";

function errorMiddleware(error: HttpException, request: Request, response: Response, next: NextFunction) {
    const status = error.status || 500;

    logger.error(error.stack || "fail to error stack");
    if (errorStore.isInvalidParamError(error)) {
        return response.status(400).sendRs({
            error: {
                code: "Bad Request",
                message: "잘못된 요청입니다.",
            }
        });
    }

    if(errorStore.isNotFoundError(error)) {
        return response.status(404).sendRs({
            error:{
                code: "Not Found",
                message: "요청한 정보를 찾을 수 없습니다."
            }
        });
    }

    if(errorStore.isBadRequestError(error)) {
        return response.status(400).sendRs({
            error: {
                code: "Bad Request",
                message: "잘못된 요청입니다.",
            }
        });
    }

    logger.error(`${error.name} : ${error.message}`);
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

export default errorMiddleware;
