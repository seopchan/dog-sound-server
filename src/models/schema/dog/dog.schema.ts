export interface DogAttributes {
    dogKey?: string;
    isMusicPlaying?: boolean;
}

export interface DogSchema extends DogAttributes {
    dogKey: string;
    isMusicPlaying?: boolean;
}
