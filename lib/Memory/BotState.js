"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Serializable_1 = require("./Serializable");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var BotState = (function (_super) {
    tslib_1.__extends(BotState, _super);
    function BotState(init) {
        var _this = _super.call(this) || this;
        _this.appId = null;
        _this.sessionId = null;
        _this.modelId = null;
        _this.inTeach = false;
        _this.inDebug = false;
        _this.address = null;
        _this.appId = undefined;
        _this.sessionId = undefined;
        _this.modelId = undefined;
        _this.inTeach = false;
        _this.inDebug = false;
        _this.address = undefined;
        Object.assign(_this, init);
        return _this;
    }
    BotState.Get = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var data;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.memory) {
                            throw new Error("BotState called without initializing memory");
                        }
                        return [4 /*yield*/, this.memory.GetAsync(this.MEMKEY)];
                    case 1:
                        data = _a.sent();
                        if (data) {
                            return [2 /*return*/, BotState.Deserialize(BotState, data)];
                        }
                        return [2 /*return*/, new BotState()];
                }
            });
        });
    };
    BotState.GetSync = function (cb) {
        if (!this.memory) {
            throw new Error("BotState called without initialzing memory");
        }
        // Load bot state
        var data = this.memory.Get(this.MEMKEY, function (err, data) {
            if (!err && data) {
                var botState = BotState.Deserialize(BotState, data);
                cb(null, botState);
            }
            else {
                cb(null, new BotState());
            }
        });
    };
    BotState.Set = function (botState) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.memory) {
                            throw new Error("BotState called without initialzing memory");
                        }
                        return [4 /*yield*/, this.memory.SetAsync(this.MEMKEY, botState.Serialize())];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotState.Clear = function (appId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botState;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        botState = new BotState();
                        botState.appId = appId;
                        botState.sessionId = null;
                        botState.modelId = null;
                        botState.inTeach = false;
                        botState.inDebug = false;
                        return [4 /*yield*/, this.Set(botState)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotState.ToString = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botState;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botState = _a.sent();
                        return [2 /*return*/, JSON.stringify(botState)];
                }
            });
        });
    };
    BotState.AppId = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botState;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botState = _a.sent();
                        return [2 /*return*/, botState.appId];
                }
            });
        });
    };
    BotState.SetAppId = function (appId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botState;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botState = _a.sent();
                        botState.appId = appId;
                        return [4 /*yield*/, this.Set(botState)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotState.ModelId = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botState;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botState = _a.sent();
                        return [2 /*return*/, botState.modelId];
                }
            });
        });
    };
    BotState.SetModelId = function (modelId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botState;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botState = _a.sent();
                        botState.modelId = modelId;
                        return [4 /*yield*/, this.Set(botState)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotState.SessionId = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botState;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botState = _a.sent();
                        return [2 /*return*/, botState.sessionId];
                }
            });
        });
    };
    BotState.SetSessionId = function (sessionId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botState;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botState = _a.sent();
                        botState.sessionId = sessionId;
                        return [4 /*yield*/, this.Set(botState)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotState.InTeach = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botState;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botState = _a.sent();
                        return [2 /*return*/, botState.inTeach];
                }
            });
        });
    };
    BotState.SetInTeach = function (isTrue) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botState;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botState = _a.sent();
                        botState.inTeach = isTrue;
                        return [4 /*yield*/, this.Set(botState)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotState.InTeachSync = function (cb) {
        this.GetSync(function (err, botState) {
            if (!err) {
                cb(null, botState.inTeach);
            }
        });
    };
    BotState.InDebug = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botState;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botState = _a.sent();
                        return [2 /*return*/, botState.inDebug];
                }
            });
        });
    };
    BotState.SetInDebug = function (isTrue) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botState;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botState = _a.sent();
                        botState.inDebug = isTrue;
                        return [4 /*yield*/, this.Set(botState)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotState.SetAddress = function (address) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botState;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botState = _a.sent();
                        botState.address = JSON.stringify(address);
                        return [4 /*yield*/, this.Set(botState)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotState.Address = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botState, addressString;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botState = _a.sent();
                        addressString = botState.address;
                        return [2 /*return*/, JSON.parse(addressString)];
                }
            });
        });
    };
    BotState.Session = function (bot) {
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
                                        return reject(err);
                                    }
                                    resolve(session);
                                });
                            })];
                }
            });
        });
    };
    return BotState;
}(Serializable_1.Serializable));
BotState.MEMKEY = "BOTSTATE";
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('appId'),
    tslib_1.__metadata("design:type", String)
], BotState.prototype, "appId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('sesionId'),
    tslib_1.__metadata("design:type", String)
], BotState.prototype, "sessionId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('modelId'),
    tslib_1.__metadata("design:type", String)
], BotState.prototype, "modelId", void 0);
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
exports.BotState = BotState;
//# sourceMappingURL=BotState.js.map