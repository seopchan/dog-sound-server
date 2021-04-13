import express from "express";
import compression from "compression";  // compresses requests
import bodyParser from "body-parser";
import lusca from "lusca";
import path from "path";
import YAML from "yamljs";

// Controllers (route handlers)
import * as questionController from "./controllers/work.controller";

import errorMiddleware from "./middleware/error.middleware";
import {NextFunction} from "express";
import {Request, Response} from "express";
import {responseMiddleware, requestMiddleware} from "./middleware/RqrsMiddleware";
import swaggerUi from "swagger-ui-express";


// Create Express server
const main = express();

// Express configuration
main.set("port", process.env.PORT || 3002);
main.set("views", path.join(__dirname, "../views"));
main.set("view engine", "pug");
main.use(compression());
main.use(bodyParser.json());
main.use(bodyParser.urlencoded({ extended: true }));
main.use(lusca.xframe("SAMEORIGIN"));
main.use(lusca.xssProtection(true));
main.use(requestMiddleware);
main.use(responseMiddleware);

main.all("/*", (req: Request, res: Response, next: NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "*");
    next();
});

function _(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };
}

main.get("/", function(req, res) {
    res.sendFile(__dirname + "/public/index.html");
});

/**
 * routes.
 */
main.post("/question/hwpMetadataExtract", _(questionController.hwpMetadataExtract));
main.post("/question/questionSplit", _(questionController.questionSplit));
main.post("/question/makePaper", _(questionController.makePaper));


/*** API DOCS
 * TODO run only dev
 */
main.use("/api-docs", swaggerUi.serve, swaggerUi.setup(YAML.load("./swagger/index.yaml")));

/**
 * error handler.
 */
main.use(errorMiddleware);

export default main;
