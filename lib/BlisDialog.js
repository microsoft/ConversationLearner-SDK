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
var ClientMemoryManager_1 = require("./Memory/ClientMemoryManager");
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
            _this.blisRecognizer = new BlisRecognizer_1.BlisRecognizer();
            _this.recognizers = new builder.IntentRecognizerSet({ recognizers: [_this.blisRecognizer] });
            BlisDebug_1.BlisDebug.Log("Creating client....");
            BlisClient_1.BlisClient.SetServiceURI(options.serviceUri);
            BlisClient_1.BlisClient.Init(options.user, options.secret, options.azureFunctionsUrl, options.azureFunctionsKey);
            BlisMemory_1.BlisMemory.Init(options.redisServer, options.redisKey);
            _this.luisCallback = options.luisCallback;
            _this.apiCallbacks = options.apiCallbacks;
            _this.blisCallback = options.blisCallback;
            // Optional connector, required for downloading train dialogs
            _this.connector = options.connector;
            Server_1.Server.Init();
        }
        catch (error) {
            BlisDebug_1.BlisDebug.Error(error);
        }
        return _this;
    }
    // Create singleton
    BlisDialog.Init = function (bot, options) {
        BlisDialog.dialog = new BlisDialog(bot, options);
        return BlisDialog.dialog;
    };
    BlisDialog.Instance = function () {
        return this.dialog;
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
            var context, memory, inTeach, appId, sessionId, userInput, extractResponse, suggestedEntity, error_1, msg;
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
                        userInput = new blis_models_1.UserInput({ text: session.message.text });
                        if (!!inTeach) return [3 /*break*/, 11];
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 9, , 11]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.SessionExtract(appId, sessionId, userInput)
                            // If no entities extracted, check for suggested entity
                        ];
                    case 5:
                        extractResponse = _a.sent();
                        if (!(extractResponse.predictedEntities.length == 0)) return [3 /*break*/, 7];
                        return [4 /*yield*/, Utils_1.Utils.GetSuggestedEntity(userInput, memory)];
                    case 6:
                        suggestedEntity = _a.sent();
                        if (suggestedEntity) {
                            extractResponse.predictedEntities = [suggestedEntity];
                        }
                        _a.label = 7;
                    case 7: return [4 /*yield*/, this.ProcessExtraction(appId, sessionId, memory, extractResponse.text, extractResponse.predictedEntities, extractResponse.definitions.entities)];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 11];
                    case 9:
                        error_1 = _a.sent();
                        msg = BlisDebug_1.BlisDebug.Error(error_1);
                        return [4 /*yield*/, Utils_1.Utils.SendMessage(this.bot, memory, msg)];
                    case 10:
                        _a.sent();
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    BlisDialog.prototype.ProcessExtraction = function (appId, sessionId, memory, text, predictedEntities, allEntities) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var scoreInput, scoreResponse, bestAction;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.CallLuisCallback(text, predictedEntities, allEntities, memory)];
                    case 1:
                        scoreInput = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.SessionScore(appId, sessionId, scoreInput)];
                    case 2:
                        scoreResponse = _a.sent();
                        bestAction = scoreResponse.scoredActions[0];
                        if (!bestAction) return [3 /*break*/, 4];
                        this.TakeAction(bestAction, memory);
                        if (!!bestAction.isTerminal) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.ProcessExtraction(appId, sessionId, memory, "", [], allEntities)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BlisDialog.prototype.TakeAction = function (scoredAction, memory) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var actionType, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        actionType = scoredAction.metadata.actionType;
                        if (!scoredAction.metadata.entitySuggestion) return [3 /*break*/, 2];
                        return [4 /*yield*/, memory.BotState().SetSuggestedEntity(scoredAction.metadata.entitySuggestion)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        _a = actionType;
                        switch (_a) {
                            case blis_models_1.ActionTypes.TEXT: return [3 /*break*/, 3];
                            case blis_models_1.ActionTypes.CARD: return [3 /*break*/, 5];
                            case blis_models_1.ActionTypes.INTENT: return [3 /*break*/, 7];
                            case blis_models_1.ActionTypes.API_AZURE: return [3 /*break*/, 9];
                            case blis_models_1.ActionTypes.API_LOCAL: return [3 /*break*/, 11];
                        }
                        return [3 /*break*/, 13];
                    case 3: return [4 /*yield*/, this.TakeTextAction(scoredAction, memory)];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 13];
                    case 5: return [4 /*yield*/, this.TakeCardAction(scoredAction, memory)];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 13];
                    case 7: return [4 /*yield*/, this.TakeIntentAction(scoredAction, memory)];
                    case 8:
                        _b.sent();
                        return [3 /*break*/, 13];
                    case 9: return [4 /*yield*/, this.TakeAzureAPIAction(scoredAction, memory)];
                    case 10:
                        _b.sent();
                        return [3 /*break*/, 13];
                    case 11: return [4 /*yield*/, this.TakeLocalAPIAction(scoredAction, memory)];
                    case 12:
                        _b.sent();
                        return [3 /*break*/, 13];
                    case 13: return [2 /*return*/];
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
                        return [4 /*yield*/, Utils_1.Utils.SendMessage(this.bot, memory, outText)];
                    case 2:
                        _a.sent();
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
            var apiName, args, argArray, _i, args_1, arg, _a, _b, api, output;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.apiCallbacks) {
                            BlisDebug_1.BlisDebug.Error("No Local APIs defined.");
                            return [2 /*return*/];
                        }
                        apiName = blis_models_1.ModelUtils.GetPrimaryPayload(scoredAction);
                        args = blis_models_1.ModelUtils.GetArguments(scoredAction);
                        argArray = [];
                        _i = 0, args_1 = args;
                        _c.label = 1;
                    case 1:
                        if (!(_i < args_1.length)) return [3 /*break*/, 4];
                        arg = args_1[_i];
                        _b = (_a = argArray).push;
                        return [4 /*yield*/, memory.BotMemory().SubstituteEntities(arg)];
                    case 2:
                        _b.apply(_a, [_c.sent()]);
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        api = this.apiCallbacks[apiName];
                        if (!api) {
                            BlisDebug_1.BlisDebug.Error(api + " undefined");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, api(argArray)];
                    case 5:
                        output = _c.sent();
                        if (!output) return [3 /*break*/, 7];
                        return [4 /*yield*/, Utils_1.Utils.SendMessage(this.bot, memory, output)];
                    case 6:
                        _c.sent();
                        _c.label = 7;
                    case 7: return [2 /*return*/];
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
                        args = blis_models_1.ModelUtils.RemoveWords(apiString, 1);
                        return [4 /*yield*/, memory.BotMemory().SubstituteEntities(args)];
                    case 1:
                        entities = _a.sent();
                        return [4 /*yield*/, AzureFunctions_1.AzureFunctions.Call(BlisClient_1.BlisClient.client.azureFunctionsUrl, BlisClient_1.BlisClient.client.azureFunctionsKey, funcName, entities)];
                    case 2:
                        output = _a.sent();
                        if (!output) return [3 /*break*/, 4];
                        return [4 /*yield*/, Utils_1.Utils.SendMessage(this.bot, memory, output)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
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
                        args = blis_models_1.ModelUtils.RemoveWords(apiString, 1);
                        return [4 /*yield*/, memory.BotMemory().GetEntities(args)];
                    case 1:
                        entities = _a.sent();
                        session = memory.BotState().Session(this.bot);
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
    BlisDialog.prototype.CallLuisCallback = function (text, predictedEntities, allEntities, memory) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memoryManager, scoreInput;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        memoryManager = new ClientMemoryManager_1.ClientMemoryManager(memory, allEntities);
                        scoreInput = null;
                        if (!this.luisCallback) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.luisCallback(text, predictedEntities, memoryManager)];
                    case 1:
                        scoreInput = _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.DefaultLuisCallback(text, predictedEntities, memoryManager)];
                    case 3:
                        scoreInput = _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/, scoreInput];
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
    BlisDialog.prototype.DefaultLuisCallback = function (text, predictedEntities, memoryManager) {
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
                        return [4 /*yield*/, memoryManager.blisMemory.BotMemory().ForgetEntity(predictedEntity)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, memoryManager.blisMemory.BotMemory().RememberEntity(predictedEntity)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [4 /*yield*/, memoryManager.blisMemory.BotMemory().RememberedIds()];
                    case 7:
                        filledEntities = _a.sent();
                        scoreInput = new blis_models_1.ScoreInput({
                            filledEntities: filledEntities,
                            context: {},
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