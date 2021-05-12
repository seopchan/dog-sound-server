import {Column, Model, HasMany, PrimaryKey, Table, ForeignKey, BelongsTo} from "sequelize-typescript";
import {TaskGroupSchema} from "../../schema/work/taskgroup.schema";
import {BuildOptions} from "sequelize";
import {WorkSchema} from "../../schema/work/work.schema";
import {TaskGroup} from "./taskgroup.model";

@Table
export class Work extends Model<Work> implements WorkSchema {
    constructor(schema?: TaskGroupSchema, options?: BuildOptions) {
        super(schema, options);
    }
    @PrimaryKey
    @Column
    workKey: string;

    @ForeignKey(() => TaskGroup)
    @Column
    taskGroupId: string;

    @BelongsTo(() => TaskGroup, "taskGroupId")
    taskGroup: TaskGroup;
}
