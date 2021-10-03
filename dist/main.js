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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const compression_1 = __importDefault(require("compression")); // compresses requests
const body_parser_1 = __importDefault(require("body-parser"));
const lusca_1 = __importDefault(require("lusca"));
const path_1 = __importDefault(require("path"));
const yamljs_1 = __importDefault(require("yamljs"));
// Controllers (route handlers)
const dogController = __importStar(require("./controllers/dog.controller"));
const error_middleware_1 = __importDefault(require("./middleware/error.middleware"));
const RqrsMiddleware_1 = require("./middleware/RqrsMiddleware");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
// Create Express server
const main = express_1.default();
// Express configuration
main.set("port", process.env.PORT || 3002);
main.set("views", path_1.default.join(__dirname, "../views"));
main.set("view engine", "pug");
main.use(compression_1.default());
main.use(body_parser_1.default.json());
main.use(body_parser_1.default.urlencoded({ extended: true }));
main.use(lusca_1.default.xframe("SAMEORIGIN"));
main.use(lusca_1.default.xssProtection(true));
main.use(RqrsMiddleware_1.requestMiddleware);
main.use(RqrsMiddleware_1.responseMiddleware);
main.all("/*", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "*");
    next();
});
function _(fn) {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
}
main.get("/", function (req, res) {
    res.sendFile(__dirname + "/public/index.html");
});
/**
 * routes.
 */
main.get("/test", _(dogController.test));
main.post("/dog/createDog/:dogKey", _(dogController.createDog));
main.get("/dog/getDog/:dogKey", _(dogController.getDog));
main.post("/dog/addDogCrying/:dogKey", _(dogController.addDogCrying));
main.get("/dog/getAllDogCrying/:dogKey", _(dogController.getAllDogCrying));
/*** API DOCS
 * TODO run only dev
 */
main.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(yamljs_1.default.load("./swagger/index.yaml")));
/**
 * error handler.
 */
main.use(error_middleware_1.default);
exports.default = main;
//# sourceMappingURL=main.js.map