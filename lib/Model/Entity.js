"use strict";
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var BlisDebug_1 = require("../BlisDebug");
var Entity = (function () {
    function Entity(init) {
        this.id = undefined;
        this.entityType = undefined;
        this.luisPreName = undefined;
        this.name = undefined;
        Object.assign(this, init);
    }
    Entity.toText = function (client, appId, entityId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entity, error_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, client.GetEntity(appId, entityId)];
                    case 1:
                        entity = _a.sent();
                        return [2 /*return*/, entity.name];
                    case 2:
                        error_1 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_1);
                        throw (error_1);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return Entity;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('id'),
    tslib_1.__metadata("design:type", String)
], Entity.prototype, "id", void 0);
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
    tslib_1.__metadata("design:type", String)
], Entity.prototype, "name", void 0);
exports.Entity = Entity;
//# sourceMappingURL=Entity.js.map