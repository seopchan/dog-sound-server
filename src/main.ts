import express from "express";
import compression from "compression";  // compresses requests
import bodyParser from "body-parser";
import lusca from "lusca";
import path from "path";
import YAML from "yamljs";

// Controllers (route handlers)
import * as dogController from "./controllers/dog.controller";

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
main.get("/test", _(dogController.test));
main.post("/dog/createDog/:dogKey", _(dogController.createDog));
main.post("/dog/setDogSoundType/:dogKey/:soundKey", _(dogController.setDogSoundType));
main.get("/dog/getDogSoundType/:soundKey", _(dogController.getDogSoundType));
main.post("/dog/uploadDogSound/:dogKey/:soundKey", _(dogController.uploadDogSound));
main.get("/dog/getDogSound/:soundKey", _(dogController.getDogSound));
main.get("/dog/getAllDogSound/:dogKey", _(dogController.getAllDogSound));

//TODO musicController
main.post("/dog/startMusic", _(dogController.startMusic));
main.get("/dog/getMusicState", _(dogController.getMusicState));


/*** API DOCS
 * TODO run only dev
 */
main.use("/api-docs", swaggerUi.serve, swaggerUi.setup(YAML.load("./swagger/index.yaml")));

/**
 * error handler.
 */
main.use(errorMiddleware);

export default main;
