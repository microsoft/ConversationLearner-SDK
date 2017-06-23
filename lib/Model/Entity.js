"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var BlisDebug_1 = require("../BlisDebug");
var BlisClient_1 = require("../BlisClient");
var Consts_1 = require("../Model/Consts");
var BlisApp_1 = require("../Model/BlisApp");
var BlisMemory_1 = require("../BlisMemory");
var Utils_1 = require("../Utils");
var Command_1 = require("./Command");
var Menu_1 = require("../Menu");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var AdminResponse_1 = require("./AdminResponse");
var EntityMetaData = (function () {
    function EntityMetaData(init) {
        this.isBucket = false;
        this.isReversable = false;
        this.negativeId = undefined;
        this.positiveId = undefined;
        Object.assign(this, init);
    }
    /** Make negate of given metadata */
    EntityMetaData.prototype.MakeNegative = function (posId) {
        return new EntityMetaData({ isBucket: this.isBucket, negativeId: null, positiveId: posId });
    };
    return EntityMetaData;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('isBucket'),
    tslib_1.__metadata("design:type", Boolean)
], EntityMetaData.prototype, "isBucket", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('isReversable'),
    tslib_1.__metadata("design:type", Boolean)
], EntityMetaData.prototype, "isReversable", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('negativeId'),
    tslib_1.__metadata("design:type", String)
], EntityMetaData.prototype, "negativeId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('positiveId'),
    tslib_1.__metadata("design:type", String)
], EntityMetaData.prototype, "positiveId", void 0);
exports.EntityMetaData = EntityMetaData;
var EntityMetaData_v1 = (function () {
    function EntityMetaData_v1(init) {
        this.bucket = false;
        this.reversable = false;
        this.negative = undefined;
        this.positive = undefined;
        this.task = undefined;
        this.version = undefined;
        this.packageCreationId = undefined;
        this.packageDeletionId = undefined;
        Object.assign(this, init);
    }
    /** Make negate of given metadata */
    EntityMetaData_v1.prototype.MakeNegative = function (posId) {
        return new EntityMetaData_v1({ bucket: this.bucket, negative: null, positive: posId, task: this.task });
    };
    return EntityMetaData_v1;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('bucket'),
    tslib_1.__metadata("design:type", Boolean)
], EntityMetaData_v1.prototype, "bucket", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('reversable'),
    tslib_1.__metadata("design:type", Boolean)
], EntityMetaData_v1.prototype, "reversable", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('negative'),
    tslib_1.__metadata("design:type", String)
], EntityMetaData_v1.prototype, "negative", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('positive'),
    tslib_1.__metadata("design:type", String)
], EntityMetaData_v1.prototype, "positive", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('task'),
    tslib_1.__metadata("design:type", String)
], EntityMetaData_v1.prototype, "task", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('version'),
    tslib_1.__metadata("design:type", Number)
], EntityMetaData_v1.prototype, "version", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('packageCreationId'),
    tslib_1.__metadata("design:type", Number)
], EntityMetaData_v1.prototype, "packageCreationId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('packageDeletionId'),
    tslib_1.__metadata("design:type", Number)
], EntityMetaData_v1.prototype, "packageDeletionId", void 0);
exports.EntityMetaData_v1 = EntityMetaData_v1;
var Entity = (function () {
    function Entity(init) {
        this.entityId = undefined;
        this.entityName = undefined;
        this.entityType = undefined;
        this.version = undefined;
        this.packageCreationId = undefined;
        this.packageDeletionId = undefined;
        this.metadata = undefined;
        Object.assign(this, init);
    }
    Entity.Add = function (appId, key, entity) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, _a, changeType, negName, oldEntity, oldNegName, oldNegId, oldEntity_1, negEntity, newNegId, entityId, negEntity, newNegId, error_1, errMsg;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Add Entity " + entity.Description);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 32, , 33]);
                        if (!entity.entityName) {
                            return [2 /*return*/, AdminResponse_1.AdminResponse.Error("You must provide an entity name for the entity to create.")];
                        }
                        memory = BlisMemory_1.BlisMemory.GetMemory(key);
                        _a = appId;
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 2:
                        if (_a != (_b.sent())) {
                            BlisDebug_1.BlisDebug.Log("Adding Action to diff app than in memory", "warning");
                        }
                        changeType = "";
                        negName = Entity.NegativeName(entity.entityName);
                        if (!entity.entityId) return [3 /*break*/, 25];
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetEntity(appId, entity.entityId)];
                    case 3:
                        oldEntity = _b.sent();
                        oldNegName = Entity.NegativeName(oldEntity.entityName);
                        // Note: Entity Type cannot be changed.  Use old type.
                        entity.entityType = oldEntity.entityType;
                        if (!oldEntity.metadata.negativeId) return [3 /*break*/, 16];
                        return [4 /*yield*/, memory.EntityLookup().ToId(oldNegName)];
                    case 4:
                        oldNegId = _b.sent();
                        if (!entity.metadata.isReversable) return [3 /*break*/, 10];
                        // Update Positive
                        entity.metadata = new EntityMetaData({ isBucket: entity.metadata.isBucket, negativeId: oldNegId });
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.EditEntity(appId, entity)];
                    case 5:
                        _b.sent();
                        return [4 /*yield*/, memory.EntityLookup().Add(entity.entityName, entity.entityId)];
                    case 6:
                        _b.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetEntity(appId, oldNegId)];
                    case 7:
                        oldEntity_1 = _b.sent();
                        oldEntity_1.metadata = new EntityMetaData({ isBucket: entity.metadata.isBucket, positiveId: entity.entityId });
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.EditEntity(appId, oldEntity_1)];
                    case 8:
                        _b.sent();
                        return [4 /*yield*/, memory.EntityLookup().Add(negName, oldNegId)];
                    case 9:
                        _b.sent();
                        return [3 /*break*/, 15];
                    case 10:
                        // Update Positive
                        entity.metadata = new EntityMetaData({ isBucket: entity.metadata.isBucket, negativeId: null });
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.EditEntity(appId, entity)];
                    case 11:
                        _b.sent();
                        return [4 /*yield*/, memory.EntityLookup().Add(entity.entityName, entity.entityId)];
                    case 12:
                        _b.sent();
                        // Delete Negative
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.DeleteEntity(appId, oldNegId)];
                    case 13:
                        // Delete Negative
                        _b.sent();
                        return [4 /*yield*/, memory.EntityLookup().Remove(oldNegName)];
                    case 14:
                        _b.sent();
                        _b.label = 15;
                    case 15: return [3 /*break*/, 24];
                    case 16:
                        if (!entity.metadata.isReversable) return [3 /*break*/, 21];
                        negEntity = new Entity({
                            entityType: entity.entityType,
                            entityName: negName,
                            metadata: new EntityMetaData({ isBucket: entity.metadata.isBucket, positiveId: oldEntity.entityId })
                        });
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.AddEntity(appId, negEntity)];
                    case 17:
                        newNegId = _b.sent();
                        return [4 /*yield*/, memory.EntityLookup().Add(negName, newNegId)];
                    case 18:
                        _b.sent();
                        // Update Positive
                        entity.metadata = new EntityMetaData({ isBucket: entity.metadata.isBucket, negativeId: newNegId });
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.EditEntity(appId, entity)];
                    case 19:
                        _b.sent();
                        return [4 /*yield*/, memory.EntityLookup().Add(entity.entityName, entity.entityId)];
                    case 20:
                        _b.sent();
                        return [3 /*break*/, 24];
                    case 21:
                        // Update Positive
                        entity.metadata = new EntityMetaData({ isBucket: entity.metadata.isBucket });
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.EditEntity(appId, entity)];
                    case 22:
                        _b.sent();
                        return [4 /*yield*/, memory.EntityLookup().Add(entity.entityName, entity.entityId)];
                    case 23:
                        _b.sent();
                        _b.label = 24;
                    case 24: return [3 /*break*/, 31];
                    case 25: return [4 /*yield*/, BlisClient_1.BlisClient.client.AddEntity(appId, entity)];
                    case 26:
                        entityId = _b.sent();
                        return [4 /*yield*/, memory.EntityLookup().Add(entity.entityName, entityId)];
                    case 27:
                        _b.sent();
                        if (!entity.metadata.isReversable) return [3 /*break*/, 31];
                        negEntity = new Entity({
                            entityType: entity.entityType,
                            entityName: negName,
                            metadata: entity.metadata
                        });
                        negEntity.metadata.positiveId = entity.entityId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.AddEntity(appId, negEntity)];
                    case 28:
                        newNegId = _b.sent();
                        return [4 /*yield*/, memory.EntityLookup().Add(negName, newNegId)];
                    case 29:
                        _b.sent();
                        // Update Positive Reference
                        entity.metadata.negativeId = newNegId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.EditEntity(appId, entity)];
                    case 30:
                        _b.sent();
                        _b.label = 31;
                    case 31: return [3 /*break*/, 33];
                    case 32:
                        error_1 = _b.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_1);
                        return [2 /*return*/, AdminResponse_1.AdminResponse.Error(errMsg)];
                    case 33: return [2 /*return*/];
                }
            });
        });
    };
    /** Delete Entity with the given entityId **/
    Entity.Delete = function (appId, key, entityId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, appId_1, entity, inUse, negEntity, error_2, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Entity");
                        if (!entityId) {
                            return [2 /*return*/, AdminResponse_1.AdminResponse.Error("You must provide the ID of the entity to delete.")];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 11, , 12]);
                        memory = BlisMemory_1.BlisMemory.GetMemory(key);
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 2:
                        appId_1 = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetEntity(appId_1, entityId)];
                    case 3:
                        entity = _a.sent();
                        // Make sure we're not trying to delete a negative entity
                        if (entity.metadata && entity.metadata.positiveId) {
                            throw new Error("Can't delete a reversable Entity directly");
                        }
                        return [4 /*yield*/, entity.InUse(appId_1)];
                    case 4:
                        inUse = _a.sent();
                        if (inUse) {
                            return [2 /*return*/, AdminResponse_1.AdminResponse.Error("Delete Failed " + entity.entityName + ".  Entity is being used by App")];
                        }
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.DeleteEntity(appId_1, entityId)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, memory.EntityLookup().Remove(entity.entityName)];
                    case 6:
                        _a.sent();
                        if (!(entity.metadata && entity.metadata.negativeId)) return [3 /*break*/, 10];
                        return [4 /*yield*/, entity.GetNegativeEntity(appId_1)];
                    case 7:
                        negEntity = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.DeleteEntity(appId_1, entity.metadata.negativeId)];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, memory.EntityLookup().Remove(negEntity.entityName)];
                    case 9:
                        _a.sent();
                        _a.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        error_2 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_2);
                        return [2 /*return*/, AdminResponse_1.AdminResponse.Error(errMsg)];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /** Get all actions **/
    Entity.Get = function (key, search) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, appId, debug, entityIds, json, entities, _i, entityIds_1, entityId, entity, error_3, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting entities");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 10]);
                        memory = BlisMemory_1.BlisMemory.GetMemory(key);
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 2:
                        appId = _a.sent();
                        if (!appId) {
                            return [2 /*return*/, AdminResponse_1.AdminResponse.Error("No app has been loaded.")];
                        }
                        debug = false;
                        if (search && search.indexOf(Consts_1.ActionCommand.DEBUG) > -1) {
                            debug = true;
                            search = search.replace(Consts_1.ActionCommand.DEBUG, "");
                        }
                        entityIds = [];
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.GetEntities(appId)];
                    case 3:
                        json = _a.sent();
                        entityIds = JSON.parse(json)['ids'];
                        BlisDebug_1.BlisDebug.Log("Found " + entityIds.length + " entities");
                        ;
                        if (entityIds.length == 0) {
                            return [2 /*return*/, AdminResponse_1.AdminResponse.Result([])];
                        }
                        entities = [];
                        if (search)
                            search = search.toLowerCase();
                        _i = 0, entityIds_1 = entityIds;
                        _a.label = 4;
                    case 4:
                        if (!(_i < entityIds_1.length)) return [3 /*break*/, 8];
                        entityId = entityIds_1[_i];
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetEntity(appId, entityId)];
                    case 5:
                        entity = _a.sent();
                        if (!search || entity.entityName.toLowerCase().indexOf(search) > -1) {
                            entities.push(entity);
                        }
                        // Add to entity lookup table
                        return [4 /*yield*/, memory.EntityLookup().Add(entity.entityName, entityId)];
                    case 6:
                        // Add to entity lookup table
                        _a.sent();
                        _a.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 4];
                    case 8:
                        // Sort
                        entities = Entity.Sort(entities);
                        // Return result
                        return [2 /*return*/, AdminResponse_1.AdminResponse.Result(entities)];
                    case 9:
                        error_3 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_3);
                        return [2 /*return*/, AdminResponse_1.AdminResponse.Error(errMsg)];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /** Return negative entity name */
    Entity.NegativeName = function (name) {
        return Consts_1.ActionCommand.NEGATIVE + name;
    };
    /** Return negative entity if it exists */
    Entity.prototype.GetNegativeEntity = function (appId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.metadata && this.metadata.negativeId)) return [3 /*break*/, 2];
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetEntity(appId, this.metadata.negativeId)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [2 /*return*/, null];
                }
            });
        });
    };
    /** Is the Entity used anywhere */
    Entity.prototype.InUse = function (appId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var appContent, appString, negId;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.ExportApp(appId)];
                    case 1:
                        appContent = _a.sent();
                        // Clear entities
                        appContent.entities = null;
                        appString = JSON.stringify(appContent);
                        negId = this.metadata.negativeId;
                        if (negId && appString.indexOf(negId) > -1) {
                            return [2 /*return*/, true];
                        }
                        ;
                        return [2 /*return*/, (appString.indexOf(this.entityId) > -1)];
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
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('entityId'),
    tslib_1.__metadata("design:type", String)
], Entity.prototype, "entityId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('entityName'),
    tslib_1.__metadata("design:type", String)
], Entity.prototype, "entityName", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('entityType'),
    tslib_1.__metadata("design:type", String)
], Entity.prototype, "entityType", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('version'),
    tslib_1.__metadata("design:type", Number)
], Entity.prototype, "version", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('packageCreationId'),
    tslib_1.__metadata("design:type", Number)
], Entity.prototype, "packageCreationId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('packageDeletionId'),
    tslib_1.__metadata("design:type", Number)
], Entity.prototype, "packageDeletionId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: EntityMetaData, name: 'metadata' }),
    tslib_1.__metadata("design:type", EntityMetaData)
], Entity.prototype, "metadata", void 0);
exports.Entity = Entity;
var EntityList = (function () {
    function EntityList(init) {
        this.entities = undefined;
        Object.assign(this, init);
    }
    return EntityList;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('entities'),
    tslib_1.__metadata("design:type", Array)
], EntityList.prototype, "entities", void 0);
exports.EntityList = EntityList;
var EntityIdList = (function () {
    function EntityIdList(init) {
        this.entityIds = undefined;
        Object.assign(this, init);
    }
    return EntityIdList;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('entityIds'),
    tslib_1.__metadata("design:type", Array)
], EntityIdList.prototype, "entityIds", void 0);
exports.EntityIdList = EntityIdList;
var Entity_v1 = (function () {
    function Entity_v1(init) {
        this.id = undefined;
        this.entityType = undefined;
        this.luisPreName = undefined;
        this.name = undefined;
        this.metadata = new EntityMetaData_v1();
        Object.assign(this, init);
    }
    Entity_v1.prototype.Equal = function (entity) {
        if (this.entityType != entity.entityType)
            return false;
        if (this.luisPreName != entity.luisPreName)
            return false;
        if (this.name != entity.name)
            return false;
        return true;
    };
    Entity_v1.toText = function (appId, entityId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entity, error_4;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.GetEntity_v1(appId, entityId)];
                    case 1:
                        entity = _a.sent();
                        return [2 /*return*/, entity.name];
                    case 2:
                        error_4 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_4);
                        throw (error_4);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Entity_v1.prototype.TOV2 = function () {
        var metadataV2 = new EntityMetaData();
        metadataV2.isBucket = this.metadata.bucket;
        metadataV2.isReversable = this.metadata.reversable;
        metadataV2.negativeId = this.metadata.negative;
        metadataV2.positiveId = this.metadata.positive;
        return new Entity({
            entityId: this.id,
            entityName: this.name,
            entityType: this.entityType,
            version: this.metadata.version,
            packageCreationId: this.metadata.packageCreationId,
            packageDeletionId: this.metadata.packageDeletionId,
            metadata: metadataV2
        });
    };
    Entity_v1.TOV1 = function (entity) {
        var metadataV1 = new EntityMetaData_v1();
        metadataV1.bucket = entity.metadata.isBucket;
        metadataV1.reversable = entity.metadata.isReversable;
        metadataV1.negative = entity.metadata.negativeId;
        metadataV1.positive = entity.metadata.positiveId;
        metadataV1.version = entity.version;
        metadataV1.packageCreationId = entity.packageCreationId;
        metadataV1.packageDeletionId = entity.packageDeletionId;
        return new Entity_v1({
            id: entity.entityId,
            name: entity.entityName,
            entityType: entity.entityType,
            metadata: metadataV1
        });
    };
    /** Return negative entity name */
    Entity_v1.NegativeName_v1 = function (name) {
        return Consts_1.ActionCommand.NEGATIVE + name;
    };
    /** Return negative entity if it exists */
    Entity_v1.prototype.GetNegativeEntity_v1 = function (appId, context) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.metadata && this.metadata.negative)) return [3 /*break*/, 2];
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.GetEntity_v1(appId, this.metadata.negative)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [2 /*return*/, null];
                }
            });
        });
    };
    /** Is the Entity used anywhere */
    Entity_v1.prototype.InUse_v1 = function (appId, context) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var appContent, appString, negId;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.ExportApp(appId)];
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
    Entity_v1.Buttons = function (name, id) {
        // Negative entities can't be edited or deleted directly
        if (name.startsWith(Consts_1.ActionCommand.NEGATIVE)) {
            return null;
        }
        var buttons = {
            "Edit": Command_1.CueCommands.EDITENTITY + " " + id,
            "Delete": Command_1.LineCommands.DELETEENTITY + " " + id,
        };
        return buttons;
    };
    Entity_v1.MakeHero = function (title, name, id, type, prebuilt, metadata, buttons) {
        if (buttons === void 0) { buttons = true; }
        var desc = this.Description_v1(type, prebuilt, metadata);
        return Utils_1.Utils.MakeHero(title, desc, name, buttons ? Entity_v1.Buttons(name, id) : null);
    };
    Entity_v1.prototype.Description_v1 = function () {
        return Entity_v1.Description_v1(this.entityType, this.luisPreName, this.metadata);
    };
    Entity_v1.Description_v1 = function (type, prebuilt, metadata) {
        var description = "" + (prebuilt ? prebuilt : type) + (metadata.bucket ? " (bucket)" : "");
        description += "" + (metadata.negative ? " (negatable)" : "");
        description += "" + (metadata.positive ? " (delete)" : "");
        description += "" + (metadata.task ? " (Task: " + metadata.task : "");
        return description;
    };
    Entity_v1.Sort_v1 = function (entities) {
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
    Entity_v1.Add_v1 = function (context, entityId, entityType, userInput, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, appId, isBucket, isNegatable, _a, content, task, regex, taskId, prebuiltName, responses, changeType, negName, oldEntity, oldNegName, oldNegId, metadata, negmeta, metadata, negmeta, newNegId, metadata, metadata, metadata, negmeta, newNegId, metadata_1, error_5, errMsg, modelId, error_6;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Add Entity " + userInput);
                        memory = context.Memory();
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 1:
                        appId = _b.sent();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 34, , 35]);
                        if (!BlisApp_1.BlisApp_v1.HaveApp_v1(appId, context, cb)) {
                            return [2 /*return*/];
                        }
                        if (!userInput) {
                            cb(Menu_1.Menu.AddEditCards(context, ["You must provide an entity name for the entity to create."]));
                            return [2 /*return*/];
                        }
                        // Assume want LUIS entity if no entity given
                        if (!entityType && !entityId) {
                            entityType = Consts_1.EntityTypes.LUIS;
                        }
                        isBucket = userInput.indexOf(Consts_1.ActionCommand.BUCKET) > -1;
                        isNegatable = userInput.indexOf(Consts_1.ActionCommand.NEGATIVE) > -1;
                        _a = userInput.split('//'), content = _a[0], task = _a[1];
                        regex = new RegExp("#|~", 'g');
                        content = content.replace(regex, '');
                        taskId = null;
                        if (!task) return [3 /*break*/, 4];
                        return [4 /*yield*/, memory.EntityLookup().ToId(task)];
                    case 3:
                        taskId = _b.sent();
                        if (!taskId) {
                            cb(Menu_1.Menu.AddEditCards(context, ["Task " + task + " not found."]));
                            return [2 /*return*/];
                        }
                        _b.label = 4;
                    case 4:
                        prebuiltName = null;
                        if (entityType) {
                            entityType = entityType.toUpperCase();
                            if (entityType != Consts_1.EntityTypes.LOCAL && entityType != Consts_1.EntityTypes.LUIS) {
                                prebuiltName = entityType;
                                entityType = Consts_1.EntityTypes.LUIS;
                            }
                        }
                        responses = [];
                        changeType = "";
                        negName = Entity_v1.NegativeName_v1(content);
                        if (!entityId) return [3 /*break*/, 26];
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.GetEntity_v1(appId, entityId)];
                    case 5:
                        oldEntity = _b.sent();
                        oldNegName = Entity_v1.NegativeName_v1(oldEntity.name);
                        // Note: Entity Type cannot be changed.  Use old type.
                        entityType = oldEntity.entityType;
                        if (!oldEntity.metadata.negative) return [3 /*break*/, 17];
                        return [4 /*yield*/, memory.EntityLookup().ToId(oldNegName)];
                    case 6:
                        oldNegId = _b.sent();
                        if (!isNegatable) return [3 /*break*/, 11];
                        metadata = new EntityMetaData_v1({ bucket: isBucket, task: taskId, negative: oldNegId });
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.EditEntity_v1(appId, entityId, content, null, prebuiltName, metadata)];
                    case 7:
                        _b.sent();
                        return [4 /*yield*/, memory.EntityLookup().Add(content, entityId)];
                    case 8:
                        _b.sent();
                        responses.push(Entity_v1.MakeHero("Entity Edited", content, entityId, entityType, prebuiltName, metadata));
                        negmeta = new EntityMetaData_v1({ bucket: isBucket, task: taskId, positive: entityId });
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.EditEntity_v1(appId, oldNegId, negName, null, prebuiltName, negmeta)];
                    case 9:
                        _b.sent();
                        return [4 /*yield*/, memory.EntityLookup().Add(negName, oldNegId)];
                    case 10:
                        _b.sent();
                        responses.push(Entity_v1.MakeHero("Entity Edited", negName, oldNegId, entityType, prebuiltName, negmeta));
                        return [3 /*break*/, 16];
                    case 11:
                        metadata = new EntityMetaData_v1({ bucket: isBucket, task: taskId, negative: null });
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.EditEntity_v1(appId, entityId, content, null, prebuiltName, metadata)];
                    case 12:
                        _b.sent();
                        return [4 /*yield*/, memory.EntityLookup().Add(content, entityId)];
                    case 13:
                        _b.sent();
                        responses.push(Entity_v1.MakeHero("Entity Edited", content, entityId, entityType, prebuiltName, metadata));
                        // Delete Negative
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.DeleteEntity(appId, oldNegId)];
                    case 14:
                        // Delete Negative
                        _b.sent();
                        return [4 /*yield*/, memory.EntityLookup().Remove(oldNegName)];
                    case 15:
                        _b.sent();
                        responses.push(Entity_v1.MakeHero("Entity Deleted", oldNegName, oldNegId, entityType, prebuiltName, oldEntity.metadata, false));
                        _b.label = 16;
                    case 16: return [3 /*break*/, 25];
                    case 17:
                        if (!isNegatable) return [3 /*break*/, 22];
                        negmeta = new EntityMetaData_v1({ bucket: isBucket, task: taskId, positive: oldEntity.id });
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.AddEntity_v1(appId, negName, entityType, prebuiltName, negmeta)];
                    case 18:
                        newNegId = _b.sent();
                        return [4 /*yield*/, memory.EntityLookup().Add(negName, newNegId)];
                    case 19:
                        _b.sent();
                        responses.push(Entity_v1.MakeHero("Entity Added", negName, newNegId, entityType, prebuiltName, negmeta));
                        metadata = new EntityMetaData_v1({ bucket: isBucket, task: taskId, negative: newNegId });
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.EditEntity_v1(appId, entityId, content, null, prebuiltName, metadata)];
                    case 20:
                        _b.sent();
                        return [4 /*yield*/, memory.EntityLookup().Add(content, entityId)];
                    case 21:
                        _b.sent();
                        responses.push(Entity_v1.MakeHero("Entity Edited", content, entityId, entityType, prebuiltName, metadata));
                        return [3 /*break*/, 25];
                    case 22:
                        metadata = new EntityMetaData_v1({ bucket: isBucket, task: taskId });
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.EditEntity_v1(appId, entityId, content, null, prebuiltName, metadata)];
                    case 23:
                        _b.sent();
                        return [4 /*yield*/, memory.EntityLookup().Add(content, entityId)];
                    case 24:
                        _b.sent();
                        responses.push(Entity_v1.MakeHero("Entity Edited", content, entityId, entityType, prebuiltName, metadata));
                        _b.label = 25;
                    case 25: return [3 /*break*/, 33];
                    case 26:
                        metadata = new EntityMetaData_v1({ bucket: isBucket, task: taskId });
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.AddEntity_v1(appId, content, entityType, prebuiltName, metadata)];
                    case 27:
                        entityId = _b.sent();
                        return [4 /*yield*/, memory.EntityLookup().Add(content, entityId)];
                    case 28:
                        _b.sent();
                        if (!!isNegatable) return [3 /*break*/, 29];
                        responses.push(Entity_v1.MakeHero("Entity Added", content, entityId, entityType, prebuiltName, metadata));
                        return [3 /*break*/, 33];
                    case 29:
                        negmeta = new EntityMetaData_v1({ bucket: isBucket, task: taskId, positive: entityId });
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.AddEntity_v1(appId, negName, entityType, prebuiltName, negmeta)];
                    case 30:
                        newNegId = _b.sent();
                        return [4 /*yield*/, memory.EntityLookup().Add(negName, newNegId)];
                    case 31:
                        _b.sent();
                        responses.push(Entity_v1.MakeHero("Entity Added", negName, newNegId, entityType, prebuiltName, negmeta));
                        metadata_1 = new EntityMetaData_v1({ bucket: isBucket, task: taskId, negative: newNegId });
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.EditEntity_v1(appId, entityId, content, null, prebuiltName, metadata_1)];
                    case 32:
                        _b.sent();
                        responses.push(Entity_v1.MakeHero("Entity Edited", content, entityId, entityType, prebuiltName, metadata_1));
                        _b.label = 33;
                    case 33:
                        // Add newline and edit hards
                        responses = responses.concat(Menu_1.Menu.EditCards(true));
                        cb(responses);
                        return [3 /*break*/, 35];
                    case 34:
                        error_5 = _b.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_5);
                        cb([errMsg]);
                        return [2 /*return*/];
                    case 35:
                        _b.trys.push([35, 38, , 39]);
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.TrainModel(appId)];
                    case 36:
                        modelId = _b.sent();
                        return [4 /*yield*/, memory.BotState().SetModelId(modelId)];
                    case 37:
                        _b.sent();
                        return [3 /*break*/, 39];
                    case 38:
                        error_6 = _b.sent();
                        // Error here is fine.  Will trigger if entity is added with no actions
                        return [2 /*return*/];
                    case 39: return [2 /*return*/];
                }
            });
        });
    };
    /** Delete Entity with the given entityId **/
    Entity_v1.Delete_v1 = function (context, entityId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg, responses, memory, appId, entity, inUse, card, negEntity, error_7, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Entity");
                        if (!entityId) {
                            msg = "You must provide the ID of the entity to delete.\n\n     " + Command_1.LineCommands.DELETEENTITY + " {app ID}";
                            cb(msg);
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 11, , 12]);
                        responses = [];
                        memory = context.Memory();
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 2:
                        appId = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.GetEntity_v1(appId, entityId)];
                    case 3:
                        entity = _a.sent();
                        // Make sure we're not trying to delete a negative entity
                        if (entity.metadata && entity.metadata.positive) {
                            throw new Error("Can't delete a reversable Entity directly");
                        }
                        return [4 /*yield*/, entity.InUse_v1(appId, context)];
                    case 4:
                        inUse = _a.sent();
                        if (inUse) {
                            card = Utils_1.Utils.MakeHero("Delete Failed", entity.name, "Entity is being used by App", null);
                            cb(Menu_1.Menu.AddEditCards(context, [card]));
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.DeleteEntity(appId, entityId)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, memory.EntityLookup().Remove(entity.name)];
                    case 6:
                        _a.sent();
                        responses.push(Entity_v1.MakeHero("Entity Deleted", entity.name, entity.id, entity.entityType, entity.luisPreName, entity.metadata, false));
                        if (!(entity.metadata && entity.metadata.negative)) return [3 /*break*/, 10];
                        return [4 /*yield*/, entity.GetNegativeEntity_v1(appId, context)];
                    case 7:
                        negEntity = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.DeleteEntity(appId, entity.metadata.negative)];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, memory.EntityLookup().Remove(negEntity.name)];
                    case 9:
                        _a.sent();
                        responses.push(Entity_v1.MakeHero("Entity Deleted", negEntity.name, negEntity.id, negEntity.entityType, negEntity.luisPreName, negEntity.metadata, false));
                        _a.label = 10;
                    case 10:
                        responses = responses.concat(Menu_1.Menu.EditCards(true));
                        cb(responses);
                        return [3 /*break*/, 12];
                    case 11:
                        error_7 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_7);
                        cb([errMsg]);
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /** Get all actions **/
    Entity_v1.Get_v1 = function (context, search, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, appId, debug, entityIds, json, msg, responses, entities, _i, entityIds_2, entityId, entity, _a, entities_1, entity, desc, error_8, errMsg;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting entities");
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 9, , 10]);
                        memory = context.Memory();
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 2:
                        appId = _b.sent();
                        if (!BlisApp_1.BlisApp_v1.HaveApp_v1(appId, context, cb)) {
                            return [2 /*return*/];
                        }
                        debug = false;
                        if (search && search.indexOf(Consts_1.ActionCommand.DEBUG) > -1) {
                            debug = true;
                            search = search.replace(Consts_1.ActionCommand.DEBUG, "");
                        }
                        entityIds = [];
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.GetEntities(appId)];
                    case 3:
                        json = _b.sent();
                        entityIds = JSON.parse(json)['ids'];
                        BlisDebug_1.BlisDebug.Log("Found " + entityIds.length + " entities");
                        ;
                        if (entityIds.length == 0) {
                            cb(Menu_1.Menu.AddEditCards(context, ["This app contains no Entities."]));
                            return [2 /*return*/];
                        }
                        msg = "**Entities**\n\n";
                        responses = [];
                        entities = [];
                        if (search)
                            search = search.toLowerCase();
                        _i = 0, entityIds_2 = entityIds;
                        _b.label = 4;
                    case 4:
                        if (!(_i < entityIds_2.length)) return [3 /*break*/, 8];
                        entityId = entityIds_2[_i];
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.GetEntity_v1(appId, entityId)];
                    case 5:
                        entity = _b.sent();
                        if (!search || entity.name.toLowerCase().indexOf(search) > -1) {
                            entities.push(entity);
                        }
                        // Add to entity lookup table
                        return [4 /*yield*/, memory.EntityLookup().Add(entity.name, entityId)];
                    case 6:
                        // Add to entity lookup table
                        _b.sent();
                        _b.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 4];
                    case 8:
                        // Sort
                        entities = Entity_v1.Sort_v1(entities);
                        // Generate output
                        for (_a = 0, entities_1 = entities; _a < entities_1.length; _a++) {
                            entity = entities_1[_a];
                            if (debug) {
                                msg += entity.name + "  " + entity.Description() + " " + entity.id + "\n\n";
                            }
                            else {
                                desc = entity.Description();
                                responses.push(Utils_1.Utils.MakeHero(entity.name, desc, null, Entity_v1.Buttons(entity.name, entity.id)));
                            }
                        }
                        if (debug) {
                            responses.push(msg);
                        }
                        if (responses.length == 0) {
                            cb(Menu_1.Menu.AddEditCards(context, ["No Entities match your query."]));
                            return [2 /*return*/];
                        }
                        responses.push(null, Menu_1.Menu.Home());
                        cb(responses);
                        return [3 /*break*/, 10];
                    case 9:
                        error_8 = _b.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_8);
                        cb([errMsg]);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    return Entity_v1;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('id'),
    tslib_1.__metadata("design:type", String)
], Entity_v1.prototype, "id", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('EntityType'),
    tslib_1.__metadata("design:type", String)
], Entity_v1.prototype, "entityType", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('LUISPreName'),
    tslib_1.__metadata("design:type", String)
], Entity_v1.prototype, "luisPreName", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('name'),
    tslib_1.__metadata("design:type", String)
], Entity_v1.prototype, "name", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: EntityMetaData_v1, name: 'metadata' }),
    tslib_1.__metadata("design:type", EntityMetaData_v1)
], Entity_v1.prototype, "metadata", void 0);
exports.Entity_v1 = Entity_v1;
//# sourceMappingURL=Entity.js.map