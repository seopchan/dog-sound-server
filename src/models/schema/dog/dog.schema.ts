export interface DogAttributes {
    dogKey?: string;
    soundCount?: number;
    musicTime?: number;
}

export interface DogSchema extends DogAttributes {
    dogKey: string;
    soundCount: number;
    musicTime: number;
}
