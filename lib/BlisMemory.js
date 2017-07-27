"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var BlisDebug_1 = require("./BlisDebug");
var Pager_1 = require("./Memory/Pager");
var TrainHistory_1 = require("./Memory/TrainHistory");
var EntityLookup_1 = require("./Memory/EntityLookup");
var BotMemory_1 = require("./Memory/BotMemory");
var BotState_1 = require("./Memory/BotState");
var blis_models_1 = require("blis-models");
var redis = require("redis");
exports.MemoryType = {
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
    BlisMemory.Init = function (redisServer, redisKey) {
        this.redisClient = redis.createClient(6380, redisServer, { auth_pass: redisKey, tls: { servername: redisServer } });
    };
    BlisMemory.GetMemory = function (key) {
        return new BlisMemory(key);
    };
    // Generate memory key from session
    BlisMemory.InitMemory = function (session) {
        var user = session.message.address.user;
        var userdata = { id: user.id, name: user.name };
        var key = blis_models_1.KeyGen.MakeKey(JSON.stringify(userdata));
        var memory = new BlisMemory(key);
        memory.BotState().SetAddress(session.message.address);
        return memory;
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
                            BlisDebug_1.BlisDebug.Log("-< " + key + " : " + cacheData, 'memverbose');
                            resolve(cacheData);
                        })];
                }
                ;
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        BlisMemory.redisClient.get(key, function (err, data) {
                            if (err !== null)
                                return reject(err);
                            that.memCache[key] = data;
                            BlisDebug_1.BlisDebug.Log("R< " + key + " : " + data, 'memory');
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
                        // First check mem cache to see if anything has changed, if not, can skip write
                        var cacheData = that.memCache[key];
                        if (cacheData == value) {
                            BlisDebug_1.BlisDebug.Log("-> " + key + " : " + value, 'memverbose');
                            resolve("Cache");
                        }
                        else {
                            // Write to redis cache
                            BlisMemory.redisClient.set(key, value, function (err, data) {
                                if (err !== null)
                                    return reject(err);
                                that.memCache[key] = value;
                                BlisDebug_1.BlisDebug.Log("W> " + key + " : " + value, 'memory');
                                resolve(data);
                            });
                        }
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
                        // First check mem cache to see if already null, if not, can skip write
                        var cacheData = that.memCache[key];
                        if (!cacheData) {
                            BlisDebug_1.BlisDebug.Log("-> " + key + " : -----", 'memverbose');
                            resolve("Cache");
                        }
                        else {
                            BlisMemory.redisClient.del(key, function (err, data) {
                                if (err !== null)
                                    return reject(err);
                                that.memCache[key] = null;
                                BlisDebug_1.BlisDebug.Log("D> " + key + " : -----", 'memory');
                                resolve(data);
                            });
                        }
                    })];
            });
        });
    };
    BlisMemory.prototype.Get = function (datakey, cb) {
        var _this = this;
        var key = this.Key(datakey);
        var cacheData = this.memCache[key];
        if (cacheData) {
            BlisDebug_1.BlisDebug.Log("-] " + key + " : " + cacheData, 'memverbose');
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
                    case 0: return [4 /*yield*/, this.BotState().Clear(appId)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.BotMemory().Clear()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.EntityLookup().Clear()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.TrainHistory().Clear()];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.Pager().Clear()];
                    case 5:
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
                    case 0: return [4 /*yield*/, this.BotState().SetSessionId(null)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.BotState().SetInTeach(false)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.TrainHistory().ClearLastStep()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.BotMemory().Clear()];
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
                        return [4 /*yield*/, this.BotState().SetSessionId(sessionId)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.BotState().SetInTeach(inTeach)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // TODO: Eliminate this
    BlisMemory.prototype.EntityLookup = function () {
        EntityLookup_1.EntityLookup.memory = this;
        return EntityLookup_1.EntityLookup;
    };
    BlisMemory.prototype.BotMemory = function () {
        BotMemory_1.BotMemory.memory = this;
        return BotMemory_1.BotMemory;
    };
    BlisMemory.prototype.TrainHistory = function () {
        TrainHistory_1.TrainHistory.memory = this;
        return TrainHistory_1.TrainHistory;
    };
    BlisMemory.prototype.BotState = function () {
        BotState_1.BotState.memory = this;
        return BotState_1.BotState;
    };
    BlisMemory.prototype.Pager = function () {
        Pager_1.Pager.memory = this;
        return Pager_1.Pager;
    };
    //--------------------------------------------------------
    // Debug Tools
    //--------------------------------------------------------
    BlisMemory.prototype.Dump = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var text, _a, _b, _c, _d, _e, _f, _g, _h;
            return tslib_1.__generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        text = "";
                        _a = text;
                        _b = "BotState: ";
                        return [4 /*yield*/, this.BotState().ToString()];
                    case 1:
                        text = _a + (_b + (_j.sent()) + "\n\n");
                        _c = text;
                        _d = "Steps: ";
                        return [4 /*yield*/, this.TrainHistory().ToString()];
                    case 2:
                        text = _c + (_d + (_j.sent()) + "\n\n");
                        _e = text;
                        _f = "Memory: {";
                        return [4 /*yield*/, this.BotMemory().ToString()];
                    case 3:
                        text = _e + (_f + (_j.sent()) + "}\n\n");
                        _g = text;
                        _h = "EntityLookup: ";
                        return [4 /*yield*/, this.EntityLookup().ToString()];
                    case 4:
                        text = _g + (_h + (_j.sent()) + "\n\n");
                        return [2 /*return*/, text];
                }
            });
        });
    };
    BlisMemory.redisClient = null;
    return BlisMemory;
}());
exports.BlisMemory = BlisMemory;
//# sourceMappingURL=BlisMemory.js.map