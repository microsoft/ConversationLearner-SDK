"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Consts_1 = require("../Model/Consts");
var BlisDebug_1 = require("../BlisDebug");
var blis_models_1 = require("blis-models");
var EntityMemory = (function () {
    function EntityMemory(id, value, bucket) {
        if (value === void 0) { value = null; }
        if (bucket === void 0) { bucket = []; }
        this.id = id;
        this.value = value;
        this.bucket = bucket;
    }
    ;
    return EntityMemory;
}());
exports.EntityMemory = EntityMemory;
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
    /** Remember a predicted entity */
    BotMemory.RememberEntity = function (predictedEntity) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Remember(predictedEntity.entityName, predictedEntity.entityId, predictedEntity.entityText)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Remember value for an entity
    BotMemory.Remember = function (entityName, entityId, entityValue) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botmemory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botmemory = _a.sent();
                        if (!botmemory.entityMap[entityName]) {
                            botmemory.entityMap[entityName] = new EntityMemory(entityId);
                        }
                        // Check if entity buckets values
                        if (entityName && entityName.startsWith(Consts_1.ActionCommand.BUCKET)) {
                            botmemory.entityMap[entityName].bucket.push(entityValue);
                        }
                        else {
                            botmemory.entityMap[entityName].value = entityValue;
                        }
                        return [4 /*yield*/, this.Set(botmemory)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
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
    /** Return array of entity Ids for which I've remembered something */
    BotMemory.RememberedIds = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botmemory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botmemory = _a.sent();
                        return [2 /*return*/, Object.keys(botmemory.entityMap).map(function (val) { return botmemory.entityMap[val].id; })];
                }
            });
        });
    };
    /** Forget a predicted Entity */
    BotMemory.ForgetEntity = function (predictedEntity) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Forget(predictedEntity.entityName, predictedEntity.entityText)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Forget an entity value */
    BotMemory.Forget = function (entityName, entityValue) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botmemory, lowerCaseNames, index, error_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.Get()];
                    case 1:
                        botmemory = _a.sent();
                        if (entityName.startsWith(Consts_1.ActionCommand.BUCKET)) {
                            lowerCaseNames = botmemory.entityMap[entityName].bucket.map(function (value) {
                                return value.toLowerCase();
                            });
                            index = lowerCaseNames.indexOf(entityValue.toLowerCase());
                            if (index > -1) {
                                botmemory.entityMap[entityName].bucket.splice(index, 1);
                                if (botmemory.entityMap[entityName].bucket.length == 0) {
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
                        error_1 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BotMemory.DumpMemory = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botmemory, memory, entityName;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botmemory = _a.sent();
                        memory = [];
                        for (entityName in botmemory.entityMap) {
                            memory.push(new blis_models_1.Memory({ entityName: entityName, entityValue: this.EntityValue(botmemory, entityName) }));
                        }
                        return [2 /*return*/, memory];
                }
            });
        });
    };
    //--------------------------------------------------------
    // SUBSTITUTIONS
    //--------------------------------------------------------
    BotMemory.EntityValue = function (botmemory, entityName) {
        if (botmemory.entityMap[entityName].value) {
            return botmemory.entityMap[entityName].value;
        }
        // Print out list in friendly manner
        var group = "";
        for (var key in botmemory.entityMap[entityName].bucket) {
            var index = +key;
            var prefix = "";
            if (botmemory.entityMap[entityName].bucket.length != 1 && index == botmemory.entityMap[entityName].bucket.length - 1) {
                prefix = " and ";
            }
            else if (index != 0) {
                prefix = ", ";
            }
            group += "" + prefix + botmemory.entityMap[entityName].bucket[key];
        }
        return group;
    };
    BotMemory.GetEntities = function (text) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entities, botmemory, words, _i, words_1, word, entityName, entityValue;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        entities = [];
                        return [4 /*yield*/, this.Get()];
                    case 1:
                        botmemory = _a.sent();
                        words = this.Split(text);
                        for (_i = 0, words_1 = words; _i < words_1.length; _i++) {
                            word = words_1[_i];
                            if (word.startsWith(Consts_1.ActionCommand.SUBSTITUTE)) {
                                entityName = word.substr(1, word.length - 1);
                                entityValue = this.EntityValue(botmemory, entityName);
                                if (entityValue) {
                                    entities.push({
                                        type: entityName,
                                        entity: entityValue
                                    });
                                    text = text.replace(word, entityValue);
                                }
                            }
                        }
                        return [2 /*return*/, entities];
                }
            });
        });
    };
    BotMemory.SubstituteEntities = function (text) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var words, botmemory, _i, words_2, word, entityName, entityValue;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        words = this.Split(text);
                        return [4 /*yield*/, this.Get()];
                    case 1:
                        botmemory = _a.sent();
                        for (_i = 0, words_2 = words; _i < words_2.length; _i++) {
                            word = words_2[_i];
                            if (word.startsWith(Consts_1.ActionCommand.SUBSTITUTE)) {
                                entityName = word.substr(1, word.length - 1);
                                entityValue = this.EntityValue(botmemory, entityName);
                                if (entityValue) {
                                    text = text.replace(word, entityValue);
                                }
                            }
                        }
                        return [2 /*return*/, text];
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
                    case 0: return [4 /*yield*/, this.SubstituteEntities(text)];
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