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
exports.dogService = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const secrets_1 = require("../util/secrets");
const ErrorStore_1 = require("../util/ErrorStore");
const param_1 = require("../util/param");
const dog_model_1 = require("../models/table/dog/dog.model");
aws_sdk_1.default.config.update({
    region: secrets_1.AWS_REGION,
    accessKeyId: secrets_1.AWS_ACCESS_KEY,
    secretAccessKey: secrets_1.AWS_SECRET_ACCESS_KEY
});
class DogService {
    createDog(dogKey, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const invalidParam = !param_1.paramUtil.checkParam(dogKey);
            if (invalidParam) {
                throw new Error(ErrorStore_1.errorStore.INVALID_PARAM);
            }
            const dogSchema = {
                dogKey: dogKey,
                soundCount: 0,
                musicTime: 0,
            };
            const dog = yield dog_model_1.Dog.create(dogSchema, {
                transaction: outerTransaction
            });
            return dog;
        });
    }
    checkType(soundType) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (soundType) {
                case "BARK": {
                    return "BARK";
                }
                case "HOWLING": {
                    return "HOWLING";
                }
                case "GROWLING": {
                    return "GROWLING";
                }
                case "WHINING": {
                    return "WHINING";
                }
                default: {
                    throw new Error("undefined type");
                }
            }
        });
    }
}
exports.dogService = new DogService();
//# sourceMappingURL=dog.service.js.map