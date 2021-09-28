"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseMiddleware = exports.requestMiddleware = exports.UserType = void 0;
var UserType;
(function (UserType) {
    UserType[UserType["UNKNOWN"] = 0] = "UNKNOWN";
    UserType[UserType["STUDENT"] = 1] = "STUDENT";
    UserType[UserType["TEACHER"] = 2] = "TEACHER";
})(UserType = exports.UserType || (exports.UserType = {}));
exports.requestMiddleware = (request, response, next) => {
    request.isStudent = () => {
        return request.userType === UserType.STUDENT;
    };
    request.isTeacher = () => {
        return request.userType === UserType.TEACHER;
    };
    next();
};
exports.responseMiddleware = (request, response, next) => {
    response.sendRs = (rs) => {
        return response.send(rs);
    };
    response.sendBadRequestError = (message) => {
        return response.status(400).send({
            error: {
                code: "Bad Request",
                message: message || "잘못된 요청입니다.",
            }
        });
    };
    response.sendUnauthorizedError = (message) => {
        return response.status(401).send({
            error: {
                code: "Unauthorized",
                message: message || "권한이 없습니다."
            }
        });
    };
    response.sendForbiddenError = (message) => {
        return response.status(403).send({
            error: {
                code: "Forbidden",
                message: message || "권한이 없습니다."
            }
        });
    };
    response.sendNotFoundError = (message) => {
        return response.status(404).send({
            error: {
                code: "Not Found",
                message: message || undefined
            }
        });
    };
    next();
};
//# sourceMappingURL=RqrsMiddleware.js.map