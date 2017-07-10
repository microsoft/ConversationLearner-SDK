"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var builder = require("botbuilder");
var blis_models_1 = require("blis-models");
var BlisRecognizer_1 = require("./BlisRecognizer");
var BlisDebug_1 = require("./BlisDebug");
var Utils_1 = require("./Utils");
var BlisMemory_1 = require("./BlisMemory");
var BlisClient_1 = require("./BlisClient");
var BlisContext_1 = require("./BlisContext");
var Consts_1 = require("./Model/Consts");
var Server_1 = require("./Http/Server");
var AzureFunctions_1 = require("./AzureFunctions");
var BlisDialog = (function (_super) {
    tslib_1.__extends(BlisDialog, _super);
    function BlisDialog(bot, options) {
        var _this = _super.call(this) || this;
        _this.bot = bot;
        _this.options = options;
        try {
            BlisDebug_1.BlisDebug.InitLogger(bot);
            var recognizer = new BlisRecognizer_1.BlisRecognizer();
            _this.recognizers = new builder.IntentRecognizerSet({ recognizers: [recognizer] });
            BlisDebug_1.BlisDebug.Log("Creating client....");
            BlisClient_1.BlisClient.Init(options.serviceUri, options.user, options.secret, options.azureFunctionsUrl, options.azureFunctionsKey);
            BlisMemory_1.BlisMemory.Init(options.redisServer, options.redisKey);
            _this.luisCallback = options.luisCallback;
            _this.apiCallbacks = options.apiCallbacks;
            _this.blisCallback = options.blisCallback;
            // Optional connector, required for downloading train dialogs
            _this.connector = options.connector;
            _this.defaultApp = options.appId;
            Server_1.Server.Init();
        }
        catch (error) {
            BlisDebug_1.BlisDebug.Error(error);
        }
        return _this;
    }
    // Create singleton
    BlisDialog.Init = function (bot, options) {
        this.dialog = new BlisDialog(bot, options);
    };
    /** Called when a new reply message has been received from a user. */
    BlisDialog.prototype.replyReceived = function (session, recognizeResult) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            var locale, context;
            return tslib_1.__generator(this, function (_a) {
                if (!recognizeResult) {
                    locale = session.preferredLocale();
                    context = session.toRecognizeContext();
                    context.dialogData = session.dialogData;
                    context.activeDialog = true;
                    this.recognize(context, function (error, result) {
                        var blisResult = result;
                        try {
                            if (!error) {
                                _this.invokeAnswer(session, blisResult);
                            }
                        }
                        catch (e) {
                            _this.emitError(session, e);
                        }
                    });
                }
                else {
                    this.invokeAnswer(session, recognizeResult);
                }
                return [2 /*return*/];
            });
        });
    };
    /** Parses the users utterance and assigns a score from 0.0 - 1.0 indicating
     * how confident the dialog is that it understood the users utterance.  */
    BlisDialog.prototype.recognize = function (context, cb) {
        this.recognizers.recognize(context, cb);
    };
    BlisDialog.prototype.recognizer = function (plugin) {
        // Append recognizer
        this.recognizers.recognizer(plugin);
        return this;
    };
    BlisDialog.prototype.invokeAnswer = function (session, recognizeResult) {
        var _this = this;
        this.ProcessInput(session, function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/];
            });
        }); });
    };
    BlisDialog.prototype.ProcessInput = function (session, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var context, memory, inTeach, appId, sessionId, userInput, extractResponse, extractResponse, scoreInput, scoreResponse, bestAction;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        context = new BlisContext_1.BlisContext(this.bot, session);
                        memory = context.Memory();
                        return [4 /*yield*/, memory.BotState().InTeach()];
                    case 1:
                        inTeach = _a.sent();
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 2:
                        appId = _a.sent();
                        return [4 /*yield*/, memory.BotState().SessionId()];
                    case 3:
                        sessionId = _a.sent();
                        userInput = new blis_models_1.UserInput(session.message);
                        if (!inTeach) return [3 /*break*/, 5];
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.TeachExtract(appId, sessionId, userInput)];
                    case 4:
                        extractResponse = _a.sent();
                        return [3 /*break*/, 9];
                    case 5: return [4 /*yield*/, BlisClient_1.BlisClient.client.SessionExtract(appId, sessionId, userInput)
                        // Call LUIS callback
                    ];
                    case 6:
                        extractResponse = _a.sent();
                        return [4 /*yield*/, this.CallLuisCallback(extractResponse.text, extractResponse.predictedEntities, memory)];
                    case 7:
                        scoreInput = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.SessionScore(appId, sessionId, scoreInput)];
                    case 8:
                        scoreResponse = _a.sent();
                        bestAction = scoreResponse.scoredActions[0];
                        // Take the action
                        if (bestAction) {
                            this.TakeAction(bestAction, memory);
                        }
                        _a.label = 9;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    BlisDialog.prototype.TakeAction = function (scoredAction, memory) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var session, actionType, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        session = memory.BotState().Session();
                        actionType = scoredAction.metadata.actionType;
                        _a = actionType;
                        switch (_a) {
                            case blis_models_1.ActionTypes.TEXT: return [3 /*break*/, 1];
                            case blis_models_1.ActionTypes.CARD: return [3 /*break*/, 3];
                            case blis_models_1.ActionTypes.INTENT: return [3 /*break*/, 5];
                            case blis_models_1.ActionTypes.API_AZURE: return [3 /*break*/, 7];
                            case blis_models_1.ActionTypes.API_LOCAL: return [3 /*break*/, 9];
                        }
                        return [3 /*break*/, 11];
                    case 1: return [4 /*yield*/, this.TakeTextAction(scoredAction, memory)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 11];
                    case 3: return [4 /*yield*/, this.TakeCardAction(scoredAction, memory)];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 11];
                    case 5: return [4 /*yield*/, this.TakeIntentAction(scoredAction, memory)];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 11];
                    case 7: return [4 /*yield*/, this.TakeAzureAPIAction(scoredAction, memory)];
                    case 8:
                        _b.sent();
                        return [3 /*break*/, 11];
                    case 9: return [4 /*yield*/, this.TakeLocalAPIAction(scoredAction, memory)];
                    case 10:
                        _b.sent();
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    BlisDialog.prototype.TakeTextAction = function (scoredAction, memory) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var outText;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.CallBlisCallback(scoredAction, memory)];
                    case 1:
                        outText = _a.sent();
                        Utils_1.Utils.SendText(memory, outText);
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisDialog.prototype.TakeCardAction = function (scoredAction, memory) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    BlisDialog.prototype.TakeLocalAPIAction = function (scoredAction, memory) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var apiString, apiName, args, entities, api, output;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.apiCallbacks) {
                            BlisDebug_1.BlisDebug.Error("No Local APIs defined.");
                            return [2 /*return*/];
                        }
                        apiString = scoredAction.payload;
                        apiName = apiString.split(' ')[0];
                        args = Utils_1.Utils.RemoveWords(apiString, 1);
                        return [4 /*yield*/, memory.BotMemory().SubstituteEntities(args)];
                    case 1:
                        entities = _a.sent();
                        api = this.apiCallbacks[apiName];
                        if (!api) {
                            BlisDebug_1.BlisDebug.Error(api + " undefined");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, api(memory, args)];
                    case 2:
                        output = _a.sent();
                        if (output) {
                            Utils_1.Utils.SendText(memory, output);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisDialog.prototype.TakeAzureAPIAction = function (scoredAction, memory) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var apiString, funcName, args, entities, output;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        apiString = scoredAction.payload;
                        funcName = apiString.split(' ')[0];
                        args = Utils_1.Utils.RemoveWords(apiString, 1);
                        return [4 /*yield*/, memory.BotMemory().SubstituteEntities(args)];
                    case 1:
                        entities = _a.sent();
                        return [4 /*yield*/, AzureFunctions_1.AzureFunctions.Call(BlisClient_1.BlisClient.client.azureFunctionsUrl, BlisClient_1.BlisClient.client.azureFunctionsKey, funcName, entities)];
                    case 2:
                        output = _a.sent();
                        if (output) {
                            Utils_1.Utils.SendText(memory, output);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisDialog.prototype.TakeIntentAction = function (scoredAction, memory) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var apiString, intentName, args, entities, session, inTeach;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        apiString = scoredAction.payload;
                        intentName = apiString.split(' ')[0];
                        args = Utils_1.Utils.RemoveWords(apiString, 1);
                        return [4 /*yield*/, memory.BotMemory().GetEntities(args)];
                    case 1:
                        entities = _a.sent();
                        session = memory.BotState().Session();
                        inTeach = memory.BotState().InTeach();
                        if (inTeach == "true") {
                            session.beginDialog(Consts_1.BLIS_INTENT_WRAPPER, { intent: intentName, entities: entities });
                        }
                        else {
                            session.beginDialog(intentName, entities);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisDialog.prototype.CallLuisCallback = function (text, predictedEntities, memory) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var scoreInput;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.DefaultLuisCallback(text, predictedEntities, memory)];
                    case 1:
                        scoreInput = _a.sent();
                        return [2 /*return*/, scoreInput];
                }
            });
        });
    };
    BlisDialog.prototype.CallBlisCallback = function (scoredAction, memory) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var outText;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.DefaultBlisCallback(scoredAction.payload, memory)];
                    case 1:
                        outText = _a.sent();
                        return [2 /*return*/, outText];
                }
            });
        });
    };
    BlisDialog.prototype.DefaultLuisCallback = function (text, predictedEntities, memory) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _i, predictedEntities_1, predictedEntity, filledEntities, scoreInput;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _i = 0, predictedEntities_1 = predictedEntities;
                        _a.label = 1;
                    case 1:
                        if (!(_i < predictedEntities_1.length)) return [3 /*break*/, 6];
                        predictedEntity = predictedEntities_1[_i];
                        if (!(predictedEntity.metadata && predictedEntity.metadata.positiveId)) return [3 /*break*/, 3];
                        return [4 /*yield*/, memory.BotMemory().ForgetEntity(predictedEntity)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, memory.BotMemory().RememberEntity(predictedEntity)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [4 /*yield*/, memory.BotMemory().RememberedIds()];
                    case 7:
                        filledEntities = _a.sent();
                        scoreInput = new blis_models_1.ScoreInput({
                            filledEntities: filledEntities,
                            context: null,
                            maskedActions: []
                        });
                        return [2 /*return*/, scoreInput];
                }
            });
        });
    };
    BlisDialog.prototype.DefaultBlisCallback = function (text, memory) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var outText;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, memory.BotMemory().Substitute(text)];
                    case 1:
                        outText = _a.sent();
                        return [2 /*return*/, outText];
                }
            });
        });
    };
    BlisDialog.prototype.emitError = function (session, err) {
        var m = err.toString();
        err = err instanceof Error ? err : new Error(m);
        session.error(err);
    };
    return BlisDialog;
}(builder.Dialog));
exports.BlisDialog = BlisDialog;
//# sourceMappingURL=BlisDialog.js.map