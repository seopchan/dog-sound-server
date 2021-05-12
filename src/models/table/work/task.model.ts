import {
    AllowNull,
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    HasOne,
    Model,
    PrimaryKey,
    Table
} from "sequelize-typescript";
import {TaskSchema, TaskStatus} from "../../schema/work/task.schema";
import Sequelize, {BuildOptions, BulkCreateOptions, Op} from "sequelize";
import {TaskGroup} from "./taskgroup.model";
import {ExtractMetadataTask} from "./extractmetadatatask.model";
import {SplitQuestionTask} from "./splitquestiontask.model";
import {MakePaperTask} from "./makepapertask.model";

@Table
export class Task extends Model<Task> implements TaskSchema {
    constructor(schema?: TaskSchema, options?: BuildOptions) {
        super(schema, options);
    }
    @PrimaryKey
    @Column
    taskId: string;

    @ForeignKey(() => TaskGroup)
    @Column
    taskGroupId: string;

    @AllowNull(false)
    @Column
    type: string;

    @AllowNull(false)
    @Column
    status: string;

    @AllowNull(true)
    @Column(DataType.TEXT({ length: "long" }))
    result: string;

    @BelongsTo(() => TaskGroup, "taskGroupId")
    taskGroup: TaskGroup;

    @HasOne(() => ExtractMetadataTask)
    extractMetadataTask: ExtractMetadataTask;

    @HasOne(() => SplitQuestionTask)
    splitQuestionTask: SplitQuestionTask;

    @HasOne(() => MakePaperTask)
    makePaperTask: MakePaperTask;

    static getCheckStatus = (status: TaskStatus | undefined) => {
        let where = {};
        switch (status) {
            case TaskStatus.SUCCESS:
                where = {
                    start: {
                        [Op.gt]: Sequelize.fn("NOW")
                    }
                };
                return where;
            case TaskStatus.WAIT:
                where = {
                    end: {
                        [Op.gt]: Sequelize.fn("NOW")
                    },
                    start: {
                        [Op.lt]: Sequelize.fn("NOW")
                    }
                };
                return where;
            case TaskStatus.FAIL:
                where = {
                    end: {
                        [Op.lt]: Sequelize.fn("NOW")
                    }
                };
                return where;
            default:
                break;
        }
    }

    static createList(
        records: TaskSchema[],
        options?: BulkCreateOptions
    ): Promise<Task[]> {
        return Task.bulkCreate(records, options);
    }
}
