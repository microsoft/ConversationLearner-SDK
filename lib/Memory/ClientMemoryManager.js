"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var ClientMemoryManager = (function () {
    function ClientMemoryManager(memory, entities) {
        this.blisMemory = null;
        this.entities = null;
        this.entities = entities;
        this.blisMemory = memory;
    }
    ClientMemoryManager.prototype.FindEntity = function (entityName) {
        var match = this.entities.find(function (e) { return e.entityName == entityName; });
        return match;
    };
    ClientMemoryManager.prototype.RememberEntity = function (entityName, value) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entity, isBucket;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        entity = this.FindEntity(entityName);
                        if (!entity) {
                            // TODO Log error to console
                            return [2 /*return*/, null];
                        }
                        isBucket = entity.metadata ? entity.metadata.isBucket : false;
                        return [4 /*yield*/, this.blisMemory.BotMemory().Remember(entity.entityName, entity.entityId, value, isBucket)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ClientMemoryManager.prototype.ForgetEntity = function (entityName, value) {
        if (value === void 0) { value = null; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entity, isBucket;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        entity = this.FindEntity(entityName);
                        if (!entity) {
                            // TODO Log error to console
                            return [2 /*return*/, null];
                        }
                        isBucket = entity.metadata ? entity.metadata.isBucket : false;
                        return [4 /*yield*/, this.blisMemory.BotMemory().Forget(entity.entityName, value, isBucket)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ClientMemoryManager.prototype.EntityValue = function (entityName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.blisMemory.BotMemory().Value(entityName)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    ClientMemoryManager.prototype.EntityValueAsList = function (entityName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.blisMemory.BotMemory().ValueAsList(entityName)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    ClientMemoryManager.prototype.GetFilledEntities = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.blisMemory.BotMemory().RememberedIds()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return ClientMemoryManager;
}());
exports.ClientMemoryManager = ClientMemoryManager;
//# sourceMappingURL=ClientMemoryManager.js.map