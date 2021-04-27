import {
    AllowNull,
    Column, DataType, ForeignKey,
    Model,
    PrimaryKey,
    Table
} from "sequelize-typescript";
import {
    BuildOptions
} from "sequelize";
import {ResultDataSchema} from "../../schema/work/resultdata.schema";
import {WorkGroup} from "./workgroup.model";

@Table
export class ResultData extends Model<ResultData> implements ResultDataSchema {
    constructor(schema?: ResultDataSchema, options?: BuildOptions) {
        super(schema, options);
    }

    @PrimaryKey
    @ForeignKey(() => WorkGroup)
    @AllowNull(false)
    @Column
    workKey: string;

    @AllowNull(false)
    @Column(DataType.TEXT({ length: "long" }))
    result: string;
}
