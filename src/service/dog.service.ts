import AWS from "aws-sdk";
import {AWS_ACCESS_KEY, AWS_REGION, AWS_SECRET_ACCESS_KEY} from "../util/secrets";
import {Transaction} from "sequelize";
import {errorStore} from "../util/ErrorStore";
import {paramUtil} from "../util/param";
import {Dog} from "../models/table/dog/dog.model";
import {DogSchema} from "../models/schema/dog/dog.schema";

AWS.config.update({
    region: AWS_REGION,
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
});

class DogService {
    async createDog(dogKey: string, outerTransaction?: Transaction): Promise<Dog> {
        const invalidParam = !paramUtil.checkParam(dogKey);

        if (invalidParam) {
            throw new Error(errorStore.INVALID_PARAM);
        }

        const dogSchema: DogSchema = {
            dogKey: dogKey,
            isMusicPlaying: false,
        };

        const dog = await Dog.create(dogSchema, {
            transaction: outerTransaction
        });

        return dog as Dog;
    }

    async getDog(dogKey: string, outerTransaction?: Transaction): Promise<Dog> {
        const invalidParam = !paramUtil.checkParam(dogKey);

        if (invalidParam) {
            throw new Error(errorStore.INVALID_PARAM);

        }
        const dog = await Dog.findByPk(dogKey, {
            transaction: outerTransaction
        });

        if (!dog) {
            throw new Error(errorStore.NOT_FOUND);
        }
        return dog as Dog;
    }

    async playMusic(dogKey: string, outerTransaction?: Transaction): Promise<boolean> {
        const invalidParam = !paramUtil.checkParam(dogKey);

        if (invalidParam) {
            throw new Error(errorStore.INVALID_PARAM);

        }

        const changeState = await Dog.update({
            isPlayMusic: true
        }, {
            where: {
                dogKey: dogKey
            },
            transaction: outerTransaction
        });

        if (!changeState) {
            throw new Error(errorStore.NOT_FOUND);
        }
        return true;
    }

    async stopMusic(dogKey: string, outerTransaction?: Transaction): Promise<boolean> {
        const invalidParam = !paramUtil.checkParam(dogKey);

        if (invalidParam) {
            throw new Error(errorStore.INVALID_PARAM);

        }

        const changeState = await Dog.update({
            isPlayMusic: false
        }, {
            where: {
                dogKey: dogKey
            },
            transaction: outerTransaction
        });

        if (!changeState) {
            throw new Error(errorStore.NOT_FOUND);
        }
        return true;
    }

    async checkType(soundType: string): Promise<string> {
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
    }
}

export const dogService = new DogService();
