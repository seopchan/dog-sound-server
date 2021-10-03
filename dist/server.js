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
const errorhandler_1 = __importDefault(require("errorhandler"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("./util/logger"));
if (fs_1.default.existsSync(".env")) {
    logger_1.default.debug("Using .env file to supply config environment variables");
    dotenv_1.default.config({ path: ".env" });
}
const main_1 = __importDefault(require("./main"));
require("source-map-support/register");
const passport_1 = __importDefault(require("passport"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const DB_1 = require("./models/DB");
const sqs_consumer_1 = require("sqs-consumer");
const secrets_1 = require("./util/secrets");
const aws_service_1 = require("./service/aws.service");
if (!process.env["AWS_ACCESS_KEY"]) {
    throw new Error("MISSING AWS_ACCESS_KEY");
}
aws_sdk_1.default.config.update({
    accessKeyId: process.env["AWS_ACCESS_KEY"],
    secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"],
    region: process.env["AWS_REGION"],
});
main_1.default.use(passport_1.default.initialize());
/**
 * Error Handler. Provides full stack - remove for production
 */
main_1.default.use(errorhandler_1.default());
function syncData() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("syncData");
    });
}
function processError(receiptHandle, err, sqs) {
    return __awaiter(this, void 0, void 0, function* () {
        const deleteParams = {
            QueueUrl: secrets_1.EXTRACT_METADATA_SQS_URL,
            ReceiptHandle: receiptHandle
        };
        console.error("Remove Message Because : " + err.message);
        sqs.deleteMessage(deleteParams);
        yield aws_service_1.awsService.SNSNotification(String(err), secrets_1.EXTRACT_METADATA_SNS);
    });
}
function startMetadataExtractSqsConsumer() {
    return __awaiter(this, void 0, void 0, function* () {
        let receiptHandle;
        try {
            const sqs = new aws_sdk_1.default.SQS({
                apiVersion: "2012-11-05",
            });
            const app = sqs_consumer_1.Consumer.create({
                queueUrl: secrets_1.EXTRACT_METADATA_SQS_URL,
                messageAttributeNames: ["All"],
                visibilityTimeout: 15 * 60,
                handleMessage: (message) => __awaiter(this, void 0, void 0, function* () {
                    receiptHandle = message.ReceiptHandle;
                    try {
                        // await extractMetadataTaskService.extractMetadata(message);
                    }
                    catch (e) {
                        if (receiptHandle != null) {
                            yield processError(receiptHandle, e, sqs);
                        }
                        else {
                            console.log("receiptHandle is undefined");
                            yield aws_service_1.awsService.SNSNotification(String(e + "\nreceiptHandle is undefined"), secrets_1.EXTRACT_METADATA_SNS);
                        }
                    }
                }),
                sqs: sqs
            });
            app.on("error", (err) => {
                if (receiptHandle) {
                    processError(receiptHandle, err, sqs);
                }
                else {
                    console.log("receiptHandle is undefined");
                }
                receiptHandle = undefined;
            });
            app.on("processing_error", (err) => {
                if (receiptHandle) {
                    processError(receiptHandle, err, sqs);
                }
                else {
                    console.log("receiptHandle is undefined");
                }
                receiptHandle = undefined;
            });
            app.start();
        }
        catch (e) {
            console.log(e);
            yield aws_service_1.awsService.SNSNotification(String(e), secrets_1.EXTRACT_METADATA_SNS);
        }
    });
}
function startQuestionSplitterSqsConsumer() {
    return __awaiter(this, void 0, void 0, function* () {
        let receiptHandle;
        try {
            const sqs = new aws_sdk_1.default.SQS({
                apiVersion: "2012-11-05"
            });
            const app = sqs_consumer_1.Consumer.create({
                queueUrl: secrets_1.SPLIT_QUESTION_SQS_URL,
                messageAttributeNames: ["All"],
                visibilityTimeout: 15 * 60,
                handleMessage: (message) => __awaiter(this, void 0, void 0, function* () {
                    console.log("message receipt");
                    receiptHandle = message.ReceiptHandle;
                    try {
                        // await splitQuestionTaskService.splitQuestion(message);
                    }
                    catch (e) {
                        if (receiptHandle != null) {
                            yield processError(receiptHandle, e, sqs);
                        }
                        else {
                            console.log("receiptHandle is undefined");
                            yield aws_service_1.awsService.SNSNotification(String(e + "\nreceiptHandle is undefined"), secrets_1.SPLIT_QUESTION_SNS);
                        }
                    }
                }),
                sqs: sqs
            });
            app.on("error", (err) => {
                if (receiptHandle) {
                    processError(receiptHandle, err, sqs);
                }
                else {
                    console.log("receiptHandle is undefined");
                }
                receiptHandle = undefined;
            });
            app.on("processing_error", (err) => {
                if (receiptHandle) {
                    processError(receiptHandle, err, sqs);
                }
                else {
                    console.log("receiptHandle is undefined");
                }
                receiptHandle = undefined;
            });
            app.start();
        }
        catch (e) {
            console.log(e);
            yield aws_service_1.awsService.SNSNotification(String(e), secrets_1.SPLIT_QUESTION_SNS);
        }
    });
}
/**
 * Start Express server.
 */
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield main_1.default.listen(main_1.default.get("port"));
    const force = process.env.ALTER_SYNC == "false";
    if (force) {
        //스테이징 서버..
        console.log("ALTER SYNC");
        yield DB_1.db.sync({ alter: false });
        yield startMetadataExtractSqsConsumer();
        yield startQuestionSplitterSqsConsumer();
    }
    else {
        //개발 로컬
        console.log("FORCE SYNC");
        yield DB_1.db.sync({ force: false });
        yield syncData();
        yield startMetadataExtractSqsConsumer();
        yield startQuestionSplitterSqsConsumer();
    }
}))();
//# sourceMappingURL=server.js.map