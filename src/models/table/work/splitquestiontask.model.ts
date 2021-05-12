import {AllowNull, BelongsTo, Column, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {TaskSchema} from "../../schema/work/task.schema";
import {BuildOptions, BulkCreateOptions} from "sequelize";
import {SplitQuestionTaskSchema} from "../../schema/work/splitquestiontask.schema";
import {Task} from "./task.model";

@Table
export class SplitQuestionTask extends Model<SplitQuestionTask> implements SplitQuestionTaskSchema {
    constructor(schema?: TaskSchema, options?: BuildOptions) {
        super(schema, options);
    }
    @PrimaryKey
    @ForeignKey(() => Task)
    @Column
    taskId: string;

    @AllowNull(false)
    @Column
    answerFileKey: string;

    @AllowNull(false)
    @Column
    questionFileKey: string;

    @BelongsTo(() => Task, "taskId")
    task: Task;

    static createList(
        records: SplitQuestionTaskSchema[],
        options?: BulkCreateOptions
    ): Promise<SplitQuestionTask[]> {
        return SplitQuestionTask.bulkCreate(records, options);
    }
}
