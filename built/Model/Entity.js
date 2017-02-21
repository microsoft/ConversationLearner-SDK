"use strict";
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Entity = (function () {
    function Entity(init) {
        this.type = undefined;
        this.entity = undefined;
        this.resolution = undefined;
        Object.assign(this, init);
    }
    return Entity;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('type'),
    tslib_1.__metadata("design:type", String)
], Entity.prototype, "type", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('entity'),
    tslib_1.__metadata("design:type", String)
], Entity.prototype, "entity", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('resolution'),
    tslib_1.__metadata("design:type", Object)
], Entity.prototype, "resolution", void 0);
exports.Entity = Entity;
//# sourceMappingURL=Entity.js.map