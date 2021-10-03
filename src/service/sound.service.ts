import AWS from "aws-sdk";
import {AWS_ACCESS_KEY, AWS_REGION, AWS_SECRET_ACCESS_KEY} from "../util/secrets";
import {Transaction} from "sequelize";
import {errorStore} from "../util/ErrorStore";
import {paramUtil} from "../util/param";
import {Sound} from "../models/table/dog/sound.model";
import {DogCryingType, SoundSchema} from "../models/schema/dog/sound.schema";

AWS.config.update({
    region: AWS_REGION,
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
});

class SoundService {
    async addDogCrying(dogKey: string, soundKey: string, cryingType: DogCryingType, outerTransaction?: Transaction): Promise<Sound> {
        const invalidParam = !paramUtil.checkParam(dogKey, soundKey, cryingType);

        if (invalidParam) {
            throw new Error(errorStore.INVALID_PARAM);
        }

        const soundSchema: SoundSchema = {
            soundKey: soundKey,
            dogKey: dogKey,
            type: cryingType,
        };

        const sound = await Sound.create(soundSchema, {
            transaction: outerTransaction
        });

        return sound as Sound;
    }

    async getAllDogCrying(dogKey: string, outerTransaction?: Transaction): Promise<Sound[]> {
        const invalidParam = !paramUtil.checkParam(dogKey);

        if (invalidParam) {
            throw new Error(errorStore.INVALID_PARAM);
        }

        const sounds = await Sound.findAll({
            where: {
                dogKey: dogKey
            },
            transaction: outerTransaction
        });

        if(!sounds){
            throw new Error(errorStore.NOT_FOUND);
        }

        return sounds as Sound[];
    }
}

export const soundService = new SoundService();
