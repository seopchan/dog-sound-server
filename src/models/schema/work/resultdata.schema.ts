export interface ResultDataAttributes {
    workKey?: string;
    result?: string;
}

export interface ResultDataSchema extends ResultDataAttributes {
    workKey: string;
    result: string;
}