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
exports.soundService = void 0;
const ErrorStore_1 = require("../util/ErrorStore");
const param_1 = require("../util/param");
const sound_model_1 = require("../models/table/dog/sound.model");
class SoundService {
    addDogCrying(dogKey, soundKey, cryingType, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const invalidParam = !param_1.paramUtil.checkParam(dogKey, soundKey, cryingType);
            if (invalidParam) {
                throw new Error(ErrorStore_1.errorStore.INVALID_PARAM);
            }
            const soundSchema = {
                soundKey: soundKey,
                dogKey: dogKey,
                type: cryingType,
            };
            const sound = yield sound_model_1.Sound.create(soundSchema, {
                transaction: outerTransaction
            });
            return sound;
        });
    }
    getAllDogCrying(dogKey, outerTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const invalidParam = !param_1.paramUtil.checkParam(dogKey);
            if (invalidParam) {
                throw new Error(ErrorStore_1.errorStore.INVALID_PARAM);
            }
            const sounds = yield sound_model_1.Sound.findAll({
                where: {
                    dogKey: dogKey
                },
                transaction: outerTransaction
            });
            if (!sounds) {
                throw new Error(ErrorStore_1.errorStore.NOT_FOUND);
            }
            return sounds;
        });
    }
}
exports.soundService = new SoundService();
//# sourceMappingURL=sound.service.js.map