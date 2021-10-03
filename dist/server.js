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
const DB_1 = require("./models/DB");
// if(!process.env["AWS_ACCESS_KEY"]) {
//     throw new Error("MISSING AWS_ACCESS_KEY");
// }
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
/**
 * Start Express server.
 */
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield main_1.default.listen(main_1.default.get("port"));
    const force = process.env.ALTER_SYNC == "false";
    if (force) {
        //스테이징 서버..
        console.log("ALTER SYNC");
        yield DB_1.db.sync({ alter: true });
    }
    else {
        //개발 로컬
        console.log("FORCE SYNC");
        yield DB_1.db.sync({ force: true });
        yield syncData();
    }
}))();
//# sourceMappingURL=server.js.map