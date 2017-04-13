"use strict";
var tslib_1 = require("tslib");
var BlisDebug_1 = require("../BlisDebug");
var Consts_1 = require("../Model/Consts");
var BlisApp_1 = require("../Model/BlisApp");
var Utils_1 = require("../Utils");
var CommandHandler_1 = require("../CommandHandler");
var Menu_1 = require("../Menu");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var EntityMetaData = (function () {
    function EntityMetaData(init) {
        this.bucket = false;
        this.negative = undefined;
        this.positive = undefined;
        Object.assign(this, init);
    }
    /** Make negate of given metadata */
    EntityMetaData.prototype.MakeNegative = function (posId) {
        return new EntityMetaData({ bucket: this.bucket, negative: null, positive: posId });
    };
    return EntityMetaData;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('bucket'),
    tslib_1.__metadata("design:type", Boolean)
], EntityMetaData.prototype, "bucket", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('negative'),
    tslib_1.__metadata("design:type", String)
], EntityMetaData.prototype, "negative", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('positive'),
    tslib_1.__metadata("design:type", String)
], EntityMetaData.prototype, "positive", void 0);
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
    /** Return negative entity name */
    Entity.NegativeName = function (name) {
        return Consts_1.ActionCommand.NEGATIVE + name;
    };
    /** Return negative entity if it exists */
    Entity.prototype.GetNegativeEntity = function (context) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.metadata && this.metadata.negative)) return [3 /*break*/, 2];
                        return [4 /*yield*/, context.client.GetEntity(context.state[Consts_1.UserStates.APP], this.metadata.negative)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [2 /*return*/, null];
                }
            });
        });
    };
    /** Is the Entity used anywhere */
    Entity.prototype.InUse = function (context) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var appContent, appString, negId;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, context.client.ExportApp(context.state[Consts_1.UserStates.APP])];
                    case 1:
                        appContent = _a.sent();
                        // Clear entities
                        appContent.entities = null;
                        appString = JSON.stringify(appContent);
                        negId = this.metadata.negative;
                        if (negId && appString.indexOf(negId) > -1) {
                            return [2 /*return*/, true];
                        }
                        ;
                        return [2 /*return*/, (appString.indexOf(this.id) > -1)];
                }
            });
        });
    };
    Entity.Buttons = function (name, id) {
        // Negative entities can't be edited or deleted directly
        if (name.startsWith(Consts_1.ActionCommand.NEGATIVE)) {
            return null;
        }
        var buttons = {
            "Edit": CommandHandler_1.IntCommands.EDITENTITY + " " + id,
            "Delete": CommandHandler_1.LineCommands.DELETEENTITY + " " + id,
        };
        return buttons;
    };
    Entity.MakeHero = function (title, name, id, type, prebuilt, metadata, buttons) {
        if (buttons === void 0) { buttons = true; }
        var desc = this.Description(type, prebuilt, metadata);
        return Utils_1.Utils.MakeHero(title, desc, name, buttons ? Entity.Buttons(name, id) : null);
    };
    Entity.prototype.Description = function () {
        return Entity.Description(this.entityType, this.luisPreName, this.metadata);
    };
    Entity.Description = function (type, prebuilt, metadata) {
        var description = "" + (prebuilt ? prebuilt : type) + (metadata.bucket ? " (bucket)" : "") + (metadata.negative ? " (negatable)" : "") + (metadata.positive ? " (delete)" : "");
        return description;
    };
    Entity.Sort = function (entities) {
        return entities.sort(function (n1, n2) {
            var c1 = n1.name.toLowerCase();
            var c2 = n2.name.toLowerCase();
            if (c1 > c2) {
                return 1;
            }
            if (c1 < c2) {
                return -1;
            }
            return 0;
        });
    };
    Entity.Add = function (context, entityId, entityType, content, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var isBucket, isNegatable, regex, prebuiltName, responses, memory, changeType, negName, oldEntity, oldNegName, oldNegId, metadata, negmeta, metadata, negmeta, newNegId, metadata, metadata, metadata, negmeta, newNegId, metadata_1, error_2, errMsg, _a, _b, error_3;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Add Entity " + content);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 21, , 22]);
                        if (!BlisApp_1.BlisApp.HaveApp(context, cb)) {
                            return [2 /*return*/];
                        }
                        if (!content) {
                            cb(Menu_1.Menu.AddEditApp(context, ["You must provide an entity name for the entity to create."]));
                            return [2 /*return*/];
                        }
                        // Assume want LUIS entity if no entity given
                        if (!entityType && !entityId) {
                            entityType = Consts_1.EntityTypes.LUIS;
                        }
                        isBucket = content.indexOf(Consts_1.ActionCommand.BUCKET) > -1;
                        isNegatable = content.indexOf(Consts_1.ActionCommand.NEGATIVE) > -1;
                        regex = new RegExp("#|~", 'g');
                        content = content.replace(regex, '');
                        prebuiltName = null;
                        if (entityType) {
                            entityType = entityType.toUpperCase();
                            if (entityType != Consts_1.EntityTypes.LOCAL && entityType != Consts_1.EntityTypes.LUIS) {
                                prebuiltName = entityType;
                                entityType = Consts_1.EntityTypes.LUIS;
                            }
                        }
                        responses = [];
                        memory = context.Memory();
                        changeType = "";
                        negName = Entity.NegativeName(content);
                        if (!entityId) return [3 /*break*/, 15];
                        return [4 /*yield*/, context.client.GetEntity(context.state[Consts_1.UserStates.APP], entityId)];
                    case 2:
                        oldEntity = _c.sent();
                        oldNegName = Entity.NegativeName(oldEntity.name);
                        // Note: Entity Type cannot be changed.  Use old type.
                        entityType = oldEntity.entityType;
                        if (!oldEntity.metadata.negative) return [3 /*break*/, 9];
                        oldNegId = memory.EntityName2Id(oldNegName);
                        if (!isNegatable) return [3 /*break*/, 5];
                        metadata = new EntityMetaData({ bucket: isBucket, negative: oldNegId });
                        return [4 /*yield*/, context.client.EditEntity(context.state[Consts_1.UserStates.APP], entityId, content, null, prebuiltName, metadata)];
                    case 3:
                        _c.sent();
                        memory.AddEntityLookup(content, entityId);
                        responses.push(Entity.MakeHero("Entity Edited", content, entityId, entityType, prebuiltName, metadata));
                        negmeta = new EntityMetaData({ bucket: isBucket, positive: entityId });
                        return [4 /*yield*/, context.client.EditEntity(context.state[Consts_1.UserStates.APP], oldNegId, negName, null, prebuiltName, negmeta)];
                    case 4:
                        _c.sent();
                        memory.AddEntityLookup(negName, oldNegId);
                        responses.push(Entity.MakeHero("Entity Edited", negName, oldNegId, entityType, prebuiltName, negmeta));
                        return [3 /*break*/, 8];
                    case 5:
                        metadata = new EntityMetaData({ bucket: isBucket, negative: null });
                        return [4 /*yield*/, context.client.EditEntity(context.state[Consts_1.UserStates.APP], entityId, content, null, prebuiltName, metadata)];
                    case 6:
                        _c.sent();
                        memory.AddEntityLookup(content, entityId);
                        responses.push(Entity.MakeHero("Entity Edited", content, entityId, entityType, prebuiltName, metadata));
                        // Delete Negative
                        return [4 /*yield*/, context.client.DeleteEntity(context.state[Consts_1.UserStates.APP], oldNegId)];
                    case 7:
                        // Delete Negative
                        _c.sent();
                        memory.RemoveEntityLookup(oldNegName);
                        responses.push(Entity.MakeHero("Entity Deleted", oldNegName, oldNegId, entityType, prebuiltName, oldEntity.metadata, false));
                        _c.label = 8;
                    case 8: return [3 /*break*/, 14];
                    case 9:
                        if (!isNegatable) return [3 /*break*/, 12];
                        negmeta = new EntityMetaData({ bucket: isBucket, positive: oldEntity.id });
                        return [4 /*yield*/, context.client.AddEntity(context.state[Consts_1.UserStates.APP], negName, entityType, prebuiltName, negmeta)];
                    case 10:
                        newNegId = _c.sent();
                        memory.AddEntityLookup(negName, newNegId);
                        responses.push(Entity.MakeHero("Entity Added", negName, newNegId, entityType, prebuiltName, negmeta));
                        metadata = new EntityMetaData({ bucket: isBucket, negative: newNegId });
                        return [4 /*yield*/, context.client.EditEntity(context.state[Consts_1.UserStates.APP], entityId, content, null, prebuiltName, metadata)];
                    case 11:
                        _c.sent();
                        memory.AddEntityLookup(content, entityId);
                        responses.push(Entity.MakeHero("Entity Edited", content, entityId, entityType, prebuiltName, metadata));
                        return [3 /*break*/, 14];
                    case 12:
                        metadata = new EntityMetaData({ bucket: isBucket });
                        return [4 /*yield*/, context.client.EditEntity(context.state[Consts_1.UserStates.APP], entityId, content, null, prebuiltName, metadata)];
                    case 13:
                        _c.sent();
                        memory.AddEntityLookup(content, entityId);
                        responses.push(Entity.MakeHero("Entity Edited", content, entityId, entityType, prebuiltName, metadata));
                        _c.label = 14;
                    case 14: return [3 /*break*/, 20];
                    case 15:
                        metadata = new EntityMetaData({ bucket: isBucket });
                        return [4 /*yield*/, context.client.AddEntity(context.state[Consts_1.UserStates.APP], content, entityType, prebuiltName, metadata)];
                    case 16:
                        entityId = _c.sent();
                        memory.AddEntityLookup(content, entityId);
                        if (!!isNegatable) return [3 /*break*/, 17];
                        responses.push(Entity.MakeHero("Entity Added", content, entityId, entityType, prebuiltName, metadata));
                        return [3 /*break*/, 20];
                    case 17:
                        negmeta = new EntityMetaData({ bucket: isBucket, positive: entityId });
                        return [4 /*yield*/, context.client.AddEntity(context.state[Consts_1.UserStates.APP], negName, entityType, prebuiltName, negmeta)];
                    case 18:
                        newNegId = _c.sent();
                        memory.AddEntityLookup(negName, newNegId);
                        responses.push(Entity.MakeHero("Entity Added", negName, newNegId, entityType, prebuiltName, negmeta));
                        metadata_1 = new EntityMetaData({ bucket: isBucket, negative: newNegId });
                        return [4 /*yield*/, context.client.EditEntity(context.state[Consts_1.UserStates.APP], entityId, content, null, prebuiltName, metadata_1)];
                    case 19:
                        _c.sent();
                        responses.push(Entity.MakeHero("Entity Edited", content, entityId, entityType, prebuiltName, metadata_1));
                        _c.label = 20;
                    case 20:
                        // Add newline and edit hards
                        responses = responses.concat(Menu_1.Menu.EditApp(true));
                        cb(responses);
                        return [3 /*break*/, 22];
                    case 21:
                        error_2 = _c.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_2);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb([errMsg]);
                        return [2 /*return*/];
                    case 22:
                        _c.trys.push([22, 24, , 25]);
                        // Retrain the model with the new entity
                        _a = context.state;
                        _b = Consts_1.UserStates.MODEL;
                        return [4 /*yield*/, context.client.TrainModel(context.state)];
                    case 23:
                        // Retrain the model with the new entity
                        _a[_b] = _c.sent();
                        return [3 /*break*/, 25];
                    case 24:
                        error_3 = _c.sent();
                        // Error here is fine.  Will trigger if entity is added with no actions
                        return [2 /*return*/];
                    case 25: return [2 /*return*/];
                }
            });
        });
    };
    /** Delete Entity with the given entityId **/
    Entity.Delete = function (context, entityId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg, responses, memory, entity, inUse, card, negEntity, error_4, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Entity");
                        if (!entityId) {
                            msg = "You must provide the ID of the entity to delete.\n\n     " + CommandHandler_1.LineCommands.DELETEENTITY + " {app ID}";
                            cb(msg);
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        responses = [];
                        memory = context.Memory();
                        return [4 /*yield*/, context.client.GetEntity(context.state[Consts_1.UserStates.APP], entityId)];
                    case 2:
                        entity = _a.sent();
                        // Make sure we're not trying to delete a negative entity
                        if (entity.metadata && entity.metadata.positive) {
                            throw new Error("Can't delete a reversable Entity directly");
                        }
                        return [4 /*yield*/, entity.InUse(context)];
                    case 3:
                        inUse = _a.sent();
                        if (inUse) {
                            card = Utils_1.Utils.MakeHero("Delete Failed", entity.name, "Entity is being used by App", null);
                            cb(Menu_1.Menu.AddEditApp(context, [card]));
                            return [2 /*return*/];
                        }
                        // TODO clear api save lookup
                        return [4 /*yield*/, context.client.DeleteEntity(context.state[Consts_1.UserStates.APP], entityId)];
                    case 4:
                        // TODO clear api save lookup
                        _a.sent();
                        memory.RemoveEntityLookup(entity.name);
                        responses.push(Entity.MakeHero("Entity Deleted", entity.name, entity.id, entity.entityType, entity.luisPreName, entity.metadata, false));
                        if (!(entity.metadata && entity.metadata.negative)) return [3 /*break*/, 7];
                        return [4 /*yield*/, entity.GetNegativeEntity(context)];
                    case 5:
                        negEntity = _a.sent();
                        return [4 /*yield*/, context.client.DeleteEntity(context.state[Consts_1.UserStates.APP], entity.metadata.negative)];
                    case 6:
                        _a.sent();
                        memory.RemoveEntityLookup(negEntity.name);
                        responses.push(Entity.MakeHero("Entity Deleted", negEntity.name, negEntity.id, negEntity.entityType, negEntity.luisPreName, negEntity.metadata, false));
                        _a.label = 7;
                    case 7:
                        responses = responses.concat(Menu_1.Menu.EditApp(true));
                        cb(responses);
                        return [3 /*break*/, 9];
                    case 8:
                        error_4 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_4);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb([errMsg]);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /** Get all actions **/
    Entity.Get = function (context, search, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var debug, entityIds, json, memory, msg, responses, entities, _i, entityIds_1, entityId, entity, _a, entities_1, entity, desc, error_5, errMsg;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting entities");
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, , 8]);
                        if (!BlisApp_1.BlisApp.HaveApp(context, cb)) {
                            return [2 /*return*/];
                        }
                        debug = false;
                        if (search && search.indexOf(Consts_1.ActionCommand.DEBUG) > -1) {
                            debug = true;
                            search = search.replace(Consts_1.ActionCommand.DEBUG, "");
                        }
                        entityIds = [];
                        return [4 /*yield*/, context.client.GetEntities(context.state[Consts_1.UserStates.APP])];
                    case 2:
                        json = _b.sent();
                        entityIds = JSON.parse(json)['ids'];
                        BlisDebug_1.BlisDebug.Log("Found " + entityIds.length + " entities");
                        memory = context.Memory();
                        if (entityIds.length == 0) {
                            cb(Menu_1.Menu.AddEditApp(context, ["This app contains no Entities."]));
                            return [2 /*return*/];
                        }
                        msg = "**Entities**\n\n";
                        responses = [];
                        entities = [];
                        if (search)
                            search = search.toLowerCase();
                        _i = 0, entityIds_1 = entityIds;
                        _b.label = 3;
                    case 3:
                        if (!(_i < entityIds_1.length)) return [3 /*break*/, 6];
                        entityId = entityIds_1[_i];
                        return [4 /*yield*/, context.client.GetEntity(context.state[Consts_1.UserStates.APP], entityId)];
                    case 4:
                        entity = _b.sent();
                        if (!search || entity.name.toLowerCase().indexOf(search) > -1) {
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
                                responses.push(Utils_1.Utils.MakeHero(entity.name, desc, null, Entity.Buttons(entity.name, entity.id)));
                            }
                        }
                        if (debug) {
                            responses.push(msg);
                        }
                        if (responses.length == 0) {
                            cb(Menu_1.Menu.AddEditApp(context, ["No Entities match your query."]));
                            return [2 /*return*/];
                        }
                        cb(responses);
                        return [3 /*break*/, 8];
                    case 7:
                        error_5 = _b.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_5);
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