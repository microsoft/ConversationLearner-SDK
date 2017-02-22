"use strict";
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var LuisEntity = (function () {
    function LuisEntity(init) {
        this.type = undefined;
        this.entity = undefined;
        this.resolution = undefined;
        Object.assign(this, init);
    }
    return LuisEntity;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('type'),
    tslib_1.__metadata("design:type", String)
], LuisEntity.prototype, "type", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('entity'),
    tslib_1.__metadata("design:type", String)
], LuisEntity.prototype, "entity", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('resolution'),
    tslib_1.__metadata("design:type", Object)
], LuisEntity.prototype, "resolution", void 0);
exports.LuisEntity = LuisEntity;
//# sourceMappingURL=LuisEntity.js.map