"use strict";
var tslib_1 = require("tslib");
var BlisDebug_1 = require("../BlisDebug");
var Consts_1 = require("../Model/Consts");
var Help_1 = require("../Model/Help");
var BlisMemory_1 = require("../BlisMemory");
var Utils_1 = require("../Utils");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var EntityMetaData = (function () {
    function EntityMetaData(init) {
        this.bucket = false;
        this.negatable = false;
        Object.assign(this, init);
    }
    return EntityMetaData;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('bucket'),
    tslib_1.__metadata("design:type", Boolean)
], EntityMetaData.prototype, "bucket", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('negatable'),
    tslib_1.__metadata("design:type", Boolean)
], EntityMetaData.prototype, "negatable", void 0);
exports.EntityMetaData = EntityMetaData;
var Entity = (function () {
    function Entity(init) {
        this.id = undefined;
        this.entityType = undefined;
        this.luisPreName = undefined;
        this.name = undefined;
        this.metadata = new EntityMetaData();
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
    Entity.EntityButtons = function (name, id) {
        // Negative entities can't be edited or deleted directly
        if (name.startsWith(Consts_1.ActionCommand.NEGATIVE)) {
            return null;
        }
        var buttons = {
            "Edit": Consts_1.IntCommands.EDITENTITY + " " + id,
            "Delete": Consts_1.Commands.DELETEENTITY + " " + id,
        };
        return buttons;
    };
    Entity.MakeHero = function (title, name, id, type, prebuilt, metadata, buttons) {
        if (buttons === void 0) { buttons = true; }
        var desc = this.Description(type, prebuilt, metadata.bucket, metadata.negatable);
        return Utils_1.Utils.MakeHero(title, desc, name, buttons ? Entity.EntityButtons(name, id) : null);
    };
    Entity.prototype.Description = function () {
        return Entity.Description(this.entityType, this.luisPreName, this.metadata.bucket, this.metadata.negatable);
    };
    Entity.Description = function (type, prebuilt, bucket, negatible) {
        var description = "" + (prebuilt ? prebuilt : type) + (bucket ? " (bucket)" : "") + (negatible ? " (negatible)" : "");
        return description;
    };
    Entity.Sort = function (entities) {
        return entities.sort(function (n1, n2) {
            if (n1.name > n2.name) {
                return 1;
            }
            if (n1.name < n2.name) {
                return -1;
            }
            return 0;
        });
    };
    Entity.Add = function (blisClient, userState, entityId, entityName, entityType, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var error, msg, metadata, regex, prebuiltName, responses, memory, changeType, negName, oldEntity, oldNegName, oldNegId, negId, negId, _a, _b, error_2, errMsg;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Add Entity " + entityName);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 16, , 17]);
                        error = null;
                        if (!entityName) {
                            error = "You must provide an entity name for the entity to create.";
                        }
                        if (!entityType && !entityId) {
                            // Assume want LUIS entity if no entity given
                            entityType = Consts_1.EntityTypes.LUIS;
                        }
                        if (error) {
                            msg = Help_1.BlisHelp.CommandHelpString(Consts_1.Commands.ADDENTITY, error);
                            cb([msg]);
                            return [2 /*return*/];
                        }
                        metadata = new EntityMetaData();
                        metadata.bucket = entityName.indexOf(Consts_1.ActionCommand.BUCKET) > -1;
                        metadata.negatable = entityName.indexOf(Consts_1.ActionCommand.NEGATIVE) > -1;
                        regex = new RegExp("#|~", 'g');
                        entityName = entityName.replace(regex, '');
                        prebuiltName = null;
                        if (entityType) {
                            entityType = entityType.toUpperCase();
                            if (entityType != Consts_1.EntityTypes.LOCAL && entityType != Consts_1.EntityTypes.LUIS) {
                                prebuiltName = entityType;
                                entityType = Consts_1.EntityTypes.LUIS;
                            }
                        }
                        responses = [];
                        memory = new BlisMemory_1.BlisMemory(userState);
                        changeType = "";
                        negName = Consts_1.ActionCommand.NEGATIVE + entityName;
                        if (!entityId) return [3 /*break*/, 11];
                        return [4 /*yield*/, blisClient.GetEntity(userState[Consts_1.UserStates.APP], entityId)];
                    case 2:
                        oldEntity = _c.sent();
                        oldNegName = Consts_1.ActionCommand.NEGATIVE + oldEntity.name;
                        entityType = oldEntity.entityType;
                        // Edit GetEntity
                        return [4 /*yield*/, blisClient.EditEntity(userState[Consts_1.UserStates.APP], entityId, entityName, null, prebuiltName, metadata)];
                    case 3:
                        // Edit GetEntity
                        _c.sent();
                        memory.AddEntityLookup(entityName, entityId);
                        responses.push(Entity.MakeHero("Entity Edited", entityName, entityId, entityType, prebuiltName, metadata));
                        if (!oldEntity.metadata.negatable) return [3 /*break*/, 8];
                        oldNegId = memory.EntityName2Id(oldNegName);
                        if (!metadata.negatable) return [3 /*break*/, 5];
                        return [4 /*yield*/, blisClient.EditEntity(userState[Consts_1.UserStates.APP], oldNegId, negName, null, prebuiltName, metadata)];
                    case 4:
                        _c.sent();
                        memory.AddEntityLookup(negName, oldNegId);
                        responses.push(Entity.MakeHero("Entity Edited", negName, oldNegId, entityType, prebuiltName, metadata));
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, blisClient.DeleteEntity(userState[Consts_1.UserStates.APP], oldNegId)];
                    case 6:
                        _c.sent();
                        memory.RemoveEntityLookup(oldNegName);
                        responses.push(Entity.MakeHero("Entity Deleted", oldNegName, oldNegId, entityType, prebuiltName, metadata, false));
                        _c.label = 7;
                    case 7: return [3 /*break*/, 10];
                    case 8:
                        if (!metadata.negatable) return [3 /*break*/, 10];
                        return [4 /*yield*/, blisClient.AddEntity(userState[Consts_1.UserStates.APP], negName, entityType, prebuiltName, metadata)];
                    case 9:
                        negId = _c.sent();
                        memory.AddEntityLookup(negName, negId);
                        responses.push(Entity.MakeHero("Entity Added", negName, negId, entityType, prebuiltName, metadata));
                        _c.label = 10;
                    case 10: return [3 /*break*/, 14];
                    case 11: return [4 /*yield*/, blisClient.AddEntity(userState[Consts_1.UserStates.APP], entityName, entityType, prebuiltName, metadata)];
                    case 12:
                        entityId = _c.sent();
                        memory.AddEntityLookup(entityName, entityId);
                        responses.push(Entity.MakeHero("Entity Added", entityName, entityId, entityType, prebuiltName, metadata));
                        if (!metadata.negatable) return [3 /*break*/, 14];
                        return [4 /*yield*/, blisClient.AddEntity(userState[Consts_1.UserStates.APP], negName, entityType, prebuiltName, metadata)];
                    case 13:
                        negId = _c.sent();
                        memory.AddEntityLookup(negName, negId);
                        responses.push(Entity.MakeHero("Entity Added", negName, negId, entityType, prebuiltName, metadata));
                        _c.label = 14;
                    case 14:
                        cb(responses);
                        // Retrain the model with the new entity
                        _a = userState;
                        _b = Consts_1.UserStates.MODEL;
                        return [4 /*yield*/, blisClient.TrainModel(userState)];
                    case 15:
                        // Retrain the model with the new entity
                        _a[_b] = _c.sent();
                        return [3 /*break*/, 17];
                    case 16:
                        error_2 = _c.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_2);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb([errMsg]);
                        return [3 /*break*/, 17];
                    case 17: return [2 /*return*/];
                }
            });
        });
    };
    /** Delete Entity with the given entityId **/
    Entity.Delete = function (blisClient, userState, entityId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg, responses, memory, entity, negName, entityNegId, error_3, errMsg;
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
                        _a.trys.push([1, 6, , 7]);
                        responses = [];
                        memory = new BlisMemory_1.BlisMemory(userState);
                        return [4 /*yield*/, blisClient.GetEntity(userState[Consts_1.UserStates.APP], entityId)];
                    case 2:
                        entity = _a.sent();
                        // TODO clear api save lookup
                        return [4 /*yield*/, blisClient.DeleteEntity(userState[Consts_1.UserStates.APP], entityId)];
                    case 3:
                        // TODO clear api save lookup
                        _a.sent();
                        memory.RemoveEntityLookup(entity.name);
                        responses.push(Entity.MakeHero("Entity Deleted", entity.name, entity.id, entity.entityType, entity.luisPreName, entity.metadata, false));
                        if (!entity.metadata.negatable) return [3 /*break*/, 5];
                        negName = Consts_1.ActionCommand.NEGATIVE + entity.name;
                        entityNegId = memory.EntityName2Id(negName);
                        return [4 /*yield*/, blisClient.DeleteEntity(userState[Consts_1.UserStates.APP], entityNegId)];
                    case 4:
                        _a.sent();
                        memory.RemoveEntityLookup(negName);
                        responses.push(Entity.MakeHero("Entity Deleted", negName, entityNegId, entity.entityType, entity.luisPreName, entity.metadata, false));
                        _a.label = 5;
                    case 5:
                        cb(responses);
                        return [3 /*break*/, 7];
                    case 6:
                        error_3 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_3);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb([errMsg]);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /** Get all actions **/
    Entity.Get = function (blisClient, userState, search, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var debug, entityIds, json, memory, msg, responses, entities, _i, entityIds_1, entityId, entity, _a, entities_1, entity, desc, error_4, errMsg;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting entities");
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, , 8]);
                        debug = false;
                        if (search && search.indexOf(Consts_1.ActionCommand.DEBUG) > -1) {
                            debug = true;
                            search = search.replace(Consts_1.ActionCommand.DEBUG, "");
                        }
                        entityIds = [];
                        return [4 /*yield*/, blisClient.GetEntities(userState[Consts_1.UserStates.APP])];
                    case 2:
                        json = _b.sent();
                        entityIds = JSON.parse(json)['ids'];
                        BlisDebug_1.BlisDebug.Log("Found " + entityIds.length + " entities");
                        memory = new BlisMemory_1.BlisMemory(userState);
                        if (entityIds.length == 0) {
                            cb(["This app contains no Entities."]);
                            return [2 /*return*/];
                        }
                        msg = "**Entities**\n\n";
                        responses = [];
                        entities = [];
                        if (entityIds.length == 0) {
                            responses.push(["This application contains no entities."]);
                            cb(responses);
                            return [2 /*return*/];
                        }
                        _i = 0, entityIds_1 = entityIds;
                        _b.label = 3;
                    case 3:
                        if (!(_i < entityIds_1.length)) return [3 /*break*/, 6];
                        entityId = entityIds_1[_i];
                        return [4 /*yield*/, blisClient.GetEntity(userState[Consts_1.UserStates.APP], entityId)];
                    case 4:
                        entity = _b.sent();
                        if (!search || entity.name.indexOf(search) > -1) {
                            entities.push(entity);
                        }
                        // Add to entity lookup table
                        memory.AddEntityLookup(entity.name, entityId);
                        _b.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        // Sort
                        entities = Entity.Sort(entities);
                        // Generate output
                        for (_a = 0, entities_1 = entities; _a < entities_1.length; _a++) {
                            entity = entities_1[_a];
                            if (debug) {
                                msg += entity.name + "  " + entity.Description() + " " + entity.id + "\n\n";
                            }
                            else {
                                desc = entity.Description();
                                responses.push(Utils_1.Utils.MakeHero(entity.name, desc, null, Entity.EntityButtons(entity.name, entity.id)));
                            }
                        }
                        if (debug) {
                            responses.push(msg);
                        }
                        if (responses.length == 0) {
                            responses.push("No Entities match your query.");
                        }
                        cb(responses);
                        return [3 /*break*/, 8];
                    case 7:
                        error_4 = _b.sent();
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
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: EntityMetaData, name: 'metadata' }),
    tslib_1.__metadata("design:type", EntityMetaData)
], Entity.prototype, "metadata", void 0);
exports.Entity = Entity;
//# sourceMappingURL=Entity.js.map