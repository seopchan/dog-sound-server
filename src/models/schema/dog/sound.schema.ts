export enum DogCryingType {
    BARK="BARK",
    HOWLING="HOWLING",
}

export interface SoundAttributes {
    soundKey?: string;
    dogKey?: string;
    type?: string;
}

export interface SoundSchema extends SoundAttributes {
    soundKey: string;
    dogKey: string;
    type: string;
}
