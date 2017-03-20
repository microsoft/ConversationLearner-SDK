"use strict";
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Entity = (function () {
    function Entity(init) {
        this.entityType = undefined;
        this.luisPreName = undefined;
        this.name = undefined;
        Object.assign(this, init);
    }
    return Entity;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('EntityType'),
    tslib_1.__metadata("design:type", String)
], Entity.prototype, "entityType", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('LUISPreName'),
    tslib_1.__metadata("design:type", String)
], Entity.prototype, "luisPreName", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('name'),
    tslib_1.__metadata("design:type", Number)
], Entity.prototype, "name", void 0);
exports.Entity = Entity;
//# sourceMappingURL=Entity.js.map