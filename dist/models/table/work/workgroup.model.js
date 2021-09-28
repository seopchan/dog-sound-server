// import {
//     AllowNull,
//     Column,
//     HasMany,
//     Model,
//     PrimaryKey,
//     Table
// } from "sequelize-typescript";
// import {
//     BuildOptions
// } from "sequelize";
// import {WorkGroupSchema} from "../../schema/work/workgroup.schema";
// import {Work2} from "./work2.model";
//
// @Table
// export class WorkGroup extends Model<WorkGroup> implements WorkGroupSchema {
//     constructor(schema?: WorkGroupSchema, options?: BuildOptions) {
//         super(schema, options);
//     }
//
//     @PrimaryKey
//     @Column
//     workGroupId: string;
//
//     @AllowNull(false)
//     @Column
//     workKey: string;
//
//     @AllowNull(false)
//     @Column
//     status: string;
//
//     @AllowNull(false)
//     @Column
//     callbackStatus: string;
//
//     @AllowNull(false)
//     @Column
//     retryCount: number;
//
//     @HasMany(() => Work2)
//     work: Work2[];
// }
//# sourceMappingURL=workgroup.model.js.map