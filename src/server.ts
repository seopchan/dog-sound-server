import errorHandler from "errorhandler";
import dotenv from "dotenv";
import fs from "fs";
import logger from "./util/logger";
if (fs.existsSync(".env")) {
    logger.debug("Using .env file to supply config environment variables");
    dotenv.config({ path: ".env" });
}
import main from "./main";
import "source-map-support/register";
import passport from "passport";
import AWS, {SQS} from "aws-sdk";
import {db} from "./models/DB";
import {Consumer, SQSMessage} from "sqs-consumer";
import {EXTRACT_METADATA_SQS_URL} from "./util/secrets";
import {workGroupService} from "./service/workGroup.service";
import {awsService} from "./service/aws.service";

if(!process.env["AWS_ACCESS_KEY"]) {
    throw new Error("MISSING AWS_ACCESS_KEY");
}

AWS.config.update({
    accessKeyId: process.env["AWS_ACCESS_KEY"],
    secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"],
    region: process.env["AWS_REGION"],
});

main.use(passport.initialize());
/**
 * Error Handler. Provides full stack - remove for production
 */
main.use(errorHandler());

async function syncData() {
    console.log("syncData");
}

function processError(receiptHandle: string, err: Error, sqs: SQS) {
    const deleteParams = {
        QueueUrl: EXTRACT_METADATA_SQS_URL as string,
        ReceiptHandle: receiptHandle as string
    };
    console.error("Remove Message Because : " + err.message);
    sqs.deleteMessage(deleteParams);
}

async function startSqsConsumer() {
    let receiptHandle: string | undefined;

    try {
        const sqs = new AWS.SQS({
            apiVersion: "2012-11-05",
        });

        const app = Consumer.create({
            queueUrl: EXTRACT_METADATA_SQS_URL as string,
            messageAttributeNames: ["All"],
            visibilityTimeout: 15*60,
            handleMessage: async (message: SQSMessage): Promise<void> => {
                receiptHandle = message.ReceiptHandle;
                try {
                    await workGroupService.extractMetadata(message);
                } catch (e) {
                    if (receiptHandle != null) {
                        processError(receiptHandle, e, sqs);
                    } else {
                        console.log("receiptHandle is undefined");
                    }
                }
            },
            sqs: sqs
        });

        app.on("error", (err: Error) => {
            if (receiptHandle) {
                processError(receiptHandle, err, sqs);
            } else {
                console.log("receiptHandle is undefined");
            }
            receiptHandle = undefined;
        });

        app.on("processing_error", (err: Error) => {
            if (receiptHandle) {
                processError(receiptHandle, err, sqs);
            } else {
                console.log("receiptHandle is undefined");
            }
            receiptHandle = undefined;
        });

        app.start();
    } catch (e) {
        console.log(e);
        await awsService.SNSNotification(e);
    }

}

/**
 * Start Express server.
 */
(async () => {
    await main.listen(main.get("port"));

    const force = process.env.ALTER_SYNC == "true";
    if (force) {
        //스테이징 서버..
        console.log("ALTER SYNC");
        await db.sync({alter: true});
        await startSqsConsumer();
    } else {
        //개발 로컬
        console.log("FORCE SYNC");
        await db.sync({force: true});
        await syncData();
        await startSqsConsumer();
    }
})();
