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
exports.getMusicState = exports.startMusic = exports.getAllDogSound = exports.getDogSound = exports.uploadDogSound = exports.getDogSoundType = exports.setDogSoundType = exports.createDog = void 0;
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
exports.createDog = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`createDog : ${JSON.stringify(req.params)}`);
    const dogKey = req.params.dogKey;
    if (!param_1.paramUtil.checkParam(dogKey)) {
        return res.sendBadRequestError();
    }
    const dog = yield dog_service_1.dogService.createDog(dogKey);
    return res.sendRs({
        data: dog
    });
});
exports.setDogSoundType = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const dogKey = req.params.dogKey;
    const soundKey = req.params.soundKey;
    if (!param_1.paramUtil.checkParam(dogKey, soundKey)) {
        return res.sendBadRequestError();
    }
    const sound = yield sound_service_1.soundService.setSound(dogKey, soundKey);
    return res.sendRs({
        data: sound
    });
});
exports.getDogSoundType = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const soundKey = req.params.soundKey;
    if (!param_1.paramUtil.checkParam(soundKey)) {
        return res.sendBadRequestError();
    }
    const sound = yield sound_service_1.soundService.getSound(soundKey);
    return res.sendRs({
        data: sound
    });
});
exports.uploadDogSound = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const dogKey = req.params.dogKey;
    const soundKey = req.params.soundKey;
    if (!param_1.paramUtil.checkParam(dogKey, soundKey)) {
        return res.sendBadRequestError();
    }
    const sound = yield sound_service_1.soundService.setSound(dogKey, soundKey);
    return res.sendRs({
        data: sound
    });
});
exports.getDogSound = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const soundKey = req.params.soundKey;
    if (!param_1.paramUtil.checkParam(soundKey)) {
        return res.sendBadRequestError();
    }
    const sound = yield sound_service_1.soundService.getSound(soundKey);
    return res.sendRs({
        data: sound
    });
});
exports.getAllDogSound = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const dogKey = req.params.dogKey;
    if (!param_1.paramUtil.checkParam(dogKey)) {
        return res.sendBadRequestError();
    }
    const sounds = yield sound_service_1.soundService.getAllSound(dogKey);
    return res.sendRs({
        data: sounds
    });
});
exports.startMusic = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!param_1.paramUtil.checkParam( /* TODO */)) {
        return res.sendBadRequestError();
    }
});
exports.getMusicState = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!param_1.paramUtil.checkParam( /* TODO */)) {
        return res.sendBadRequestError();
    }
});
//# sourceMappingURL=dog.controller.js.map