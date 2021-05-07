import { NextFunction, Request, Response } from "express";

export enum UserType {
    UNKNOWN, STUDENT, TEACHER
}
declare global {
    namespace Express {
        interface Response {
            sendRs(rs: Rs): Response;
            sendBadRequestError(message?: string): Response;
            sendInvalidParamError(message?: string): Response;
            sendForbiddenError(message?: string): Response;
            sendUnauthorizedError(message?: string): Response;
            sendNotFoundError(message?: string): Response;
        }
        interface Request {
            userId: string;
            userType: UserType;
            isStudent: () => boolean;
            isTeacher: () => boolean;
        }
    }
}

export interface Rs {
    data?: object;
    error?: {
        code: string;
        message?: string;
    };
}

export const requestMiddleware = (request: Request, response: Response, next: NextFunction) => {
    request.isStudent = (): boolean => {
        return request.userType === UserType.STUDENT;
    };
    request.isTeacher = (): boolean => {
        return request.userType === UserType.TEACHER;
    };

    next();
};

export const responseMiddleware = (request: Request, response: Response, next: NextFunction) => {
    response.sendRs = (rs: Rs): Response => {
        return response.send(rs);
    };
    response.sendBadRequestError = (message?: string): Response => {
        return response.status(400).send({
            error: {
                code: "Bad Request",
                message: message || "잘못된 요청입니다.",
            }
        });
    };
    response.sendUnauthorizedError = (message?: string): Response => {
        return response.status(401).send({
            error: {
                code: "Unauthorized",
                message: message || "권한이 없습니다."
            }
        });
    };
    response.sendForbiddenError = (message?: string): Response => {
        return response.status(403).send({
            error: {
                code: "Forbidden",
                message: message || "권한이 없습니다."
            }
        });
    };
    response.sendNotFoundError = (message?: string): Response => {
        return response.status(404).send({
            error: {
                code: "Not Found",
                message: message || undefined
            }
        });
    };

    next();
};

