import {
    AllowNull,
    Column,
    HasMany,
    Model,
    PrimaryKey,
    Table
} from "sequelize-typescript";
import {
    BuildOptions
} from "sequelize";
import {WorkGroupSchema} from "../../schema/work/workgroup.schema";
import {Work} from "./work.model";

@Table
export class WorkGroup extends Model<WorkGroup> implements WorkGroupSchema {
    constructor(schema?: WorkGroupSchema, options?: BuildOptions) {
        super(schema, options);
    }

    @PrimaryKey
    @Column
    workGroupId: string;

    @AllowNull(false)
    @Column
    taskKey: string;

    @AllowNull(false)
    @Column
    status: string;

    @AllowNull(false)
    @Column
    callbackUrl: string;

    @AllowNull(false)
    @Column
    callbackStatus: string;

    @AllowNull(false)
    @Column
    retryCount: number;

    @HasMany(() => Work)
    work: Work[];
}
