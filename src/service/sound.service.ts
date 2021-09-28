import AWS from "aws-sdk";
import {AWS_ACCESS_KEY, AWS_REGION, AWS_SECRET_ACCESS_KEY} from "../util/secrets";
import {Op, Transaction} from "sequelize";
import {errorStore} from "../util/ErrorStore";
import {paramUtil} from "../util/param";
import {Dog} from "../models/table/dog/dog.model";
import {DogSchema} from "../models/schema/dog/dog.schema";
import {Sound} from "../models/table/dog/sound.model";
import {SoundSchema} from "../models/schema/dog/sound.schema";

AWS.config.update({
    region: AWS_REGION,
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
});

class SoundService {
    async setSound(dogKey: string, soundKey: string, outerTransaction?: Transaction): Promise<Sound> {
        const invalidParam = !paramUtil.checkParam(dogKey, soundKey);

        if (invalidParam) {
            throw new Error(errorStore.INVALID_PARAM);
        }

        const soundSchema: SoundSchema = {
            soundKey: soundKey,
            dogKey: dogKey,
        };

        const sound = await Sound.create(soundSchema, {
           transaction: outerTransaction
        });

        return sound as Sound;
    }

    async getSound(soundKey: string, outerTransaction?: Transaction): Promise<Sound> {
        const invalidParam = !paramUtil.checkParam(soundKey);

        if (invalidParam) {
            throw new Error(errorStore.INVALID_PARAM);
        }

        const sound = await Sound.findByPk(soundKey, {
            transaction: outerTransaction
        });

        if(!sound){
            throw new Error(errorStore.NOT_FOUND);
        }

        return sound as Sound;
    }

    async getAllSound(dogKey: string, outerTransaction?: Transaction): Promise<Sound[]> {
        const invalidParam = !paramUtil.checkParam(dogKey);

        if (invalidParam) {
            throw new Error(errorStore.INVALID_PARAM);
        }

        const sounds = await Sound.findAll({
            where: {
                dogKey: dogKey
            }
        });

        return sounds as Sound[];
    }
}

export const soundService = new SoundService();
