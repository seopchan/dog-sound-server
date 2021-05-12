import {
    AllowNull,
    Column, DataType,
    HasMany,
    HasOne,
    Model,
    PrimaryKey,
    Table
} from "sequelize-typescript";
import {TaskGroupSchema} from "../../schema/work/taskgroup.schema";
import {BuildOptions} from "sequelize";
import {Task} from "./task.model";
import {Work} from "./work.model";

@Table
export class TaskGroup extends Model<TaskGroup> implements TaskGroupSchema {
    constructor(schema?: TaskGroupSchema, options?: BuildOptions) {
        super(schema, options);
    }
    @PrimaryKey
    @Column
    taskGroupId: string;

    @AllowNull(false)
    @Column
    status: string;

    @AllowNull(true)
    @Column(DataType.TEXT({ length: "long" }))
    result: string;

    @HasOne(() => Work)
    work: Work;

    @HasMany(() => Task)
    tasks: Task[];
}
