// import {
//     AllowNull,
//     BelongsTo,
//     Column,
//     ForeignKey,
//     Model,
//     PrimaryKey,
//     Table
// } from "sequelize-typescript";
// import Sequelize, {BuildOptions, Op} from "sequelize";
// import {BulkCreateOptions} from "sequelize/types/lib/model";
// import {Work2Schema} from "../../schema/work/work2.schema";
// import {WorkStatus} from "../../schema/work/workgroup.schema";
// import {WorkGroup} from "./workgroup.model";
//
// @Table
// export class Work2 extends Model<Work2> implements Work2Schema {
//     constructor(schema?: Work2Schema, options?: BuildOptions) {
//         super(schema, options);
//     }
//
//     @PrimaryKey
//     @Column
//     workId: string;
//
//     @PrimaryKey
//     @ForeignKey(() => WorkGroup)
//     @Column
//     workGroupId: string;
//
//     @AllowNull(false)
//     @Column
//     status: string;
//
//     @BelongsTo(() => WorkGroup, "workGroupId")
//     workGroup: WorkGroup;
//
//     static getCheckStatus = (status: WorkStatus | undefined) => {
//         let where = {};
//         switch (status) {
//             case WorkStatus.SUCCESS:
//                 where = {
//                     start: {
//                         [Op.gt]: Sequelize.fn("NOW")
//                     }
//                 };
//                 return where;
//             case WorkStatus.WAIT:
//                 where = {
//                     end: {
//                         [Op.gt]: Sequelize.fn("NOW")
//                     },
//                     start: {
//                         [Op.lt]: Sequelize.fn("NOW")
//                     }
//                 };
//                 return where;
//             case WorkStatus.FAIL:
//                 where = {
//                     end: {
//                         [Op.lt]: Sequelize.fn("NOW")
//                     }
//                 };
//                 return where;
//             default:
//                 break;
//         }
//     }
//
//     static createList(
//         records: Work2Schema[],
//         options?: BulkCreateOptions
//     ): Promise<Work2[]> {
//         return Work2.bulkCreate(records, options);
//     }
// }
//# sourceMappingURL=work2.model.js.map