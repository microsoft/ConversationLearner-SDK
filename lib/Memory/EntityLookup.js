"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
// TODO - eliminate need for this
var EntityLookup = (function () {
    function EntityLookup(init) {
        this.toId = {};
        this.toName = {};
        Object.assign(this, init);
    }
    EntityLookup.prototype.Serialize = function () {
        return JSON.stringify(this);
    };
    EntityLookup.Deserialize = function (type, text) {
        if (!text)
            return null;
        var json = JSON.parse(text);
        var entityLookup = new EntityLookup({
            toId: json.toId ? json.toId : {},
            toName: json.toName ? json.toName : {}
        });
        return entityLookup;
    };
    EntityLookup.Get = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var data;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.memory) {
                            throw new Error("Entity Lookup called without initialzing memory");
                        }
                        return [4 /*yield*/, this.memory.GetAsync(this.MEMKEY)];
                    case 1:
                        data = _a.sent();
                        if (data) {
                            return [2 /*return*/, EntityLookup.Deserialize(EntityLookup, data)];
                        }
                        return [2 /*return*/, new EntityLookup()];
                }
            });
        });
    };
    EntityLookup.Set = function (entityLookup) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.memory) {
                            throw new Error("Entity Lookup called without initialzing memory");
                        }
                        return [4 /*yield*/, this.memory.SetAsync(this.MEMKEY, entityLookup.Serialize())];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    EntityLookup.Clear = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityLookup;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        entityLookup = new EntityLookup();
                        return [4 /*yield*/, this.Set(entityLookup)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    EntityLookup.ToString = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityLookup;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        entityLookup = _a.sent();
                        return [2 /*return*/, JSON.stringify(entityLookup)];
                }
            });
        });
    };
    EntityLookup.Add = function (entityName, entityId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityLookup;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        entityLookup = _a.sent();
                        // Set values
                        entityLookup.toId[entityName] = entityId;
                        entityLookup.toName[entityId] = entityName;
                        // Save
                        return [4 /*yield*/, this.Set(entityLookup)];
                    case 2:
                        // Save
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    EntityLookup.Remove = function (entityName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityLookup, entityId;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        entityLookup = _a.sent();
                        // Remove values
                        delete entityLookup.toId[entityName];
                        entityId = entityLookup.toName[entityName];
                        delete entityLookup.toName[entityId];
                        // Save
                        return [4 /*yield*/, this.Set(entityLookup)];
                    case 2:
                        // Save
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Convert EntityName to EntityId */
    EntityLookup.ToId = function (entityName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityLookup;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        entityLookup = _a.sent();
                        // Make independant of prefix
                        entityName = entityName.replace('$', '');
                        // Return value
                        return [2 /*return*/, entityLookup.toId[entityName]];
                }
            });
        });
    };
    /** Convert EntityId to EntityName */
    EntityLookup.ToName = function (entityId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityLookup;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        entityLookup = _a.sent();
                        // Return value
                        return [2 /*return*/, entityLookup.toName[entityId]];
                }
            });
        });
    };
    /** Convert array entityIds into an array of entityNames */
    EntityLookup.Ids2Names = function (ids) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityLookup, names, _i, ids_1, entityId, name_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        entityLookup = _a.sent();
                        names = [];
                        for (_i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
                            entityId = ids_1[_i];
                            name_1 = entityLookup.toName[entityId];
                            names.push(name_1);
                        }
                        return [2 /*return*/, names];
                }
            });
        });
    };
    EntityLookup.MEMKEY = "ENTITYLOOKUP";
    return EntityLookup;
}());
exports.EntityLookup = EntityLookup;
//# sourceMappingURL=EntityLookup.js.map