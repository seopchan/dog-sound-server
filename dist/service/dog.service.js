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
Object.defineProperty(exports, "__esModule", { value: true });
exports.dogService = void 0;
const ErrorStore_1 = require("../util/ErrorStore");
const param_1 = require("../util/param");
const dog_model_1 = require("../models/table/dog/dog.model");
class DogService {
    createDog(dogKey, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const invalidParam = !param_1.paramUtil.checkParam(dogKey);
            if (invalidParam) {
                throw new Error(ErrorStore_1.errorStore.INVALID_PARAM);
            }
            const dogSchema = {
                dogKey: dogKey,
                isMusicPlaying: false,
            };
            const dog = yield dog_model_1.Dog.create(dogSchema, {
                transaction: outerTransaction
            });
            return dog;
        });
    }
    getDog(dogKey, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const invalidParam = !param_1.paramUtil.checkParam(dogKey);
            if (invalidParam) {
                throw new Error(ErrorStore_1.errorStore.INVALID_PARAM);
            }
            const dog = yield dog_model_1.Dog.findByPk(dogKey, {
                transaction: outerTransaction
            });
            if (!dog) {
                throw new Error(ErrorStore_1.errorStore.NOT_FOUND);
            }
            return dog;
        });
    }
    playMusic(dogKey, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const invalidParam = !param_1.paramUtil.checkParam(dogKey);
            if (invalidParam) {
                throw new Error(ErrorStore_1.errorStore.INVALID_PARAM);
            }
            const changeState = yield dog_model_1.Dog.update({
                isMusicPlaying: true
            }, {
                where: {
                    dogKey: dogKey
                },
                transaction: outerTransaction
            });
            if (!changeState) {
                throw new Error(ErrorStore_1.errorStore.NOT_FOUND);
            }
            return true;
        });
    }
    stopMusic(dogKey, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const invalidParam = !param_1.paramUtil.checkParam(dogKey);
            if (invalidParam) {
                throw new Error(ErrorStore_1.errorStore.INVALID_PARAM);
            }
            const changeState = yield dog_model_1.Dog.update({
                isMusicPlaying: false
            }, {
                where: {
                    dogKey: dogKey
                },
                transaction: outerTransaction
            });
            if (!changeState) {
                throw new Error(ErrorStore_1.errorStore.NOT_FOUND);
            }
            return true;
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