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
import {DogCryingType} from "../models/schema/dog/sound.schema";

AWS.config.update({
    region: AWS_REGION,
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
});

export const test = async(req: Request, res: Response, next: NextFunction) => {
    return res.sendRs({
        data: {
            test: "test"
        }
    });
};

export const createDog = async(req: Request, res: Response, next: NextFunction) => {
    const dogKey = req.params.dogKey as string;

    if (!paramUtil.checkParam(dogKey)) {
        return res.sendBadRequestError();
    }

    const dog: Dog = await dogService.createDog(dogKey);

    return res.sendRs({
        data: dog
    });
};

export const getDog = async(req: Request, res: Response, next: NextFunction) => {
    const dogKey = req.params.dogKey as string;

    if (!paramUtil.checkParam(dogKey)) {
        return res.sendBadRequestError();
    }

    const dog: Dog = await dogService.getDog(dogKey);

    return res.sendRs({
        data: dog
    });
};

export const addDogCrying = async(req: Request, res: Response, next: NextFunction) => {
    const dogKey = req.params.dogKey as string;
    const soundKey = req.query.soundKey as string;
    const type = req.query.type as DogCryingType;

    if (!paramUtil.checkParam(dogKey, soundKey, type)) {
        return res.sendBadRequestError();
    }

    const sound: Sound = await soundService.addDogCrying(dogKey, soundKey, type);

    return res.sendRs({
        data: sound
    });
};

export const getAllDogCrying = async(req: Request, res: Response, next: NextFunction) => {
    const dogKey = req.params.dogKey as string;

    if (!paramUtil.checkParam(dogKey)) {
        return res.sendBadRequestError();
    }

    const sounds: Sound[] = await soundService.getAllDogCrying(dogKey);
    const todaySounds: Sound[]=[];
    const yesterdaySounds: Sound[]=[];
    const monthSounds: Sound[]=[];
    const today = new Date();
    await sounds.map(sound => {
        const soundDate = new Date(sound.createdAt);
        soundDate.setHours(soundDate.getHours()+9);

        if (soundDate.getFullYear() == today.getFullYear() &&
            soundDate.getMonth() == today.getMonth() &&
            soundDate.getDate() == today.getDate()
        ) {
            todaySounds.push(sound);
            console.log("today Data");
        }
        if (soundDate.getFullYear() == today.getFullYear() &&
            soundDate.getMonth() == today.getMonth() &&
            soundDate.getDate() == today.getDate()-1) {
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
};

export const playMusic = async(req: Request, res: Response, next: NextFunction) => {
    const dogKey = req.params.dogKey as string;

    if (!paramUtil.checkParam(dogKey)) {
        return res.sendBadRequestError();
    }

    const result: boolean = await dogService.playMusic(dogKey);

    return res.sendRs({
        data: {
            result: result
        }
    });
};

export const stopMusic = async(req: Request, res: Response, next: NextFunction) => {
    const dogKey = req.params.dogKey as string;

    if (!paramUtil.checkParam(dogKey)) {
        return res.sendBadRequestError();
    }

    const result: boolean = await dogService.stopMusic(dogKey);

    return res.sendRs({
        data: {
            result: result
        }
    });
};
