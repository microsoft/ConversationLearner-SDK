"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Serializable_1 = require("./Serializable");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var blis_models_1 = require("blis-models");
var BotState = (function (_super) {
    tslib_1.__extends(BotState, _super);
    function BotState(init) {
        var _this = _super.call(this) || this;
        _this.app = null;
        _this.sessionId = null;
        _this.inTeach = false;
        _this.inDebug = false;
        _this.address = null;
        _this.suggestedEntityId = null;
        _this.suggestedEntityName = null;
        _this.app = undefined;
        _this.sessionId = undefined;
        _this.inTeach = false;
        _this.inDebug = false;
        _this.address = undefined;
        _this.suggestedEntityId = undefined;
        _this.suggestedEntityName = undefined;
        Object.assign(_this, init);
        return _this;
    }
    BotState.Get = function (blisMemory) {
        if (!BotState._instance) {
            BotState._instance = new BotState();
        }
        BotState._instance.memory = blisMemory;
        return BotState._instance;
    };
    BotState.prototype.Init = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var data;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.memory) {
                            throw new Error("BotState called without initializing memory");
                        }
                        return [4 /*yield*/, this.memory.GetAsync(BotState.MEMKEY)];
                    case 1:
                        data = _a.sent();
                        if (data) {
                            this.Deserialize(data);
                        }
                        else {
                            this.Clear(null);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    BotState.prototype.GetSync = function (cb) {
        var _this = this;
        if (!this.memory) {
            throw new Error("BotState called without initialzing memory");
        }
        // Load bot state
        this.memory.Get(BotState.MEMKEY, function (err, data) {
            if (!err && data) {
                _this.Deserialize(data);
            }
            else {
                _this.Clear(null);
            }
            cb(null, _this);
        });
    };
    BotState.prototype.Deserialize = function (text) {
        if (!text)
            return null;
        var json = JSON.parse(text);
        this.app = json.appId;
        this.sessionId = json.sesionId;
        this.inTeach = json.inTeach ? json.inTeach : false;
        this.inDebug = json.inDebug ? json.inDebug : false;
        this.address = json.address;
        this.suggestedEntityId = json.suggestedEntityId;
        this.suggestedEntityName = json.suggestedEntityName;
    };
    BotState.prototype.Set = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.memory) {
                            throw new Error("BotState called without initialzing memory");
                        }
                        return [4 /*yield*/, this.memory.SetAsync(BotState.MEMKEY, this.Serialize())];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotState.prototype.Clear = function (appId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.app = appId;
                        this.sessionId = null;
                        this.inTeach = false;
                        this.inDebug = false;
                        return [4 /*yield*/, this.Set()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotState.prototype.App = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var err_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.Init()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, JSON.parse(this.app)];
                    case 2:
                        err_1 = _a.sent();
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    BotState.prototype.SetApp = function (blisApp) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Init()];
                    case 1:
                        _a.sent();
                        this.app = JSON.stringify(blisApp);
                        return [4 /*yield*/, this.Set()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotState.prototype.SessionId = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Init()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.sessionId];
                }
            });
        });
    };
    BotState.prototype.SetSessionId = function (sessionId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Init()];
                    case 1:
                        _a.sent();
                        this.sessionId = sessionId;
                        return [4 /*yield*/, this.Set()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotState.prototype.InTeach = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Init()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.inTeach];
                }
            });
        });
    };
    BotState.prototype.SetInTeach = function (isTrue) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Init()];
                    case 1:
                        _a.sent();
                        this.inTeach = isTrue;
                        return [4 /*yield*/, this.Set()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotState.prototype.InTeachSync = function (cb) {
        this.GetSync(function (err, botState) {
            if (!err) {
                cb(null, botState.inTeach);
            }
        });
    };
    BotState.prototype.InDebug = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Init()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.inDebug];
                }
            });
        });
    };
    BotState.prototype.SetInDebug = function (isTrue) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Init()];
                    case 1:
                        _a.sent();
                        this.inDebug = isTrue;
                        return [4 /*yield*/, this.Set()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotState.prototype.SetAddress = function (address) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Init()];
                    case 1:
                        _a.sent();
                        this.address = JSON.stringify(address);
                        return [4 /*yield*/, this.Set()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotState.prototype.Address = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var addressString, err_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.Init()];
                    case 1:
                        _a.sent();
                        addressString = this.address;
                        return [2 /*return*/, JSON.parse(addressString)];
                    case 2:
                        err_2 = _a.sent();
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    //------------------------------------------------------------------
    BotState.prototype.SuggestedEntity = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Init()];
                    case 1:
                        _a.sent();
                        if (!this.suggestedEntityId || !this.suggestedEntityName) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, new blis_models_1.EntitySuggestion({
                                entityId: this.suggestedEntityId,
                                entityName: this.suggestedEntityName
                            })];
                }
            });
        });
    };
    BotState.prototype.SetSuggestedEntity = function (suggestedEntity) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Init()];
                    case 1:
                        _a.sent();
                        this.suggestedEntityId = suggestedEntity.entityId;
                        this.suggestedEntityName = suggestedEntity.entityName;
                        return [4 /*yield*/, this.Set()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotState.prototype.ClearSuggestedEntity = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Init()];
                    case 1:
                        _a.sent();
                        this.suggestedEntityId = null;
                        this.suggestedEntityName = null;
                        return [4 /*yield*/, this.Set()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    //------------------------------------------------------------------
    BotState.prototype.Session = function (bot) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var address;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Address()];
                    case 1:
                        address = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                bot.loadSession(address, function (err, session) {
                                    if (err !== null) {
                                        reject(err);
                                    }
                                    else {
                                        resolve(session);
                                    }
                                });
                            })];
                }
            });
        });
    };
    BotState._instance = null;
    BotState.MEMKEY = "BOTSTATE";
    tslib_1.__decorate([
        json_typescript_mapper_1.JsonProperty('appId'),
        tslib_1.__metadata("design:type", String)
    ], BotState.prototype, "app", void 0);
    tslib_1.__decorate([
        json_typescript_mapper_1.JsonProperty('sesionId'),
        tslib_1.__metadata("design:type", String)
    ], BotState.prototype, "sessionId", void 0);
    tslib_1.__decorate([
        json_typescript_mapper_1.JsonProperty('inTeach'),
        tslib_1.__metadata("design:type", Boolean)
    ], BotState.prototype, "inTeach", void 0);
    tslib_1.__decorate([
        json_typescript_mapper_1.JsonProperty('inDebug'),
        tslib_1.__metadata("design:type", Boolean)
    ], BotState.prototype, "inDebug", void 0);
    tslib_1.__decorate([
        json_typescript_mapper_1.JsonProperty('address'),
        tslib_1.__metadata("design:type", String)
    ], BotState.prototype, "address", void 0);
    tslib_1.__decorate([
        json_typescript_mapper_1.JsonProperty('suggestedEntityId'),
        tslib_1.__metadata("design:type", String)
    ], BotState.prototype, "suggestedEntityId", void 0);
    tslib_1.__decorate([
        json_typescript_mapper_1.JsonProperty('suggestedEntityName'),
        tslib_1.__metadata("design:type", String)
    ], BotState.prototype, "suggestedEntityName", void 0);
    return BotState;
}(Serializable_1.Serializable));
exports.BotState = BotState;
//# sourceMappingURL=BotState.js.map