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
exports.Sound = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const dog_model_1 = require("./dog.model");
let Sound = class Sound extends sequelize_typescript_1.Model {
    constructor(schema, options) {
        super(schema, options);
    }
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Sound.prototype, "soundKey", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => dog_model_1.Dog),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Sound.prototype, "dogKey", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => dog_model_1.Dog, "dogKey"),
    __metadata("design:type", dog_model_1.Dog)
], Sound.prototype, "dog", void 0);
Sound = __decorate([
    sequelize_typescript_1.Table,
    __metadata("design:paramtypes", [Object, Object])
], Sound);
exports.Sound = Sound;
//# sourceMappingURL=sound.model.js.map