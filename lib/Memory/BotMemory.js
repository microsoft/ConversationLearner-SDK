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
    BotMemory.Get = function (blisMemory) {
        if (!BotMemory._instance) {
            BotMemory._instance = new BotMemory();
        }
        BotMemory._instance.memory = blisMemory;
        return BotMemory._instance;
    };
    BotMemory.prototype.Init = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var data;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.memory) {
                            throw new Error("BotMemory called without initialzing memory");
                        }
                        return [4 /*yield*/, this.memory.GetAsync(BotMemory.MEMKEY)];
                    case 1:
                        data = _a.sent();
                        if (data) {
                            this.Deserialize(data);
                        }
                        else {
                            this.Clear();
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    BotMemory.prototype.Serialize = function () {
        return JSON.stringify(this);
    };
    BotMemory.prototype.Deserialize = function (text) {
        if (!text)
            return null;
        var json = JSON.parse(text);
        this.entityMap = json.entityMap ? json.entityMap : {};
    };
    BotMemory.prototype.Set = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.memory) {
                            throw new Error("BotMemory called without initialzing memory");
                        }
                        return [4 /*yield*/, this.memory.SetAsync(BotMemory.MEMKEY, this.Serialize())];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotMemory.prototype.Clear = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.entityMap = {};
                        return [4 /*yield*/, this.Set()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Remember a predicted entity */
    BotMemory.prototype.RememberEntity = function (predictedEntity) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var isBucket;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        isBucket = predictedEntity.metadata ? predictedEntity.metadata.isBucket : false;
                        return [4 /*yield*/, this.Remember(predictedEntity.entityName, predictedEntity.entityId, predictedEntity.entityText, isBucket)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Remember value for an entity
    BotMemory.prototype.Remember = function (entityName, entityId, entityValue, isBucket) {
        if (isBucket === void 0) { isBucket = false; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Init()];
                    case 1:
                        _a.sent();
                        if (!this.entityMap[entityName]) {
                            this.entityMap[entityName] = new EntityMemory(entityId);
                        }
                        // Check if entity buckets values
                        if (isBucket) {
                            // Add if not a duplicate
                            if (this.entityMap[entityName].bucket.indexOf(entityValue) < 0) {
                                this.entityMap[entityName].bucket.push(entityValue);
                            }
                        }
                        else {
                            this.entityMap[entityName].value = entityValue;
                        }
                        return [4 /*yield*/, this.Set()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Return array of entity names for which I've remembered something */
    BotMemory.prototype.RememberedNames = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Init()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, Object.keys(this.entityMap)];
                }
            });
        });
    };
    /** Return array of entity Ids for which I've remembered something */
    BotMemory.prototype.RememberedIds = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Init()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, Object.keys(this.entityMap).map(function (val) { return _this.entityMap[val].id; })];
                }
            });
        });
    };
    /** Given negative entity name, return positive version **/
    BotMemory.prototype.PositiveName = function (negativeName) {
        if (negativeName.startsWith(exports.ActionCommand.NEGATIVE)) {
            return negativeName.slice(1);
        }
        return null;
    };
    /** Forget a predicted Entity */
    BotMemory.prototype.ForgetEntity = function (predictedEntity) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var isBucket, posName;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        isBucket = predictedEntity.metadata ? predictedEntity.metadata.isBucket : false;
                        posName = this.PositiveName(predictedEntity.entityName);
                        if (!posName) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.Forget(posName, predictedEntity.entityText, isBucket)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /** Forget an entity value */
    BotMemory.prototype.Forget = function (entityName, entityValue, isBucket) {
        if (entityValue === void 0) { entityValue = null; }
        if (isBucket === void 0) { isBucket = false; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var lowerCaseNames, index, error_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        // Check if entity buckets values
                        return [4 /*yield*/, this.Init()];
                    case 1:
                        // Check if entity buckets values
                        _a.sent();
                        if (isBucket) {
                            // Entity might not be in memory
                            if (!this.entityMap[entityName]) {
                                return [2 /*return*/];
                            }
                            // If no entity Value provide, clear the entity
                            if (!entityValue) {
                                delete this.entityMap[entityName];
                            }
                            else {
                                lowerCaseNames = this.entityMap[entityName].bucket.map(function (value) {
                                    return value.toLowerCase();
                                });
                                index = lowerCaseNames.indexOf(entityValue.toLowerCase());
                                if (index > -1) {
                                    this.entityMap[entityName].bucket.splice(index, 1);
                                    if (this.entityMap[entityName].bucket.length == 0) {
                                        delete this.entityMap[entityName];
                                    }
                                }
                            }
                        }
                        else {
                            delete this.entityMap[entityName];
                        }
                        return [4 /*yield*/, this.Set()];
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
    BotMemory.prototype.DumpMemory = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, entityName;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Check if entity buckets values
                    return [4 /*yield*/, this.Init()];
                    case 1:
                        // Check if entity buckets values
                        _a.sent();
                        memory = [];
                        for (entityName in this.entityMap) {
                            memory.push(new blis_models_1.Memory({ entityName: entityName, entityValues: this.EntityValueAsList(entityName) }));
                        }
                        return [2 /*return*/, memory];
                }
            });
        });
    };
    BotMemory.prototype.Value = function (entityName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Init()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.EntityValueAsString(entityName)];
                }
            });
        });
    };
    BotMemory.prototype.ValueAsList = function (entityName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Init()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.EntityValueAsList(entityName)];
                }
            });
        });
    };
    //--------------------------------------------------------
    // SUBSTITUTIONS
    //--------------------------------------------------------
    BotMemory.prototype.EntityValueAsList = function (entityName) {
        if (!this.entityMap[entityName]) {
            return [];
        }
        if (this.entityMap[entityName].value) {
            return [this.entityMap[entityName].value];
        }
        return this.entityMap[entityName].bucket;
    };
    BotMemory.prototype.EntityValueAsString = function (entityName) {
        if (!this.entityMap[entityName]) {
            return null;
        }
        if (this.entityMap[entityName].value) {
            return this.entityMap[entityName].value;
        }
        // Print out list in friendly manner
        var group = "";
        for (var key in this.entityMap[entityName].bucket) {
            var index = +key;
            var prefix = "";
            if (this.entityMap[entityName].bucket.length != 1 && index == this.entityMap[entityName].bucket.length - 1) {
                prefix = " and ";
            }
            else if (index != 0) {
                prefix = ", ";
            }
            group += "" + prefix + this.entityMap[entityName].bucket[key];
        }
        return group;
    };
    BotMemory.prototype.GetEntities = function (text) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entities, words, _i, words_1, word, entityName, entityValue;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        entities = [];
                        return [4 /*yield*/, this.Init()];
                    case 1:
                        _a.sent();
                        words = this.Split(text);
                        for (_i = 0, words_1 = words; _i < words_1.length; _i++) {
                            word = words_1[_i];
                            if (word.startsWith(exports.ActionCommand.SUBSTITUTE)) {
                                entityName = word.substr(1, word.length - 1);
                                entityValue = this.EntityValueAsString(entityName);
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
    BotMemory.prototype.SubstituteEntities = function (text) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var words, _i, words_2, word, entityName, entityValue;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        words = this.Split(text);
                        return [4 /*yield*/, this.Init()];
                    case 1:
                        _a.sent();
                        for (_i = 0, words_2 = words; _i < words_2.length; _i++) {
                            word = words_2[_i];
                            if (word.startsWith(exports.ActionCommand.SUBSTITUTE)) {
                                entityName = word.substr(1, word.length - 1);
                                entityValue = this.EntityValueAsString(entityName);
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
    BotMemory.prototype.SubstituteBrackets = function (text) {
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
    BotMemory.prototype.Split = function (action) {
        return action.split(/[\s,:.?!\[\]]+/);
    };
    BotMemory.prototype.Substitute = function (text) {
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
    BotMemory._instance = null;
    BotMemory.MEMKEY = "BOTMEMORY";
    return BotMemory;
}());
exports.BotMemory = BotMemory;
//# sourceMappingURL=BotMemory.js.map