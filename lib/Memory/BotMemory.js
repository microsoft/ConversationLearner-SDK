"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Consts_1 = require("../Model/Consts");
var BlisDebug_1 = require("../BlisDebug");
var BotMemory = (function () {
    function BotMemory(init) {
        this.entityMap = {};
        Object.assign(this, init);
    }
    BotMemory.prototype.Serialize = function () {
        return JSON.stringify(this);
    };
    BotMemory.Deserialize = function (type, text) {
        if (!text)
            return null;
        var json = JSON.parse(text);
        var botMemory = new BotMemory({
            entityMap: json.entityMap ? json.entityMap : {}
        });
        return botMemory;
    };
    BotMemory.Get = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var data;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.memory) {
                            throw new Error("BotMemory called without initialzing memory");
                        }
                        return [4 /*yield*/, this.memory.GetAsync(this.MEMKEY)];
                    case 1:
                        data = _a.sent();
                        if (data) {
                            return [2 /*return*/, BotMemory.Deserialize(BotMemory, data)];
                        }
                        return [2 /*return*/, new BotMemory()];
                }
            });
        });
    };
    BotMemory.Set = function (entityLookup) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.memory) {
                            throw new Error("BotMemory called without initialzing memory");
                        }
                        return [4 /*yield*/, this.memory.SetAsync(this.MEMKEY, entityLookup.Serialize())];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotMemory.Clear = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botMemory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        botMemory = new BotMemory();
                        return [4 /*yield*/, this.Set(botMemory)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotMemory.ToString = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg, botmemory, entityName, entityValue;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        msg = "";
                        return [4 /*yield*/, this.Get()];
                    case 1:
                        botmemory = _a.sent();
                        for (entityName in botmemory.entityMap) {
                            if (msg)
                                msg += " ";
                            entityValue = botmemory.entityMap[entityName];
                            msg += "[" + entityName + " : " + entityValue + "]";
                        }
                        if (msg == "") {
                            msg = '[ - none - ]';
                        }
                        return [2 /*return*/, msg];
                }
            });
        });
    };
    BotMemory.RememberEntity = function (predictedEntity) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botmemory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botmemory = _a.sent();
                        // Check if entity buckets values
                        if (predictedEntity.metadata.isBucket) {
                            if (!botmemory.entityMap[predictedEntity.entityName]) {
                                botmemory.entityMap[predictedEntity.entityName] = [];
                            }
                            botmemory.entityMap[predictedEntity.entityName].push(predictedEntity.entityText);
                        }
                        else {
                            botmemory.entityMap[predictedEntity.entityName] = predictedEntity.entityText;
                        }
                        return [4 /*yield*/, this.Set(botmemory)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // TODO - this old remember functions can likely go away
    BotMemory.Remember = function (entityId, entityName, entityValue) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botmemory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botmemory = _a.sent();
                        // Check if entity buckets values
                        if (entityName && entityName.startsWith(Consts_1.ActionCommand.BUCKET)) {
                            if (!botmemory.entityMap[entityName]) {
                                botmemory.entityMap[entityName] = [];
                            }
                            botmemory.entityMap[entityName].push(entityValue);
                        }
                        else {
                            botmemory.entityMap[entityName] = entityValue;
                        }
                        return [4 /*yield*/, this.Set(botmemory)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotMemory.RememberByName = function (entityName, entityValue) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityId;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.memory.EntityLookup().ToId(entityName)];
                    case 1:
                        entityId = _a.sent();
                        if (!entityId) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.Remember(entityId, entityName, entityValue)];
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
    BotMemory.RememberById = function (entityId, entityValue) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityName;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.memory.EntityLookup().ToName(entityId)];
                    case 1:
                        entityName = _a.sent();
                        if (!entityName) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.Remember(entityId, entityName, entityValue)];
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
    /** Return array of entity names for which I've remembered something */
    BotMemory.RememberedNames = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botmemory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botmemory = _a.sent();
                        return [2 /*return*/, Object.keys(botmemory.entityMap)];
                }
            });
        });
    };
    /** Forget an entity by Id */
    BotMemory.ForgetEntity = function (predictedEntity) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botmemory, lowerCaseNames, index, error_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.Get()];
                    case 1:
                        botmemory = _a.sent();
                        if (predictedEntity.metadata.isBucket) {
                            lowerCaseNames = botmemory.entityMap[predictedEntity.entityName].map(function (value) {
                                return value.toLowerCase();
                            });
                            index = lowerCaseNames.indexOf(predictedEntity.entityText.toLowerCase());
                            if (index > -1) {
                                botmemory.entityMap[predictedEntity.entityName].splice(index, 1);
                                if (botmemory.entityMap[predictedEntity.entityName].length == 0) {
                                    delete botmemory.entityMap[predictedEntity.entityName];
                                }
                            }
                        }
                        else {
                            delete botmemory.entityMap[predictedEntity.entityName];
                        }
                        return [4 /*yield*/, this.Set(botmemory)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /** Forget an entity by Id */
    BotMemory.Forget = function (entityId, entityName, entityValue) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botmemory, lowerCaseNames, index, error_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.Get()];
                    case 1:
                        botmemory = _a.sent();
                        if (entityName.startsWith(Consts_1.ActionCommand.BUCKET)) {
                            lowerCaseNames = botmemory.entityMap[entityName].map(function (value) {
                                return value.toLowerCase();
                            });
                            index = lowerCaseNames.indexOf(entityValue.toLowerCase());
                            if (index > -1) {
                                botmemory.entityMap[entityName].splice(index, 1);
                                if (botmemory.entityMap[entityName].length == 0) {
                                    delete botmemory.entityMap[entityName];
                                }
                            }
                        }
                        else {
                            delete botmemory.entityMap[entityName];
                        }
                        return [4 /*yield*/, this.Set(botmemory)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /** Forget an entity */
    BotMemory.ForgetByName = function (entityName, entityValue) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityId;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.memory.EntityLookup().ToId(entityName)];
                    case 1:
                        entityId = _a.sent();
                        if (!entityId) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.Forget(entityId, entityName, entityValue)];
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
    BotMemory.ForgetById = function (entityId, entityValue) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityName;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.memory.EntityLookup().ToName(entityId)];
                    case 1:
                        entityName = _a.sent();
                        if (!entityName) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.Forget(entityId, entityName, entityValue)];
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
    //--------------------------------------------------------
    // SUBSTITUTIONS
    //--------------------------------------------------------
    BotMemory.EntityValue = function (entityName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botmemory, value, group, key, index, prefix;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botmemory = _a.sent();
                        value = botmemory.entityMap[entityName];
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
    BotMemory.GetEntities = function (text) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entities, words, _i, words_1, word, entityName, entityValue;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        entities = [];
                        words = this.Split(text);
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
    BotMemory.SubstituteEntities = function (text) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var words, _i, words_2, word, entityName, entityValue;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        words = this.Split(text);
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
    BotMemory.SubstituteBrackets = function (text) {
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
    BotMemory.Split = function (action) {
        return action.split(/[\s,:.?!\[\]]+/);
    };
    BotMemory.Substitute = function (text) {
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
    BotMemory.MEMKEY = "BOTMEMORY";
    return BotMemory;
}());
exports.BotMemory = BotMemory;
//# sourceMappingURL=BotMemory.js.map