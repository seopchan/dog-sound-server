"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.awsService = void 0;
const secrets_1 = require("../util/secrets");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const ErrorStore_1 = require("../util/ErrorStore");
aws_sdk_1.default.config.update({
    region: secrets_1.AWS_REGION,
    accessKeyId: secrets_1.AWS_ACCESS_KEY,
    secretAccessKey: secrets_1.AWS_SECRET_ACCESS_KEY
});
class AwsService {
    SNSNotification(message, moduleSns) {
        return __awaiter(this, void 0, void 0, function* () {
            // const extractMetadata =  as string;
            const gongbackSns = secrets_1.GONGBACK_SNS;
            try {
                yield this._SNSNotification(message, moduleSns);
                yield this._SNSNotification(message, gongbackSns);
            }
            catch (e) {
                console.log(e);
                return false;
            }
            return true;
        });
    }
    _SNSNotification(message, topicArn) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                Message: message,
                TopicArn: topicArn
            };
            const snsResponse = new aws_sdk_1.default.SNS({ apiVersion: "2010-03-31" }).publish(params).promise();
            if (!snsResponse) {
                throw new Error(ErrorStore_1.errorStore.NOT_FOUND);
            }
            return snsResponse;
        });
    }
}
exports.awsService = new AwsService();
//# sourceMappingURL=aws.service.js.map