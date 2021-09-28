"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var Task_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const task_schema_1 = require("../../schema/work/task.schema");
const sequelize_1 = __importStar(require("sequelize"));
const taskgroup_model_1 = require("./taskgroup.model");
const extractmetadatatask_model_1 = require("./extractmetadatatask.model");
const splitquestiontask_model_1 = require("./splitquestiontask.model");
const makepapertask_model_1 = require("./makepapertask.model");
let Task = Task_1 = class Task extends sequelize_typescript_1.Model {
    constructor(schema, options) {
        super(schema, options);
    }
    static createList(records, options) {
        return Task_1.bulkCreate(records, options);
    }
};
Task.getCheckStatus = (status) => {
    let where = {};
    switch (status) {
        case task_schema_1.TaskStatus.SUCCESS:
            where = {
                start: {
                    [sequelize_1.Op.gt]: sequelize_1.default.fn("NOW")
                }
            };
            return where;
        case task_schema_1.TaskStatus.WAIT:
            where = {
                end: {
                    [sequelize_1.Op.gt]: sequelize_1.default.fn("NOW")
                },
                start: {
                    [sequelize_1.Op.lt]: sequelize_1.default.fn("NOW")
                }
            };
            return where;
        case task_schema_1.TaskStatus.FAIL:
            where = {
                end: {
                    [sequelize_1.Op.lt]: sequelize_1.default.fn("NOW")
                }
            };
            return where;
        default:
            break;
    }
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Task.prototype, "taskId", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => taskgroup_model_1.TaskGroup),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Task.prototype, "taskGroupId", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Task.prototype, "type", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Task.prototype, "status", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.TEXT({ length: "long" })),
    __metadata("design:type", String)
], Task.prototype, "result", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => taskgroup_model_1.TaskGroup, "taskGroupId"),
    __metadata("design:type", taskgroup_model_1.TaskGroup)
], Task.prototype, "taskGroup", void 0);
__decorate([
    sequelize_typescript_1.HasOne(() => extractmetadatatask_model_1.ExtractMetadataTask),
    __metadata("design:type", extractmetadatatask_model_1.ExtractMetadataTask)
], Task.prototype, "extractMetadataTask", void 0);
__decorate([
    sequelize_typescript_1.HasOne(() => splitquestiontask_model_1.SplitQuestionTask),
    __metadata("design:type", splitquestiontask_model_1.SplitQuestionTask)
], Task.prototype, "splitQuestionTask", void 0);
__decorate([
    sequelize_typescript_1.HasOne(() => makepapertask_model_1.MakePaperTask),
    __metadata("design:type", makepapertask_model_1.MakePaperTask)
], Task.prototype, "makePaperTask", void 0);
Task = Task_1 = __decorate([
    sequelize_typescript_1.Table,
    __metadata("design:paramtypes", [Object, Object])
], Task);
exports.Task = Task;
//# sourceMappingURL=task.model.js.map