"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtToken = exports.TokenExpiredError = void 0;
const jwt = __importStar(require("jsonwebtoken"));
class TokenExpiredError extends Error {
}
exports.TokenExpiredError = TokenExpiredError;
class JwtToken {
    constructor() {
        this.generateAccessToken = (userKey) => __awaiter(this, void 0, void 0, function* () {
            return yield this.generateToken(userKey, process.env.JWT_ACCESS_SECRET, "30 minutes");
        });
        this.generateRefreshToken = (userKey) => __awaiter(this, void 0, void 0, function* () {
            return yield this.generateToken(userKey, process.env.JWT_REFRESH_SECRET, "30 days");
        });
        this.decodeAccessToken = (token) => {
            return this.decodeToken(token, process.env.JWT_ACCESS_SECRET);
        };
        this.decodeRefreshToken = (token) => {
            return this.decodeToken(token, process.env.JWT_REFRESH_SECRET);
        };
    }
    generateToken(userKey, secretKey, expiresIn) {
        return new Promise((resolve, reject) => {
            jwt.sign({ userKey: userKey }, // 토큰의 정보
            secretKey, // 비밀키
            { expiresIn: expiresIn }, // 30분 후에 만료되는 토큰
            (err, token) => {
                if (!err) {
                    resolve(token);
                }
                else {
                    reject(err);
                }
            });
        });
    }
    decodeToken(token, secretKey) {
        try {
            const payload = jwt.verify(token, secretKey);
            const userKey = payload.userKey;
            return userKey;
        }
        catch (e) {
            if (e instanceof jwt.TokenExpiredError) {
                throw TokenExpiredError;
                // console.log("TokenExpiredError");
            }
            return null;
        }
    }
}
exports.jwtToken = new JwtToken();
//# sourceMappingURL=jwt-token.js.map