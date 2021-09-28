import {Column, Model, PrimaryKey, Table, BelongsTo, AllowNull, ForeignKey} from "sequelize-typescript";
import {BuildOptions} from "sequelize";
import {Dog} from "./dog.model";
import {SoundSchema} from "../../schema/dog/sound.schema";

@Table
export class Sound extends Model<Sound> implements SoundSchema {
    constructor(schema?: SoundSchema, options?: BuildOptions) {
        super(schema, options);
    }
    @PrimaryKey
    @Column
    soundKey: string;

    @ForeignKey(() => Dog)
    @Column
    dogKey: string;

    @BelongsTo(() => Dog, "dogKey")
    dog: Dog;
}
