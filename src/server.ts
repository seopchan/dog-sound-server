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
    console.log("!!!");

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
    } else {
        //개발 로컬
        console.log("FORCE SYNC");
        await db.sync({force: true});
        await syncData();
    }
})();
