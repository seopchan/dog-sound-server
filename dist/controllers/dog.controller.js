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
exports.stopMusic = exports.playMusic = exports.getAllDogCrying = exports.addDogCrying = exports.getDog = exports.createDog = exports.test = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const param_1 = require("../util/param");
const secrets_1 = require("../util/secrets");
const dog_service_1 = require("../service/dog.service");
const sound_service_1 = require("../service/sound.service");
aws_sdk_1.default.config.update({
    region: secrets_1.AWS_REGION,
    accessKeyId: secrets_1.AWS_ACCESS_KEY,
    secretAccessKey: secrets_1.AWS_SECRET_ACCESS_KEY
});
exports.test = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    return res.sendRs({
        data: {
            test: "test"
        }
    });
});
exports.createDog = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const dogKey = req.params.dogKey;
    if (!param_1.paramUtil.checkParam(dogKey)) {
        return res.sendBadRequestError();
    }
    const dog = yield dog_service_1.dogService.createDog(dogKey);
    return res.sendRs({
        data: dog
    });
});
exports.getDog = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const dogKey = req.params.dogKey;
    if (!param_1.paramUtil.checkParam(dogKey)) {
        return res.sendBadRequestError();
    }
    const dog = yield dog_service_1.dogService.getDog(dogKey);
    return res.sendRs({
        data: dog
    });
});
exports.addDogCrying = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const dogKey = req.params.dogKey;
    const soundKey = req.query.soundKey;
    const type = req.query.type;
    if (!param_1.paramUtil.checkParam(dogKey, soundKey, type)) {
        return res.sendBadRequestError();
    }
    const sound = yield sound_service_1.soundService.addDogCrying(dogKey, soundKey, type);
    return res.sendRs({
        data: sound
    });
});
exports.getAllDogCrying = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const dogKey = req.params.dogKey;
    if (!param_1.paramUtil.checkParam(dogKey)) {
        return res.sendBadRequestError();
    }
    const sounds = yield sound_service_1.soundService.getAllDogCrying(dogKey);
    const todaySounds = [];
    const yesterdaySounds = [];
    const monthSounds = [];
    const today = new Date();
    yield sounds.map(sound => {
        const soundDate = new Date(sound.createdAt);
        soundDate.setHours(soundDate.getHours() + 9);
        if (soundDate.getFullYear() == today.getFullYear() &&
            soundDate.getMonth() == today.getMonth() &&
            soundDate.getDate() == today.getDate()) {
            todaySounds.push(sound);
            console.log("today Data");
        }
        if (soundDate.getFullYear() == today.getFullYear() &&
            soundDate.getMonth() == today.getMonth() &&
            soundDate.getDate() == today.getDate() - 1) {
            yesterdaySounds.push(sound);
            console.log("yesterday Data");
        }
        if (soundDate.getFullYear() == today.getFullYear() &&
            soundDate.getMonth() == today.getMonth()) {
            monthSounds.push(sound);
            console.log("month Data");
        }
    });
    return res.sendRs({
        data: {
            todaySounds: todaySounds,
            yesterdaySounds: yesterdaySounds,
            monthSounds: monthSounds,
        }
    });
});
exports.playMusic = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const dogKey = req.params.dogKey;
    if (!param_1.paramUtil.checkParam(dogKey)) {
        return res.sendBadRequestError();
    }
    const result = yield dog_service_1.dogService.playMusic(dogKey);
    return res.sendRs({
        data: {
            result: result
        }
    });
});
exports.stopMusic = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const dogKey = req.params.dogKey;
    if (!param_1.paramUtil.checkParam(dogKey)) {
        return res.sendBadRequestError();
    }
    const result = yield dog_service_1.dogService.stopMusic(dogKey);
    return res.sendRs({
        data: {
            result: result
        }
    });
});
//# sourceMappingURL=dog.controller.js.map