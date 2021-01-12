import {
    AllowNull,
    BelongsTo,
    Column,
    ForeignKey,
    Model,
    PrimaryKey,
    Table
} from "sequelize-typescript";
import Sequelize, {BuildOptions, Op} from "sequelize";
import {BulkCreateOptions} from "sequelize/types/lib/model";
import {WorkSchema} from "../../schema/work/work.schema";
import {WorkStatus} from "../../schema/work/workgroup.schema";
import {WorkGroup} from "./workgroup.model";

@Table
export class Work extends Model<Work> implements WorkSchema {
    constructor(schema?: WorkSchema, options?: BuildOptions) {
        super(schema, options);
    }

    @PrimaryKey
    @Column
    workId: string;

    @AllowNull(false)
    @Column
    status: string;

    @ForeignKey(() => WorkGroup)
    @Column
    workGroupId: string;

    @BelongsTo(() => WorkGroup, "workGroupId")
    workGroup: WorkGroup;

    static getCheckStatus = (status: WorkStatus | undefined) => {
        let where = {};
        switch (status) {
            case WorkStatus.SUCCESS:
                where = {
                    start: {
                        [Op.gt]: Sequelize.fn("NOW")
                    }
                };
                return where;
            case WorkStatus.WAIT:
                where = {
                    end: {
                        [Op.gt]: Sequelize.fn("NOW")
                    },
                    start: {
                        [Op.lt]: Sequelize.fn("NOW")
                    }
                };
                return where;
            case WorkStatus.FAIL:
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
        records: WorkSchema[],
        options?: BulkCreateOptions
    ): Promise<Work[]> {
        return Work.bulkCreate(records, options);
    }
}
