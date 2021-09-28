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
var SplitQuestionTask_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplitQuestionTask = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const task_model_1 = require("./task.model");
let SplitQuestionTask = SplitQuestionTask_1 = class SplitQuestionTask extends sequelize_typescript_1.Model {
    constructor(schema, options) {
        super(schema, options);
    }
    static createList(records, options) {
        return SplitQuestionTask_1.bulkCreate(records, options);
    }
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.ForeignKey(() => task_model_1.Task),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], SplitQuestionTask.prototype, "taskId", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], SplitQuestionTask.prototype, "answerFileKey", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], SplitQuestionTask.prototype, "questionFileKey", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => task_model_1.Task, "taskId"),
    __metadata("design:type", task_model_1.Task)
], SplitQuestionTask.prototype, "task", void 0);
SplitQuestionTask = SplitQuestionTask_1 = __decorate([
    sequelize_typescript_1.Table,
    __metadata("design:paramtypes", [Object, Object])
], SplitQuestionTask);
exports.SplitQuestionTask = SplitQuestionTask;
//# sourceMappingURL=splitquestiontask.model.js.map