"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var BlisClient_1 = require("../BlisClient");
var blis_models_1 = require("blis-models");
var Entity = (function (_super) {
    tslib_1.__extends(Entity, _super);
    function Entity() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /** Return negative entity if it exists */
    Entity.prototype.GetNegativeEntity = function (appId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.metadata && this.metadata.negativeId)) return [3 /*break*/, 2];
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetEntity(appId, this.metadata.negativeId, null)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [2 /*return*/, null];
                }
            });
        });
    };
    Entity.prototype.Description = function () {
        return Entity.Description(this.entityType, this.metadata);
    };
    Entity.Description = function (entityType, metadata) {
        var description = "" + entityType + (metadata.isBucket ? " (bucket)" : "");
        description += "" + (metadata.negativeId ? " (negatable)" : "");
        description += "" + (metadata.positiveId ? " (delete)" : "");
        return description;
    };
    Entity.Sort = function (entities) {
        return entities.sort(function (n1, n2) {
            var c1 = n1.entityName.toLowerCase();
            var c2 = n2.entityName.toLowerCase();
            if (c1 > c2) {
                return 1;
            }
            if (c1 < c2) {
                return -1;
            }
            return 0;
        });
    };
    return Entity;
}(blis_models_1.EntityBase));
exports.Entity = Entity;
//# sourceMappingURL=Entity.js.map