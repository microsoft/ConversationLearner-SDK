"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var BlisDebug_1 = require("./BlisDebug");
var Utils_1 = require("./Utils");
var Consts_1 = require("./Model/Consts");
var CueCommand_1 = require("./Model/CueCommand");
var Pager_1 = require("./Model/Pager");
var Consts_2 = require("./Model/Consts");
var TrainStep_1 = require("./Model/TrainStep");
var redis = require("redis");
var MemoryType = {
    APP: "APP",
    SESSION: "SESSION",
    MODEL: "MODEL",
    TEACH: "TEACH",
    DEBUG: "DEBUG",
    INMEMORY: "INMEMORY",
    ENTITYLOOKUP_BYNAME: "ENTITYLOOKUP_BYNAME",
    ENTITYLOOKUP_BYID: "ENTITYLOOKUP_BYID",
    LASTSTEP: "LASTSTEP",
    CURSTEP: "CURSTEP",
    TRAINSTEPS: "TRAINSTEPS",
    CUECOMMAND: "CUECOMMAND",
    PAGE: "PAGE",
    POSTS: "POSTS" // Array of last messages sent to user
};
var BlisMemory = (function () {
    function BlisMemory(userkey) {
        this.userkey = userkey;
        this.memCache = {};
    }
    BlisMemory.GetMemory = function (session) {
        // Create key for this user from their address
        var key = Utils_1.Utils.HashCode(JSON.stringify(session.message.address.user));
        return new BlisMemory("" + key);
    };
    BlisMemory.prototype.Key = function (datakey) {
        return this.userkey + "_" + datakey;
    };
    BlisMemory.prototype.GetAsync = function (datakey) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var that, key, cacheData;
            return tslib_1.__generator(this, function (_a) {
                that = this;
                key = this.Key(datakey);
                cacheData = this.memCache[key];
                if (cacheData) {
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            BlisDebug_1.BlisDebug.Log("-) " + key + " : " + cacheData, 'memory');
                            resolve(cacheData);
                        })];
                }
                ;
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        BlisMemory.redisClient.get(key, function (err, data) {
                            if (err !== null)
                                return reject(err);
                            that.memCache[key] = data;
                            BlisDebug_1.BlisDebug.Log("R) " + key + " : " + data, 'memory');
                            resolve(data);
                        });
                    })];
            });
        });
    };
    BlisMemory.prototype.SetAsync = function (datakey, value) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var that, key;
            return tslib_1.__generator(this, function (_a) {
                if (value == null) {
                    return [2 /*return*/, this.DeleteAsync(datakey)];
                }
                that = this;
                key = this.Key(datakey);
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        BlisMemory.redisClient.set(key, value, function (err, data) {
                            if (err !== null)
                                return reject(err);
                            that.memCache[key] = value;
                            BlisDebug_1.BlisDebug.Log("W) " + key + " : " + value, 'memory');
                            resolve(data);
                        });
                    })];
            });
        });
    };
    BlisMemory.prototype.DeleteAsync = function (datakey) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var that, key;
            return tslib_1.__generator(this, function (_a) {
                that = this;
                key = this.Key(datakey);
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        BlisMemory.redisClient.del(key, function (err, data) {
                            if (err !== null)
                                return reject(err);
                            that.memCache[key] = null;
                            BlisDebug_1.BlisDebug.Log("D) " + key + " : -----", 'memory');
                            resolve(data);
                        });
                    })];
            });
        });
    };
    BlisMemory.prototype.Get = function (datakey, cb) {
        var _this = this;
        var key = this.Key(datakey);
        var cacheData = this.memCache[key];
        if (cacheData) {
            BlisDebug_1.BlisDebug.Log("-] " + key + " : " + cacheData, 'memory');
            cb(null, cacheData);
        }
        BlisMemory.redisClient.get(key, function (err, data) {
            if (!err) {
                _this.memCache[key] = data;
            }
            BlisDebug_1.BlisDebug.Log("R] " + key + " : " + data, 'memory');
            cb(err, data);
        });
    };
    BlisMemory.prototype.Set = function (datakey, value, cb) {
        var key = this.Key(datakey);
        this.memCache[key] = value;
        BlisDebug_1.BlisDebug.Log("W] " + key + " : " + value, 'memory');
        BlisMemory.redisClient.set(key, value, cb);
    };
    BlisMemory.prototype.Delete = function (datakey, cb) {
        var key = this.Key(datakey);
        this.memCache[key] = null;
        BlisDebug_1.BlisDebug.Log("D] " + key + " : -----", 'memory');
        BlisMemory.redisClient.del(key, cb);
    };
    BlisMemory.prototype.Init = function (appId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.SetAppId(appId)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.SetModelId(null)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.SetSessionId(null)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.SetAsync(MemoryType.TEACH, false)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.SetAsync(MemoryType.DEBUG, false)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.SetAsync(MemoryType.INMEMORY, JSON.stringify({}))];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, this.SetAsync(MemoryType.ENTITYLOOKUP_BYNAME, {})];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, this.SetAsync(MemoryType.LASTSTEP, null)];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, this.SetAsync(MemoryType.CURSTEP, null)];
                    case 9:
                        _a.sent();
                        return [4 /*yield*/, this.SetAsync(MemoryType.TRAINSTEPS, [])];
                    case 10:
                        _a.sent();
                        return [4 /*yield*/, this.SetAsync(MemoryType.CUECOMMAND, null)];
                    case 11:
                        _a.sent();
                        return [4 /*yield*/, this.SetAsync(MemoryType.PAGE, null)];
                    case 12:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Clear memory associated with a session */
    BlisMemory.prototype.EndSession = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.SetAsync(MemoryType.SESSION, null)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.SetAsync(MemoryType.TEACH, false)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.SetAsync(MemoryType.LASTSTEP, null)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.SetAsync(MemoryType.INMEMORY, JSON.stringify({}))];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Init memory for a session */
    BlisMemory.prototype.StartSession = function (sessionId, inTeach) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.EndSession()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.SetAsync(MemoryType.SESSION, sessionId)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.SetAsync(MemoryType.TEACH, inTeach)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    //--------------------------------------------------------
    // Entity Lookups
    //---------------------------------------------------------
    // Generate redis key for a entity Name lookup
    BlisMemory.prototype.EntityLookupNameKey = function (entityName) {
        return MemoryType.ENTITYLOOKUP_BYNAME + "_" + entityName;
    };
    // Generate redis key for a entity Id lookup
    BlisMemory.prototype.EntityLookupIdKey = function (entityId) {
        return MemoryType.ENTITYLOOKUP_BYID + "_" + entityId;
    };
    BlisMemory.prototype.AddEntityLookup = function (entityName, entityId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var nkey, ikey;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nkey = this.EntityLookupNameKey(entityName);
                        return [4 /*yield*/, this.SetAsync(nkey, entityId)];
                    case 1:
                        _a.sent();
                        ikey = this.EntityLookupIdKey(entityId);
                        return [4 /*yield*/, this.SetAsync(ikey, entityName)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisMemory.prototype.RemoveEntityLookup = function (entityName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityId, nkey, ikey, error_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.EntityId2Name(entityName)];
                    case 1:
                        entityId = _a.sent();
                        nkey = this.EntityLookupNameKey(entityName);
                        return [4 /*yield*/, this.DeleteAsync(nkey)];
                    case 2:
                        _a.sent();
                        ikey = this.EntityLookupIdKey(entityId);
                        return [4 /*yield*/, this.DeleteAsync(ikey)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_1);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /** Convert EntityName to EntityId */
    BlisMemory.prototype.EntityName2Id = function (entityName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var key, error_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Make independant of prefix
                        entityName = entityName.replace('$', '');
                        key = this.EntityLookupNameKey(entityName);
                        return [4 /*yield*/, this.GetAsync(key)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_2 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /** Convert EntityId to EntityName */
    BlisMemory.prototype.EntityId2Name = function (entityId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var key, error_3;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        key = this.EntityLookupIdKey(entityId);
                        return [4 /*yield*/, this.GetAsync(key)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_3 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /** Convert array entityIds into an array of entityNames */
    BlisMemory.prototype.EntityIds2Names = function (ids) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var names, _i, ids_1, entityId, key, name_1, error_4;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        names = [];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        _i = 0, ids_1 = ids;
                        _a.label = 2;
                    case 2:
                        if (!(_i < ids_1.length)) return [3 /*break*/, 5];
                        entityId = ids_1[_i];
                        key = this.EntityLookupIdKey(entityId);
                        return [4 /*yield*/, this.GetAsync(key)];
                    case 3:
                        name_1 = _a.sent();
                        names.push(name_1);
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_4 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_4);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/, names];
                }
            });
        });
    };
    //--------------------------------------------------------
    // Bot Memory
    //---------------------------------------------------------
    // Generate redis key for a memory lookup
    BlisMemory.prototype.MemoryKey = function (entityId) {
        return MemoryType.INMEMORY + "_" + entityId;
    };
    BlisMemory.prototype.EntityValue = function (entityName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityId, botmemory, _a, _b, _c, value, group, key, index, prefix;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.EntityName2Id(entityName)];
                    case 1:
                        entityId = _d.sent();
                        _b = (_a = JSON).parse;
                        return [4 /*yield*/, this.GetAsync(MemoryType.INMEMORY)];
                    case 2:
                        botmemory = _b.apply(_a, [_d.sent()]);
                        value = botmemory[entityId];
                        if (typeof value == 'string') {
                            return [2 /*return*/, value];
                        }
                        group = "";
                        for (key in value) {
                            index = +key;
                            prefix = "";
                            if (value.length != 1 && index == value.length - 1) {
                                prefix = " and ";
                            }
                            else if (index != 0) {
                                prefix = ", ";
                            }
                            group += "" + prefix + value[key];
                        }
                        return [2 /*return*/, group];
                }
            });
        });
    };
    BlisMemory.prototype.RememberEntity = function (entityId, entityName, entityValue) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botmemory, _a, _b, _c, error_5;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 3, , 4]);
                        _b = (_a = JSON).parse;
                        return [4 /*yield*/, this.GetAsync(MemoryType.INMEMORY)];
                    case 1:
                        botmemory = _b.apply(_a, [_d.sent()]);
                        // Check if entity buckets values
                        if (entityName && entityName.startsWith(Consts_1.ActionCommand.BUCKET)) {
                            if (!botmemory[entityId]) {
                                botmemory[entityId] = [];
                            }
                            botmemory[entityId].push(entityValue);
                        }
                        else {
                            botmemory[entityName] = entityValue;
                        }
                        return [4 /*yield*/, this.SetAsync(MemoryType.INMEMORY, JSON.stringify(botmemory))];
                    case 2:
                        _d.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _d.sent();
                        BlisDebug_1.BlisDebug.Error(error_5);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BlisMemory.prototype.RememberEntityByName = function (entityName, entityValue) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityId;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.EntityName2Id(entityName)];
                    case 1:
                        entityId = _a.sent();
                        if (!entityId) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.RememberEntity(entityId, entityName, entityValue)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        BlisDebug_1.BlisDebug.Error("Unknown Entity: " + entityId);
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BlisMemory.prototype.RememberEntityById = function (entityId, entityValue) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityName;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.EntityId2Name(entityId)];
                    case 1:
                        entityName = _a.sent();
                        if (!entityName) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.RememberEntity(entityId, entityName, entityValue)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        BlisDebug_1.BlisDebug.Error("Unknown Entity: " + entityName);
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /** Remember entity value */
    BlisMemory.prototype.RememberEntityLabel = function (entity) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botmemory, _a, _b, _c, error_6;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 3, , 4]);
                        _b = (_a = JSON).parse;
                        return [4 /*yield*/, this.GetAsync(MemoryType.INMEMORY)];
                    case 1:
                        botmemory = _b.apply(_a, [_d.sent()]);
                        // Check if entity buckets values
                        if (entity.metadata && entity.metadata.bucket) {
                            if (!botmemory[entity.id]) {
                                botmemory[entity.id] = [];
                            }
                            botmemory[entity.id].push(entity.value);
                        }
                        else {
                            botmemory[entity.id] = entity.value;
                        }
                        return [4 /*yield*/, this.SetAsync(MemoryType.INMEMORY, JSON.stringify(botmemory))];
                    case 2:
                        _d.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_6 = _d.sent();
                        BlisDebug_1.BlisDebug.Error(error_6);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Returns true if entity was remembered
    BlisMemory.prototype.WasRemembered = function (entityId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botmemory, _a, _b, _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _b = (_a = JSON).parse;
                        return [4 /*yield*/, this.GetAsync(MemoryType.INMEMORY)];
                    case 1:
                        botmemory = _b.apply(_a, [_d.sent()]);
                        return [2 /*return*/, (botmemory[entityId] != null)];
                }
            });
        });
    };
    /** Return array of entityIds for which I've remembered something */
    BlisMemory.prototype.EntityIds = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botmemory, _a, _b, _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _b = (_a = JSON).parse;
                        return [4 /*yield*/, this.GetAsync(MemoryType.INMEMORY)];
                    case 1:
                        botmemory = _b.apply(_a, [_d.sent()]);
                        return [2 /*return*/, Object.keys(botmemory)];
                }
            });
        });
    };
    /** Forget an entity by Id */
    BlisMemory.prototype.ForgetEntity = function (entityId, entityName, entityValue) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botmemory, _a, _b, _c, lowerCaseNames, index, error_7;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 3, , 4]);
                        _b = (_a = JSON).parse;
                        return [4 /*yield*/, this.GetAsync(MemoryType.INMEMORY)];
                    case 1:
                        botmemory = _b.apply(_a, [_d.sent()]);
                        if (entityName.startsWith(Consts_1.ActionCommand.BUCKET)) {
                            lowerCaseNames = botmemory[entityId].map(function (value) {
                                return value.toLowerCase();
                            });
                            index = lowerCaseNames.indexOf(entityValue.toLowerCase());
                            if (index > -1) {
                                botmemory[entityId].splice(index, 1);
                                if (botmemory[entityId].length == 0) {
                                    delete botmemory[entityId];
                                }
                            }
                        }
                        else {
                            delete botmemory[entityId];
                        }
                        return [4 /*yield*/, this.SetAsync(MemoryType.INMEMORY, JSON.stringify(botmemory))];
                    case 2:
                        _d.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_7 = _d.sent();
                        BlisDebug_1.BlisDebug.Error(error_7);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /** Forget an entity */
    BlisMemory.prototype.ForgetEntityByName = function (entityName, entityValue) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityId;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.EntityName2Id(entityName)];
                    case 1:
                        entityId = _a.sent();
                        if (!entityId) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.ForgetEntity(entityId, entityName, entityValue)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        BlisDebug_1.BlisDebug.Error("Unknown Entity: " + entityId);
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /** Forget an entity by Id */
    BlisMemory.prototype.ForgetEntityById = function (entityId, entityValue) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityName;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.EntityId2Name(entityId)];
                    case 1:
                        entityName = _a.sent();
                        if (!entityName) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.ForgetEntity(entityId, entityName, entityValue)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        BlisDebug_1.BlisDebug.Error("Unknown Entity: " + entityName);
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /** Forget the EntityId that I've remembered */
    BlisMemory.prototype.ForgetEntityLabel = function (entity) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var positiveId, botmemory, _a, _b, _c, lowerCaseNames, index, positiveId_1, error_8;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 3, , 4]);
                        positiveId = entity.metadata.positive;
                        if (!positiveId) {
                            throw new Error('ForgetEntity called with no PositiveId');
                        }
                        _b = (_a = JSON).parse;
                        return [4 /*yield*/, this.GetAsync(MemoryType.INMEMORY)];
                    case 1:
                        botmemory = _b.apply(_a, [_d.sent()]);
                        if (entity.metadata && entity.metadata.bucket) {
                            lowerCaseNames = botmemory[positiveId].map(function (value) {
                                return value.toLowerCase();
                            });
                            index = lowerCaseNames.indexOf(entity.value.toLowerCase());
                            if (index > -1) {
                                botmemory[positiveId].splice(index, 1);
                                if (botmemory[positiveId].length == 0) {
                                    delete botmemory[positiveId];
                                }
                            }
                        }
                        else {
                            positiveId_1 = entity.metadata.positive;
                            delete botmemory[positiveId_1];
                        }
                        return [4 /*yield*/, this.SetAsync(MemoryType.INMEMORY, JSON.stringify(botmemory))];
                    case 2:
                        _d.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_8 = _d.sent();
                        BlisDebug_1.BlisDebug.Error(error_8);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    //--------------------------------------------------------
    // SUBSTITUTE
    //--------------------------------------------------------
    BlisMemory.prototype.GetEntities = function (text) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entities, words, _i, words_1, word, entityName, entityValue;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        entities = [];
                        words = BlisMemory.Split(text);
                        _i = 0, words_1 = words;
                        _a.label = 1;
                    case 1:
                        if (!(_i < words_1.length)) return [3 /*break*/, 4];
                        word = words_1[_i];
                        if (!word.startsWith(Consts_1.ActionCommand.SUBSTITUTE)) return [3 /*break*/, 3];
                        entityName = word.substr(1, word.length - 1);
                        return [4 /*yield*/, this.EntityValue(entityName)];
                    case 2:
                        entityValue = _a.sent();
                        if (entityValue) {
                            entities.push({
                                type: entityName,
                                entity: entityValue
                            });
                            text = text.replace(word, entityValue);
                        }
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, entities];
                }
            });
        });
    };
    BlisMemory.prototype.SubstituteEntities = function (text) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var words, _i, words_2, word, entityName, entityValue;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        words = BlisMemory.Split(text);
                        _i = 0, words_2 = words;
                        _a.label = 1;
                    case 1:
                        if (!(_i < words_2.length)) return [3 /*break*/, 4];
                        word = words_2[_i];
                        if (!word.startsWith(Consts_1.ActionCommand.SUBSTITUTE)) return [3 /*break*/, 3];
                        entityName = word.substr(1, word.length - 1);
                        return [4 /*yield*/, this.EntityValue(entityName)];
                    case 2:
                        entityValue = _a.sent();
                        if (entityValue) {
                            text = text.replace(word, entityValue);
                        }
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, text];
                }
            });
        });
    };
    /** Extract contigent phrases (i.e. [,$name]) */
    BlisMemory.prototype.SubstituteBrackets = function (text) {
        var start = text.indexOf('[');
        var end = text.indexOf(']');
        // If no legal contingency found
        if (start < 0 || end < 0 || end < start) {
            return text;
        }
        var phrase = text.substring(start + 1, end);
        // If phrase still contains unmatched entities, cut phrase
        if (phrase.indexOf(Consts_1.ActionCommand.SUBSTITUTE) > 0) {
            text = text.replace("[" + phrase + "]", "");
        }
        else {
            text = text.replace("[" + phrase + "]", phrase);
        }
        return this.SubstituteBrackets(text);
    };
    BlisMemory.Split = function (action) {
        return action.split(/[\s,:.?!\[\]]+/);
    };
    BlisMemory.prototype.Substitute = function (text) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Clear suggestions
                        text = text.replace(" " + Consts_1.ActionCommand.SUGGEST, " ");
                        return [4 /*yield*/, this.SubstituteEntities(text)];
                    case 1:
                        // First replace all entities
                        text = (_a.sent());
                        // Remove contingent entities
                        text = this.SubstituteBrackets(text);
                        return [2 /*return*/, text];
                }
            });
        });
    };
    //--------------------------------------------------------
    // LAST STEP
    //--------------------------------------------------------
    BlisMemory.prototype.SetLastStep = function (saveStep, value) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var data, lastStep;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.GetAsync(MemoryType.LASTSTEP)];
                    case 1:
                        data = _a.sent();
                        lastStep = TrainStep_1.TrainStep.Deserialize(TrainStep_1.TrainStep, data);
                        if (lastStep == null) {
                            lastStep = new TrainStep_1.TrainStep();
                        }
                        if (saveStep == Consts_2.SaveStep.RESPONSES) {
                            // Can be mulitple Response steps
                            lastStep[Consts_2.SaveStep.RESPONSES].push(value);
                        }
                        else if (saveStep = Consts_2.SaveStep.APICALLS) {
                            // Can be mulitple API steps
                            lastStep[Consts_2.SaveStep.APICALLS].push(value);
                        }
                        else {
                            lastStep[saveStep] = value;
                        }
                        return [4 /*yield*/, this.SetAsync(MemoryType.LASTSTEP, lastStep.Serialize())];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisMemory.prototype.LastStep = function (saveStep) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var data, lastStep;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.GetAsync(MemoryType.LASTSTEP)];
                    case 1:
                        data = _a.sent();
                        lastStep = TrainStep_1.TrainStep.Deserialize(TrainStep_1.TrainStep, data);
                        if (!lastStep) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, lastStep[saveStep]];
                }
            });
        });
    };
    //--------------------------------------------------------
    // TRAIN STEPS
    //--------------------------------------------------------
    BlisMemory.prototype.SetTrainStep = function (saveStep, value) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var data, curStep;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.GetAsync(MemoryType.CURSTEP)];
                    case 1:
                        data = _a.sent();
                        curStep = TrainStep_1.TrainStep.Deserialize(TrainStep_1.TrainStep, data);
                        if (!curStep) {
                            curStep = new TrainStep_1.TrainStep();
                        }
                        if (saveStep == Consts_2.SaveStep.INPUT) {
                            curStep[Consts_2.SaveStep.INPUT] = value;
                        }
                        else if (saveStep == Consts_2.SaveStep.ENTITY) {
                            curStep[Consts_2.SaveStep.ENTITY] = value;
                        }
                        else if (saveStep == Consts_2.SaveStep.RESPONSES) {
                            // Can be mulitple Response steps
                            curStep[Consts_2.SaveStep.RESPONSES].push(value);
                        }
                        else if (saveStep = Consts_2.SaveStep.APICALLS) {
                            // Can be mulitple API steps
                            curStep[Consts_2.SaveStep.APICALLS].push(value);
                        }
                        else {
                            console.log("Unknown SaveStep value " + saveStep);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.SetAsync(MemoryType.CURSTEP, curStep.Serialize())];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Push current training step onto the training step history */
    BlisMemory.prototype.FinishTrainStep = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var data, trainSteps, cdata, curStep;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.GetAsync(MemoryType.TRAINSTEPS)];
                    case 1:
                        data = _a.sent();
                        trainSteps = TrainStep_1.TrainSteps.Deserialize(TrainStep_1.TrainSteps, data);
                        if (!trainSteps) {
                            trainSteps = new TrainStep_1.TrainSteps();
                        }
                        if (!trainSteps.steps) {
                            trainSteps.steps = [];
                        }
                        return [4 /*yield*/, this.GetAsync(MemoryType.CURSTEP)];
                    case 2:
                        cdata = _a.sent();
                        curStep = TrainStep_1.TrainStep.Deserialize(TrainStep_1.TrainStep, cdata);
                        trainSteps.steps.push(curStep);
                        return [4 /*yield*/, this.SetAsync(MemoryType.TRAINSTEPS, trainSteps.Serialize())];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.DeleteAsync(MemoryType.CURSTEP)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Returns input of current train step */
    BlisMemory.prototype.TrainStepInput = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var cdata, curStep;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.GetAsync(MemoryType.CURSTEP)];
                    case 1:
                        cdata = _a.sent();
                        curStep = TrainStep_1.TrainStep.Deserialize(TrainStep_1.TrainStep, cdata);
                        if (curStep) {
                            return [2 /*return*/, curStep[Consts_2.SaveStep.INPUT]];
                        }
                        return [2 /*return*/, null];
                }
            });
        });
    };
    BlisMemory.prototype.TrainSteps = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var data, trainSteps;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.GetAsync(MemoryType.TRAINSTEPS)];
                    case 1:
                        data = _a.sent();
                        trainSteps = TrainStep_1.TrainSteps.Deserialize(TrainStep_1.TrainSteps, data);
                        return [2 /*return*/, trainSteps.steps];
                }
            });
        });
    };
    BlisMemory.prototype.ClearTrainSteps = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.SetAsync(MemoryType.CURSTEP, null)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.SetAsync(MemoryType.TRAINSTEPS, {})];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    //--------------------------------------------------------
    // Cue COMMAND
    //--------------------------------------------------------
    BlisMemory.prototype.SetCueCommand = function (cueCommand) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.SetAsync(MemoryType.CUECOMMAND, cueCommand.Serialize())];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisMemory.prototype.CueCommand = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var data;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.GetAsync(MemoryType.CUECOMMAND)];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, CueCommand_1.CueCommand.Deserialize(CueCommand_1.CueCommand, data)];
                }
            });
        });
    };
    BlisMemory.prototype.InTeachAsync = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var value;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.GetAsync(MemoryType.TEACH)];
                    case 1:
                        value = _a.sent();
                        return [2 /*return*/, (value == "true")];
                }
            });
        });
    };
    BlisMemory.prototype.InTeach = function (cb) {
        var value = this.Get(MemoryType.TEACH, cb);
    };
    BlisMemory.prototype.InDebug = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var value;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.GetAsync(MemoryType.DEBUG)];
                    case 1:
                        value = _a.sent();
                        return [2 /*return*/, (value == "true")];
                }
            });
        });
    };
    BlisMemory.prototype.SetInDebug = function (isTrue) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.SetAsync(MemoryType.DEBUG, isTrue)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisMemory.prototype.AppId = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.GetAsync(MemoryType.APP)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BlisMemory.prototype.SetAppId = function (appId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.SetAsync(MemoryType.APP, appId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisMemory.prototype.ModelId = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.GetAsync(MemoryType.MODEL)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BlisMemory.prototype.SetModelId = function (modelId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.SetAsync(MemoryType.MODEL, modelId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisMemory.prototype.SessionId = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.GetAsync(MemoryType.SESSION)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BlisMemory.prototype.SetSessionId = function (sessionId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.SetAsync(MemoryType.SESSION, sessionId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisMemory.prototype.Pager = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var json;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.GetAsync(MemoryType.PAGE)];
                    case 1:
                        json = _a.sent();
                        return [2 /*return*/, Pager_1.Pager.Deserialize(Pager_1.Pager, json)];
                }
            });
        });
    };
    BlisMemory.prototype.SetPager = function (pager) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.SetAsync(MemoryType.PAGE, pager.Serialize())];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    //--------------------------------------------------------
    // Debug Tools
    //--------------------------------------------------------
    BlisMemory.prototype.DumpEntities = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, botmemory, _a, _b, _c, _d, _e, _i, entityId, entityName, entityValue;
            return tslib_1.__generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        memory = "";
                        _b = (_a = JSON).parse;
                        return [4 /*yield*/, this.GetAsync(MemoryType.INMEMORY)];
                    case 1:
                        botmemory = _b.apply(_a, [_f.sent()]);
                        _d = [];
                        for (_e in botmemory[MemoryType.INMEMORY])
                            _d.push(_e);
                        _i = 0;
                        _f.label = 2;
                    case 2:
                        if (!(_i < _d.length)) return [3 /*break*/, 5];
                        entityId = _d[_i];
                        if (memory)
                            memory += " ";
                        return [4 /*yield*/, this.EntityId2Name(entityId)];
                    case 3:
                        entityName = _f.sent();
                        entityValue = botmemory[MemoryType.INMEMORY][entityId];
                        memory += "[" + entityName + " : " + entityValue + "]";
                        _f.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        if (memory == "") {
                            memory = '[ - none - ]';
                        }
                        return [2 /*return*/, memory];
                }
            });
        });
    };
    BlisMemory.prototype.Dump = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var text, botmemory, _a, _b, _c, ents;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        text = "";
                        _b = (_a = JSON).parse;
                        return [4 /*yield*/, this.GetAsync(MemoryType.INMEMORY)];
                    case 1:
                        botmemory = _b.apply(_a, [_d.sent()]);
                        return [4 /*yield*/, this.DumpEntities()];
                    case 2:
                        ents = _d.sent();
                        text += "App: " + botmemory[MemoryType.APP] + "\n\n";
                        text += "Model: " + botmemory[MemoryType.MODEL] + "\n\n";
                        text += "Session: " + botmemory[MemoryType.SESSION] + "\n\n";
                        text += "InTeach: " + botmemory[MemoryType.TEACH] + "\n\n";
                        text += "InDebug: " + botmemory[MemoryType.TEACH] + "\n\n";
                        text += "LastStep: " + JSON.stringify(botmemory[MemoryType.LASTSTEP]) + "\n\n";
                        text += "Memory: {" + ents + "}\n\n";
                        text += "EntityLookup: " + JSON.stringify(botmemory[MemoryType.ENTITYLOOKUP_BYNAME]) + "\n\n";
                        return [2 /*return*/, text];
                }
            });
        });
    };
    return BlisMemory;
}());
// TODO: create own redis account
BlisMemory.redisClient = redis.createClient(6380, 'libot.redis.cache.windows.net', { auth_pass: 'SKbD9LlGF0NdPm6NpIyHpslRvqB3/z4dYYurFakJ4HM=', tls: { servername: 'libot.redis.cache.windows.net' } });
exports.BlisMemory = BlisMemory;
//# sourceMappingURL=BlisMemory.js.map