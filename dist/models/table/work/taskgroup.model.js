"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskGroup = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const task_model_1 = require("./task.model");
const work_model_1 = require("./work.model");
let TaskGroup = class TaskGroup extends sequelize_typescript_1.Model {
    constructor(schema, options) {
        super(schema, options);
    }
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], TaskGroup.prototype, "taskGroupId", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], TaskGroup.prototype, "status", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.TEXT({ length: "long" })),
    __metadata("design:type", String)
], TaskGroup.prototype, "result", void 0);
__decorate([
    sequelize_typescript_1.HasOne(() => work_model_1.Work),
    __metadata("design:type", work_model_1.Work)
], TaskGroup.prototype, "work", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => task_model_1.Task),
    __metadata("design:type", Array)
], TaskGroup.prototype, "tasks", void 0);
TaskGroup = __decorate([
    sequelize_typescript_1.Table,
    __metadata("design:paramtypes", [Object, Object])
], TaskGroup);
exports.TaskGroup = TaskGroup;
//# sourceMappingURL=taskgroup.model.js.map