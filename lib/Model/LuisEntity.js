"use strict";
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var LuisEntity = (function () {
    function LuisEntity(init) {
        this.id = undefined;
        this.type = undefined;
        this.value = undefined;
        this.resolution = undefined;
        Object.assign(this, init);
    }
    return LuisEntity;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('id'),
    tslib_1.__metadata("design:type", String)
], LuisEntity.prototype, "id", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('type'),
    tslib_1.__metadata("design:type", String)
], LuisEntity.prototype, "type", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('entity'),
    tslib_1.__metadata("design:type", String)
], LuisEntity.prototype, "value", void 0);
exports.LuisEntity = LuisEntity;
//# sourceMappingURL=LuisEntity.js.map