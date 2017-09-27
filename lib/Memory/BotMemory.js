"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var BlisDebug_1 = require("../BlisDebug");
var blis_models_1 = require("blis-models");
exports.ActionCommand = {
    SUBSTITUTE: "$",
    NEGATIVE: "~"
};
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
    // Remember value for an entity
    BotMemory.Remember = function (entityName, entityId, entityValue, isBucket) {
        if (isBucket === void 0) { isBucket = false; }
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
                        if (isBucket) {
                            // Add if not a duplicate
                            if (botmemory.entityMap[entityName].bucket.indexOf(entityValue) < 0) {
                                botmemory.entityMap[entityName].bucket.push(entityValue);
                            }
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
    /** Forget an entity value */
    BotMemory.Forget = function (entityName, entityValue, isBucket) {
        if (entityValue === void 0) { entityValue = null; }
        if (isBucket === void 0) { isBucket = false; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botmemory, lowerCaseNames, index, error_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.Get()];
                    case 1:
                        botmemory = _a.sent();
                        if (isBucket) {
                            // Entity might not be in memory
                            if (!botmemory.entityMap[entityName]) {
                                return [2 /*return*/];
                            }
                            // If no entity Value provide, clear the entity
                            if (!entityValue) {
                                delete botmemory.entityMap[entityName];
                            }
                            else {
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
                            memory.push(new blis_models_1.Memory({ entityName: entityName, entityValue: this.EntityValueAsString(botmemory, entityName) }));
                        }
                        return [2 /*return*/, memory];
                }
            });
        });
    };
    BotMemory.Value = function (entityName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botMemory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botMemory = _a.sent();
                        return [2 /*return*/, this.EntityValueAsString(botMemory, entityName)];
                }
            });
        });
    };
    BotMemory.ValueAsList = function (entityName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var botMemory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        botMemory = _a.sent();
                        return [2 /*return*/, this.EntityValueAsList(botMemory, entityName)];
                }
            });
        });
    };
    //--------------------------------------------------------
    // SUBSTITUTIONS
    //--------------------------------------------------------
    BotMemory.EntityValueAsList = function (botmemory, entityName) {
        if (!botmemory.entityMap[entityName]) {
            return [];
        }
        if (botmemory.entityMap[entityName].value) {
            return [botmemory.entityMap[entityName].value];
        }
        return botmemory.entityMap[entityName].bucket;
    };
    BotMemory.EntityValueAsString = function (botmemory, entityName) {
        if (!botmemory.entityMap[entityName]) {
            return null;
        }
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
                            if (word.startsWith(exports.ActionCommand.SUBSTITUTE)) {
                                entityName = word.substr(1, word.length - 1);
                                entityValue = this.EntityValueAsString(botmemory, entityName);
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
                            if (word.startsWith(exports.ActionCommand.SUBSTITUTE)) {
                                entityName = word.substr(1, word.length - 1);
                                entityValue = this.EntityValueAsString(botmemory, entityName);
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
        if (phrase.indexOf(exports.ActionCommand.SUBSTITUTE) > 0) {
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