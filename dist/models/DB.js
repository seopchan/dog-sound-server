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
exports.transactionManager = exports.db = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const logger_1 = __importDefault(require("../util/logger"));
const secrets_1 = require("../util/secrets");
const dog_model_1 = require("./table/dog/dog.model");
const sound_model_1 = require("./table/dog/sound.model");
logger_1.default.debug(`connect with ${secrets_1.DB_URL}`);
logger_1.default.debug(`username ${secrets_1.USERNAME}`);
logger_1.default.debug(`password ${secrets_1.PASSWORD}`);
logger_1.default.debug(`database ${secrets_1.DATABASE}`);
exports.db = new sequelize_typescript_1.Sequelize({
    host: secrets_1.DB_URL,
    database: secrets_1.DATABASE,
    dialect: "mysql",
    username: secrets_1.USERNAME,
    password: secrets_1.PASSWORD,
    models: [
        dog_model_1.Dog,
        sound_model_1.Sound,
    ]
});
class TransactionManager {
    runOnTransaction(outerTransaction, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (outerTransaction) {
                return callback(outerTransaction);
            }
            return exports.db.transaction((t) => __awaiter(this, void 0, void 0, function* () {
                return callback(t);
            }));
        });
    }
}
exports.transactionManager = new TransactionManager();
//# sourceMappingURL=DB.js.map