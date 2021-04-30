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
import AWS from "aws-sdk";
import {db} from "./models/DB";
import {Consumer, SQSMessage} from "sqs-consumer";
import {EXTRACT_METADATA_SQS_URL} from "./util/secrets";
import https from "https";

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

async function startSqsConsumer() {
    const app = Consumer.create({
        queueUrl: EXTRACT_METADATA_SQS_URL,
        handleMessage: async (message: SQSMessage): Promise<void> => {
            // const params = message.Attributes;
            console.log("receive message" + message);
            // await extractMetadata(message);
        },
        sqs: new AWS.SQS({
            httpOptions: {
                agent: new https.Agent({
                    keepAlive: true
                })
            }
        })
    });

    app.on("error", (err: Error) => {
        console.error(err.message);
    });

    app.on("processing_error", (err: Error) => {
        console.error(err.message);
    });

    app.start();
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
