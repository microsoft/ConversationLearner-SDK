"use strict";
var tslib_1 = require("tslib");
var BlisDebug_1 = require("../BlisDebug");
var Consts_1 = require("../Model/Consts");
var Help_1 = require("../Model/Help");
var BlisMemory_1 = require("../BlisMemory");
var Utils_1 = require("../Utils");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Entity = (function () {
    function Entity(init) {
        this.id = undefined;
        this.entityType = undefined;
        this.luisPreName = undefined;
        this.name = undefined;
        Object.assign(this, init);
    }
    Entity.prototype.Equal = function (entity) {
        if (this.entityType != entity.entityType)
            return false;
        if (this.luisPreName != entity.luisPreName)
            return false;
        if (this.name != entity.name)
            return false;
        return true;
    };
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
    Entity.Add = function (blisClient, userState, entityId, entityName, entityType, prebuiltName, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var error, msg, msg, msg, memory, changeType, card, error_2, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Add Entity " + entityName);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        error = null;
                        if (!entityName) {
                            error = "You must provide an entity name for the entity to create.";
                        }
                        if (!entityType && !entityId) {
                            error = "You must provide an entity type for the entity to create.";
                        }
                        if (error) {
                            msg = Help_1.BlisHelp.CommandHelpString(Consts_1.Commands.ADDENTITY, error);
                            cb([msg]);
                            return [2 /*return*/];
                        }
                        if (entityType) {
                            entityType = entityType.toUpperCase();
                            if (entityType != Consts_1.EntityTypes.LOCAL && entityType != Consts_1.EntityTypes.LUIS) {
                                msg = Help_1.BlisHelp.CommandHelpString(Consts_1.Commands.ADDENTITY, "Entity type must be 'LOCAL' or 'LUIS'");
                                cb([msg]);
                                return [2 /*return*/];
                            }
                            if (entityType == Consts_1.EntityTypes.LOCAL && prebuiltName != null) {
                                msg = Help_1.BlisHelp.CommandHelpString(Consts_1.Commands.ADDENTITY, "LOCAL entities shouldn't include a prebuilt name");
                                cb([msg]);
                                return [2 /*return*/];
                            }
                        }
                        memory = new BlisMemory_1.BlisMemory(userState);
                        changeType = "";
                        if (!entityId) return [3 /*break*/, 3];
                        return [4 /*yield*/, blisClient.EditEntity(userState[Consts_1.UserStates.APP], entityId, entityName, entityType, prebuiltName)];
                    case 2:
                        //memory.RemoveEntityLookup() TODO
                        entityId = _a.sent();
                        changeType = "Edited";
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, blisClient.AddEntity(userState[Consts_1.UserStates.APP], entityName, entityType, prebuiltName)];
                    case 4:
                        _a.sent();
                        changeType = "Created";
                        _a.label = 5;
                    case 5:
                        memory.AddEntityLookup(entityName, entityId);
                        card = Utils_1.Utils.MakeHero(changeType + " Entity", entityId, entityName, null);
                        cb([card]);
                        return [3 /*break*/, 7];
                    case 6:
                        error_2 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_2);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb([errMsg]);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /** Delete Entity with the given entityId */
    Entity.Delete = function (blisClient, userState, entityId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg, error_3, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Entity");
                        if (!entityId) {
                            msg = "You must provide the ID of the entity to delete.\n\n     " + Consts_1.Commands.DELETEENTITY + " {app ID}";
                            cb(msg);
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        // TODO clear savelookup
                        return [4 /*yield*/, blisClient.DeleteEntity(userState[Consts_1.UserStates.APP], entityId)];
                    case 2:
                        // TODO clear savelookup
                        _a.sent();
                        cb("Deleted Entity " + entityId);
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_3);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb(errMsg);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Entity.Get = function (blisClient, userState, detail, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityIds, json, memory, msg, responses, _i, entityIds_1, entityId, entity, type, error_4, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting entities");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        entityIds = [];
                        return [4 /*yield*/, blisClient.GetEntities(userState[Consts_1.UserStates.APP])];
                    case 2:
                        json = _a.sent();
                        entityIds = JSON.parse(json)['ids'];
                        BlisDebug_1.BlisDebug.Log("Found " + entityIds.length + " entities");
                        memory = new BlisMemory_1.BlisMemory(userState);
                        if (entityIds.length == 0) {
                            cb("This app contains no Entities.");
                            return [2 /*return*/];
                        }
                        msg = "**Entities**\n\n";
                        responses = [];
                        if (entityIds.length == 0) {
                            responses.push(["This application contains no entities."]);
                            cb(responses);
                            return [2 /*return*/];
                        }
                        _i = 0, entityIds_1 = entityIds;
                        _a.label = 3;
                    case 3:
                        if (!(_i < entityIds_1.length)) return [3 /*break*/, 6];
                        entityId = entityIds_1[_i];
                        return [4 /*yield*/, blisClient.GetEntity(userState[Consts_1.UserStates.APP], entityId)];
                    case 4:
                        entity = _a.sent();
                        if (detail) {
                            type = entity.luisPreName ? entity.luisPreName : entity.entityType;
                            responses.push(Utils_1.Utils.MakeHero(entity.name, type, null, {
                                "Edit": Consts_1.IntCommands.EDITENTITY + " " + entityId,
                                "Delete": Consts_1.Commands.DELETEENTITY + " " + entityId,
                            }));
                        }
                        else {
                            msg += entity.name + "\n\n";
                        }
                        // Add to entity lookup table
                        memory.AddEntityLookup(entity.name, entityId);
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        if (!detail) {
                            responses.push(msg);
                        }
                        cb(responses);
                        return [3 /*break*/, 8];
                    case 7:
                        error_4 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_4);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb([errMsg]);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
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