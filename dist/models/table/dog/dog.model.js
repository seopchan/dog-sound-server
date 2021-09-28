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
exports.Dog = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const sound_model_1 = require("./sound.model");
let Dog = class Dog extends sequelize_typescript_1.Model {
    constructor(schema, options) {
        super(schema, options);
    }
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Dog.prototype, "dogKey", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Dog.prototype, "musicTime", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Dog.prototype, "soundCount", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => sound_model_1.Sound),
    __metadata("design:type", Array)
], Dog.prototype, "sounds", void 0);
Dog = __decorate([
    sequelize_typescript_1.Table,
    __metadata("design:paramtypes", [Object, Object])
], Dog);
exports.Dog = Dog;
//# sourceMappingURL=dog.model.js.map