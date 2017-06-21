"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var BlisDebug_1 = require("../BlisDebug");
var BlisClient_1 = require("../BlisClient");
var Command_1 = require("./Command");
var Utils_1 = require("../Utils");
var Action_1 = require("./Action");
var Entity_1 = require("./Entity");
var Menu_1 = require("../Menu");
var Pager_1 = require("../Memory/Pager");
var LabelEntity = (function () {
    function LabelEntity(init) {
        this.startCharIndex = undefined;
        this.endCharIndex = undefined;
        this.entityId = undefined;
        this.entityText = undefined;
        Object.assign(this, init);
    }
    return LabelEntity;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('startCharIndex'),
    tslib_1.__metadata("design:type", Number)
], LabelEntity.prototype, "startCharIndex", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('endCharIndex'),
    tslib_1.__metadata("design:type", Number)
], LabelEntity.prototype, "endCharIndex", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('entityId'),
    tslib_1.__metadata("design:type", String)
], LabelEntity.prototype, "entityId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('entityText'),
    tslib_1.__metadata("design:type", String)
], LabelEntity.prototype, "entityText", void 0);
exports.LabelEntity = LabelEntity;
var TextVariation = (function () {
    function TextVariation(init) {
        this.text = undefined;
        this.labelEntities = undefined;
        Object.assign(this, init);
    }
    return TextVariation;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('text'),
    tslib_1.__metadata("design:type", String)
], TextVariation.prototype, "text", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: LabelEntity, name: 'labelEntities' }),
    tslib_1.__metadata("design:type", Array)
], TextVariation.prototype, "labelEntities", void 0);
exports.TextVariation = TextVariation;
var ExtractorStep = (function () {
    function ExtractorStep(init) {
        this.textVariations = undefined;
        Object.assign(this, init);
    }
    return ExtractorStep;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: TextVariation, name: 'textVariations' }),
    tslib_1.__metadata("design:type", Array)
], ExtractorStep.prototype, "textVariations", void 0);
exports.ExtractorStep = ExtractorStep;
var Input = (function () {
    function Input(init) {
        this.filledEntities = undefined;
        this.contextRaw = undefined;
        this.maskedActions = undefined;
        Object.assign(this, init);
    }
    return Input;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('filledEntities'),
    tslib_1.__metadata("design:type", Array)
], Input.prototype, "filledEntities", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('context'),
    tslib_1.__metadata("design:type", String)
], Input.prototype, "contextRaw", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('maskedActions'),
    tslib_1.__metadata("design:type", Array)
], Input.prototype, "maskedActions", void 0);
exports.Input = Input;
var ScorerStep = (function () {
    function ScorerStep(init) {
        this.input = undefined;
        this.labelAction = undefined;
        Object.assign(this, init);
    }
    return ScorerStep;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Input, name: 'input' }),
    tslib_1.__metadata("design:type", Input)
], ScorerStep.prototype, "input", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('labelAction'),
    tslib_1.__metadata("design:type", String)
], ScorerStep.prototype, "labelAction", void 0);
exports.ScorerStep = ScorerStep;
var Round = (function () {
    function Round(init) {
        this.extractorStep = undefined;
        this.scorerSteps = undefined;
        Object.assign(this, init);
    }
    return Round;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: ExtractorStep, name: 'input' }),
    tslib_1.__metadata("design:type", ExtractorStep)
], Round.prototype, "extractorStep", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: ScorerStep, name: 'output' }),
    tslib_1.__metadata("design:type", Array)
], Round.prototype, "scorerSteps", void 0);
exports.Round = Round;
var TrainDialog = (function () {
    function TrainDialog(init) {
        this.trainDialogId = undefined;
        this.version = undefined;
        this.packageCreationId = undefined;
        this.packageDeletionId = undefined;
        this.rounds = undefined;
        Object.assign(this, init);
    }
    return TrainDialog;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('trainDialogId'),
    tslib_1.__metadata("design:type", String)
], TrainDialog.prototype, "trainDialogId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('version'),
    tslib_1.__metadata("design:type", Number)
], TrainDialog.prototype, "version", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('packageCreationId'),
    tslib_1.__metadata("design:type", Number)
], TrainDialog.prototype, "packageCreationId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('packageDeletionId'),
    tslib_1.__metadata("design:type", Number)
], TrainDialog.prototype, "packageDeletionId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Round, name: 'rounds' }),
    tslib_1.__metadata("design:type", Array)
], TrainDialog.prototype, "rounds", void 0);
exports.TrainDialog = TrainDialog;
// ================== V1 ===============================================
var TextEntity_v1 = (function () {
    function TextEntity_v1(init) {
        this.endToken = undefined;
        this.entityId = undefined;
        this.startToken = undefined;
        Object.assign(this, init);
    }
    return TextEntity_v1;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('EndToken'),
    tslib_1.__metadata("design:type", Number)
], TextEntity_v1.prototype, "endToken", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('EntityType'),
    tslib_1.__metadata("design:type", String)
], TextEntity_v1.prototype, "entityId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('StartToken'),
    tslib_1.__metadata("design:type", Number)
], TextEntity_v1.prototype, "startToken", void 0);
exports.TextEntity_v1 = TextEntity_v1;
var AltText_v1 = (function () {
    function AltText_v1(init) {
        this.text = undefined;
        this.textEntities = undefined;
        Object.assign(this, init);
    }
    return AltText_v1;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('text'),
    tslib_1.__metadata("design:type", String)
], AltText_v1.prototype, "text", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: TextEntity_v1, name: 'text-entities' }),
    tslib_1.__metadata("design:type", Array)
], AltText_v1.prototype, "textEntities", void 0);
exports.AltText_v1 = AltText_v1;
var Input_v1 = (function () {
    function Input_v1(init) {
        this.context = undefined;
        this.entityIds = undefined;
        this.maskedActionIds = undefined;
        this.text = undefined;
        this.textAlts = undefined;
        this.textEntities = undefined;
        Object.assign(this, init);
    }
    Input_v1.prototype.toText = function (appId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var text, _i, _a, entityId, entityName, entityValue, _b, _c, alt;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!this.text) return [3 /*break*/, 5];
                        text = "" + this.text;
                        _i = 0, _a = this.entityIds;
                        _d.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        entityId = _a[_i];
                        return [4 /*yield*/, Entity_1.Entity_v1.toText(appId, entityId)];
                    case 2:
                        entityName = _d.sent();
                        entityValue = this.EntityValue(entityId);
                        if (entityValue) {
                            text += " [" + entityName + " " + entityValue + "]";
                        }
                        else {
                            text += " [" + entityName + "]";
                        }
                        _d.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        for (_b = 0, _c = this.textAlts; _b < _c.length; _b++) {
                            alt = _c[_b];
                            text += "\n\n-- " + alt.text;
                        }
                        return [2 /*return*/, text];
                    case 5: return [2 /*return*/, null];
                }
            });
        });
    };
    Input_v1.prototype.EntityValue = function (entityId) {
        for (var _i = 0, _a = this.textEntities; _i < _a.length; _i++) {
            var textEntity = _a[_i];
            if (textEntity.entityId == entityId) {
                return this.text.slice(textEntity.startToken, textEntity.endToken + 1);
            }
        }
    };
    return Input_v1;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('context'),
    tslib_1.__metadata("design:type", Object)
], Input_v1.prototype, "context", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('entities'),
    tslib_1.__metadata("design:type", Array)
], Input_v1.prototype, "entityIds", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('masked-actions'),
    tslib_1.__metadata("design:type", Array)
], Input_v1.prototype, "maskedActionIds", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('text'),
    tslib_1.__metadata("design:type", String)
], Input_v1.prototype, "text", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: AltText_v1, name: 'text-alts' }),
    tslib_1.__metadata("design:type", Array)
], Input_v1.prototype, "textAlts", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: TextEntity_v1, name: 'text-entities' }),
    tslib_1.__metadata("design:type", Array)
], Input_v1.prototype, "textEntities", void 0);
exports.Input_v1 = Input_v1;
var Turn_v1 = (function () {
    function Turn_v1(init) {
        this.input = undefined;
        this.actionId = undefined;
        Object.assign(this, init);
    }
    Turn_v1.prototype.toText = function (appId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var inputText, actionText;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.input.toText(appId)];
                    case 1:
                        inputText = _a.sent();
                        return [4 /*yield*/, Action_1.Action_v1.toText(appId, this.actionId)];
                    case 2:
                        actionText = _a.sent();
                        if (inputText) {
                            return [2 /*return*/, inputText + "\n\n     " + actionText];
                        }
                        return [2 /*return*/, "     " + actionText];
                }
            });
        });
    };
    return Turn_v1;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Input_v1, name: 'input' }),
    tslib_1.__metadata("design:type", Input_v1)
], Turn_v1.prototype, "input", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('output'),
    tslib_1.__metadata("design:type", String)
], Turn_v1.prototype, "actionId", void 0);
exports.Turn_v1 = Turn_v1;
var Dialog_v1 = (function () {
    function Dialog_v1(init) {
        this.turns = undefined;
        Object.assign(this, init);
    }
    Dialog_v1.prototype.toText = function (appId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var text, _a, _b, _i, i, turn, turnText, index;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        text = "";
                        _a = [];
                        for (_b in this.turns)
                            _a.push(_b);
                        _i = 0;
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        i = _a[_i];
                        turn = this.turns[i];
                        return [4 /*yield*/, turn.toText(appId)];
                    case 2:
                        turnText = _c.sent();
                        index = "(" + (+i + 1) + ") ";
                        text += "" + index + turnText + "\n\n";
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, text];
                }
            });
        });
    };
    return Dialog_v1;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Turn_v1, name: 'turns' }),
    tslib_1.__metadata("design:type", Array)
], Dialog_v1.prototype, "turns", void 0);
exports.Dialog_v1 = Dialog_v1;
var TrainDialog_v1 = (function () {
    function TrainDialog_v1(init) {
        this.id = undefined;
        this.dialog = undefined;
        Object.assign(this, init);
    }
    TrainDialog_v1.prototype.toText = function (appId, number) {
        if (number === void 0) { number = false; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var dialogText;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.dialog.toText(appId)];
                    case 1:
                        dialogText = _a.sent();
                        return [2 /*return*/, "" + dialogText];
                }
            });
        });
    };
    TrainDialog_v1.Edit = function (context, args, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, dialogId, turnNum, input, memory, appId, error, trainDialog, turn, altTexts, nextText, cards_1;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = args.split(" "), dialogId = _a[0], turnNum = _a[1];
                        input = Utils_1.Utils.RemoveWords(args, 2);
                        turnNum = +turnNum - 1; // 0-based array
                        memory = context.Memory();
                        return [4 /*yield*/, memory.BotState().AppId()
                            // Error checking
                        ];
                    case 1:
                        appId = _b.sent();
                        error = null;
                        if (!!dialogId) return [3 /*break*/, 2];
                        error = "Must specify dialogId";
                        return [3 /*break*/, 8];
                    case 2:
                        if (!(turnNum < 0)) return [3 /*break*/, 3];
                        error = "Expecting turn number";
                        return [3 /*break*/, 8];
                    case 3:
                        if (!!input) return [3 /*break*/, 4];
                        error = "Expecting input text";
                        return [3 /*break*/, 8];
                    case 4: return [4 /*yield*/, BlisClient_1.BlisClient.client.GetTrainDialog(appId, dialogId)];
                    case 5:
                        trainDialog = _b.sent();
                        if (!(turnNum >= trainDialog.dialog.turns.length)) return [3 /*break*/, 6];
                        error = "Invalid turn number";
                        return [3 /*break*/, 8];
                    case 6:
                        turn = trainDialog.dialog.turns[turnNum];
                        altTexts = turn.input.textAlts;
                        if (!altTexts)
                            altTexts = [];
                        nextText = new AltText_v1({ text: input });
                        altTexts.push(nextText);
                        trainDialog.dialog.turns[turnNum].input.textAlts = altTexts;
                        // Save
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.EditTrainDialog(appId, dialogId, trainDialog)];
                    case 7:
                        // Save
                        _b.sent();
                        // Show item with new content
                        TrainDialog_v1.Get(context, true, function (responses) {
                            cb(responses);
                        });
                        _b.label = 8;
                    case 8:
                        if (error) {
                            cards_1 = [];
                            cards_1.push(Utils_1.Utils.ErrorCard(error, "Expected input format {turn number} {new input text}"));
                            TrainDialog_v1.Get(context, true, function (responses) {
                                cards_1 = cards_1.concat(responses);
                                cb(cards_1);
                            });
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    TrainDialog_v1.Delete = function (context, dialogId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg, memory, appId, card, error_1, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Training Dialog");
                        if (!dialogId) {
                            msg = "You must provide the ID of the dialog to delete.\n\n     " + Command_1.IntCommands.DELETEDIALOG + " {dialogId}";
                            cb([msg]);
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        memory = context.Memory();
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 2:
                        appId = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.DeleteTrainDialog(appId, dialogId)];
                    case 3:
                        _a.sent();
                        card = Utils_1.Utils.MakeHero("Deleted TrainDialog", null, dialogId, null);
                        cb([card]);
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_1);
                        cb([errMsg]);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    TrainDialog_v1.Get = function (context, refreshCache, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, appId, blisApp, dialogs, _a, _b, _c, index, responses, i, cur, dialog, buttons, error_2, errMsg;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 7, , 8]);
                        memory = context.Memory();
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 1:
                        appId = _d.sent();
                        if (refreshCache) {
                            BlisClient_1.BlisClient.client.ClearExportCache(appId);
                        }
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.ExportApp(appId)];
                    case 2:
                        blisApp = _d.sent();
                        _b = (_a = blisApp).FindTrainDialogs;
                        _c = [appId];
                        return [4 /*yield*/, Pager_1.Pager.SearchTerm(context)];
                    case 3: return [4 /*yield*/, _b.apply(_a, _c.concat([_d.sent()]))];
                    case 4:
                        dialogs = _d.sent();
                        if (dialogs.length == 0) {
                            cb(Menu_1.Menu.AddEditCards(context, ["No dialogs found."]));
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, Pager_1.Pager.SetLength(context, dialogs.length)];
                    case 5:
                        _d.sent();
                        return [4 /*yield*/, Pager_1.Pager.Index(context)];
                    case 6:
                        index = _d.sent();
                        responses = [];
                        for (i in dialogs) {
                            cur = +i;
                            if (cur == index) {
                                dialog = dialogs[i];
                                responses.push(dialog.text);
                                buttons = {
                                    "Prev": Command_1.IntCommands.TRAINDIALOG_PREV,
                                    "Next": Command_1.IntCommands.TRAINDIALOG_NEXT,
                                    "Done": Command_1.IntCommands.EDITAPP,
                                    "Delete": Command_1.IntCommands.DELETEDIALOG + " " + dialog.dialogId,
                                    "Edit": Command_1.CueCommands.ADDALTTEXT + " " + dialog.dialogId,
                                };
                                responses.push(Utils_1.Utils.MakeHero(null, index + 1 + " of " + dialogs.length, null, buttons));
                                break;
                            }
                        }
                        cb(responses);
                        return [3 /*break*/, 8];
                    case 7:
                        error_2 = _d.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_2);
                        cb([errMsg]);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    return TrainDialog_v1;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('id'),
    tslib_1.__metadata("design:type", String)
], TrainDialog_v1.prototype, "id", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Dialog_v1, name: 'dialog' }),
    tslib_1.__metadata("design:type", Dialog_v1)
], TrainDialog_v1.prototype, "dialog", void 0);
exports.TrainDialog_v1 = TrainDialog_v1;
//# sourceMappingURL=TrainDialog.1.js.map