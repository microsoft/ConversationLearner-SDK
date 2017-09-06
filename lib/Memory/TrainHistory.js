"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var TrainStep_1 = require("./TrainStep");
var Consts_1 = require("../Model/Consts");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var json_typescript_mapper_2 = require("json-typescript-mapper");
var TrainHistory = (function () {
    function TrainHistory(init) {
        this.curStep = null;
        this.lastStep = null;
        this.allSteps = [];
        Object.assign(this, init);
    }
    TrainHistory.prototype.Serialize = function () {
        return JSON.stringify(this);
    };
    TrainHistory.Deserialize = function (type, text) {
        if (!text)
            return null;
        var json = JSON.parse(text);
        var trainHistory = json_typescript_mapper_1.deserialize(TrainHistory, json);
        if (!trainHistory.allSteps) {
            trainHistory.allSteps = [];
        }
        return trainHistory;
    };
    TrainHistory.Get = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var data;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.memory) {
                            throw new Error("TrainHistory called without initialzing memory");
                        }
                        return [4 /*yield*/, this.memory.GetAsync(this.MEMKEY)];
                    case 1:
                        data = _a.sent();
                        if (data) {
                            return [2 /*return*/, TrainHistory.Deserialize(TrainHistory, data)];
                        }
                        return [2 /*return*/, new TrainHistory()];
                }
            });
        });
    };
    TrainHistory.Set = function (trainHistory) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.memory) {
                            throw new Error("TrainHistory called without initialzing memory");
                        }
                        if (!trainHistory) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.memory.SetAsync(this.MEMKEY, trainHistory.Serialize())];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.memory.DeleteAsync(this.MEMKEY)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    TrainHistory.Clear = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var trainHistory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        trainHistory = new TrainHistory();
                        return [4 /*yield*/, this.Set(trainHistory)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    TrainHistory.ClearLastStep = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var trainHistory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        trainHistory = _a.sent();
                        trainHistory.lastStep = null;
                        return [4 /*yield*/, this.Set(trainHistory)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    TrainHistory.ToString = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var trainHistory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        trainHistory = _a.sent();
                        return [2 /*return*/, JSON.stringify(trainHistory)];
                }
            });
        });
    };
    TrainHistory.SetStep = function (saveStep, value) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var trainHistory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        trainHistory = _a.sent();
                        if (!trainHistory.curStep) {
                            trainHistory.curStep = new TrainStep_1.TrainStep();
                        }
                        if (saveStep == Consts_1.SaveStep.INPUT) {
                            trainHistory.curStep[Consts_1.SaveStep.INPUT] = value;
                        }
                        else if (saveStep == Consts_1.SaveStep.ENTITY) {
                            trainHistory.curStep[Consts_1.SaveStep.ENTITY] = value;
                        }
                        else if (saveStep == Consts_1.SaveStep.RESPONSES) {
                            // Can be mulitple Response steps
                            trainHistory.curStep[Consts_1.SaveStep.RESPONSES].push(value);
                        }
                        else if (saveStep = Consts_1.SaveStep.APICALLS) {
                            // Can be mulitple API steps
                            trainHistory.curStep[Consts_1.SaveStep.APICALLS].push(value);
                        }
                        else {
                            console.log("Unknown SaveStep value " + saveStep);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.Set(trainHistory)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    TrainHistory.SetLastStep = function (saveStep, value) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var trainHistory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        trainHistory = _a.sent();
                        if (trainHistory.lastStep == null) {
                            trainHistory.lastStep = new TrainStep_1.TrainStep();
                        }
                        if (saveStep == Consts_1.SaveStep.RESPONSES) {
                            // Can be mulitple Response steps
                            trainHistory.lastStep[Consts_1.SaveStep.RESPONSES].push(value);
                        }
                        else if (saveStep == Consts_1.SaveStep.APICALLS) {
                            // Can be mulitple API steps
                            trainHistory.lastStep[Consts_1.SaveStep.APICALLS].push(value);
                        }
                        else {
                            trainHistory.lastStep[saveStep] = value;
                        }
                        return [4 /*yield*/, this.Set(trainHistory)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    TrainHistory.LastStep = function (saveStep) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var trainHistory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        trainHistory = _a.sent();
                        if (!trainHistory.lastStep) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, trainHistory.lastStep[saveStep]];
                }
            });
        });
    };
    /** Returns input of current train step */
    TrainHistory.CurrentInput = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var trainHistory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        trainHistory = _a.sent();
                        if (trainHistory.curStep) {
                            return [2 /*return*/, trainHistory.curStep[Consts_1.SaveStep.INPUT]];
                        }
                        return [2 /*return*/, null];
                }
            });
        });
    };
    /** Push current training step onto the training step history */
    TrainHistory.FinishStep = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var trainHistory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        trainHistory = _a.sent();
                        if (!trainHistory.curStep)
                            return [2 /*return*/];
                        if (!trainHistory.allSteps) {
                            trainHistory.allSteps = [];
                        }
                        trainHistory.allSteps.push(trainHistory.curStep);
                        trainHistory.curStep = null;
                        return [4 /*yield*/, this.Set(trainHistory)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    TrainHistory.Steps = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var trainHistory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        trainHistory = _a.sent();
                        return [2 /*return*/, trainHistory.allSteps];
                }
            });
        });
    };
    // TODO: Obsolete with new UI?
    TrainHistory.MEMKEY = "TRAINHISTORY";
    tslib_1.__decorate([
        json_typescript_mapper_2.JsonProperty({ clazz: TrainStep_1.TrainStep, name: 'curStep' }),
        tslib_1.__metadata("design:type", TrainStep_1.TrainStep)
    ], TrainHistory.prototype, "curStep", void 0);
    tslib_1.__decorate([
        json_typescript_mapper_2.JsonProperty({ clazz: TrainStep_1.TrainStep, name: 'lastStep' }),
        tslib_1.__metadata("design:type", TrainStep_1.TrainStep)
    ], TrainHistory.prototype, "lastStep", void 0);
    tslib_1.__decorate([
        json_typescript_mapper_2.JsonProperty({ clazz: TrainStep_1.TrainStep, name: 'allSteps' }),
        tslib_1.__metadata("design:type", Array)
    ], TrainHistory.prototype, "allSteps", void 0);
    return TrainHistory;
}());
exports.TrainHistory = TrainHistory;
//# sourceMappingURL=TrainHistory.js.map