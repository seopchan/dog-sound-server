import {BelongsTo, Column, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {TaskSchema} from "../../schema/work/task.schema";
import {BuildOptions, BulkCreateOptions} from "sequelize";
import {MakePaperTaskSchema} from "../../schema/work/makepapertask.schema";
import {Task} from "./task.model";

@Table
export class MakePaperTask extends Model<MakePaperTask> implements MakePaperTaskSchema {
    constructor(schema?: TaskSchema, options?: BuildOptions) {
        super(schema, options);
    }
    @PrimaryKey
    @ForeignKey(() => Task)
    @Column
    taskId: string;

    @BelongsTo(() => Task, "taskId")
    task: Task;

    static createList(
        records: MakePaperTaskSchema[],
        options?: BulkCreateOptions
    ): Promise<MakePaperTask[]> {
        return MakePaperTask.bulkCreate(records, options);
    }
}
