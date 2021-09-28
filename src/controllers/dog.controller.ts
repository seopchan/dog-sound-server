import {NextFunction, Request, Response} from "express";
import AWS from "aws-sdk";
import {paramUtil} from "../util/param";
import {
    AWS_ACCESS_KEY,
    AWS_REGION,
    AWS_SECRET_ACCESS_KEY,
} from "../util/secrets";
import {dogService} from "../service/dog.service";
import {Dog} from "../models/table/dog/dog.model";
import {Sound} from "../models/table/dog/sound.model";
import {soundService} from "../service/sound.service";

AWS.config.update({
    region: AWS_REGION,
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
});

export const createDog = async(req: Request, res: Response, next: NextFunction) => {
    console.log(`createDog : ${JSON.stringify(req.params)}`);

    const dogKey = req.params.dogKey as string;

    if (!paramUtil.checkParam(dogKey)) {
        return res.sendBadRequestError();
    }

    const dog: Dog = await dogService.createDog(dogKey);

    return res.sendRs({
        data: dog
    });
};

export const setDogSoundType = async(req: Request, res: Response, next: NextFunction) => {
    const dogKey = req.params.dogKey as string;
    const soundKey = req.params.soundKey as string;

    if (!paramUtil.checkParam(dogKey, soundKey)) {
        return res.sendBadRequestError();
    }

    const sound: Sound = await soundService.setSound(dogKey, soundKey);


    return res.sendRs({
        data: sound
    });
};

export const getDogSoundType = async(req: Request, res: Response, next: NextFunction) => {
    const soundKey = req.params.soundKey as string;

    if (!paramUtil.checkParam(soundKey)) {
        return res.sendBadRequestError();
    }

    const sound: Sound = await soundService.getSound(soundKey);

    return res.sendRs({
        data : sound
    });
};

export const uploadDogSound = async(req: Request, res: Response, next: NextFunction) => {
    const dogKey = req.params.dogKey as string;
    const soundKey = req.params.soundKey as string;

    if (!paramUtil.checkParam(dogKey, soundKey)) {
        return res.sendBadRequestError();
    }

    const sound: Sound = await soundService.setSound(dogKey, soundKey);


    return res.sendRs({
        data: sound
    });
};

export const getDogSound = async(req: Request, res: Response, next: NextFunction) => {
    const soundKey = req.params.soundKey as string;

    if (!paramUtil.checkParam(soundKey)) {
        return res.sendBadRequestError();
    }

    const sound: Sound = await soundService.getSound(soundKey);

    return res.sendRs({
        data : sound
    });
};

export const getAllDogSound = async(req: Request, res: Response, next: NextFunction) => {
    const dogKey = req.params.dogKey as string;

    if (!paramUtil.checkParam(dogKey)) {
        return res.sendBadRequestError();
    }

    const sounds: Sound[] = await soundService.getAllSound(dogKey);

    return res.sendRs({
        data : sounds
    });
};

export const startMusic = async(req: Request, res: Response, next: NextFunction) => {
    if (!paramUtil.checkParam(/* TODO */)) {
        return res.sendBadRequestError();
    }
};

export const getMusicState = async(req: Request, res: Response, next: NextFunction) => {
    if (!paramUtil.checkParam(/* TODO */)) {
        return res.sendBadRequestError();
    }

};
