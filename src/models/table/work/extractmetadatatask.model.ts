import {AllowNull, BelongsTo, Column, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {TaskSchema} from "../../schema/work/task.schema";
import {BuildOptions, BulkCreateOptions} from "sequelize";
import {ExtractMetadataTaskSchema} from "../../schema/work/extractmetadatatask.schema";
import {Task} from "./task.model";

@Table
export class ExtractMetadataTask extends Model<ExtractMetadataTask> implements ExtractMetadataTaskSchema {
    constructor(schema?: TaskSchema, options?: BuildOptions) {
        super(schema, options);
    }
    @PrimaryKey
    @ForeignKey(()=>Task)
    @Column
    taskId: string;

    @AllowNull(false)
    @Column
    type: string;

    @BelongsTo(() => Task, "taskId")
    task: Task;

    static createList(
        records: ExtractMetadataTaskSchema[],
        options?: BulkCreateOptions
    ): Promise<ExtractMetadataTask[]> {
        return ExtractMetadataTask.bulkCreate(records, options);
    }
}
