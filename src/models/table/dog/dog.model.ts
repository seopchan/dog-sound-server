import {Column, Model, HasMany, PrimaryKey, Table, AllowNull} from "sequelize-typescript";
import {BuildOptions} from "sequelize";
import {DogSchema} from "../../schema/dog/dog.schema";
import {Sound} from "./sound.model";

@Table
export class Dog extends Model<Dog> implements DogSchema {
    constructor(schema?: DogSchema, options?: BuildOptions) {
        super(schema, options);
    }
    @PrimaryKey
    @Column
    dogKey: string;

    @AllowNull(false)
    @Column
    musicTime: number;

    @AllowNull(false)
    @Column
    soundCount: number;

    @HasMany(() => Sound)
    sounds: Sound[]
}
