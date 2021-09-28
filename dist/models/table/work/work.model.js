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
exports.Work = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const taskgroup_model_1 = require("./taskgroup.model");
let Work = class Work extends sequelize_typescript_1.Model {
    constructor(schema, options) {
        super(schema, options);
    }
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Work.prototype, "workKey", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => taskgroup_model_1.TaskGroup),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Work.prototype, "taskGroupId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => taskgroup_model_1.TaskGroup, "taskGroupId"),
    __metadata("design:type", taskgroup_model_1.TaskGroup)
], Work.prototype, "taskGroup", void 0);
Work = __decorate([
    sequelize_typescript_1.Table,
    __metadata("design:paramtypes", [Object, Object])
], Work);
exports.Work = Work;
//# sourceMappingURL=work.model.js.map