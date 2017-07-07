"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var TakeTurnRequest_1 = require("./Model/TakeTurnRequest");
var BlisAppContent_1 = require("./Model/BlisAppContent");
var BlisClient_1 = require("./BlisClient");
var BlisDebug_1 = require("./BlisDebug");
var BlisContext_1 = require("./BlisContext");
var Action_1 = require("./Model/Action");
var Consts_1 = require("./Model/Consts");
var Command_1 = require("./Model/Command");
var Help_1 = require("./Model/Help");
var TakeTurnResponse_1 = require("./Model/TakeTurnResponse");
var Utils_1 = require("./Utils");
var Menu_1 = require("./Menu");
var CommandHandler_1 = require("./CommandHandler");
var AzureFunctions_1 = require("./AzureFunctions");
var RecSession = (function () {
    function RecSession(context, userInput, recCb) {
        this.context = context;
        this.userInput = userInput;
        this.recCb = recCb;
    }
    return RecSession;
}());
var BlisRecognizer = (function () {
    function BlisRecognizer() {
        this.entityValues = {};
        // Mappting between prebuild API names and functions
        this.intApiCallbacks = {};
    }
    /** Receive input from user and returns a socre */
    BlisRecognizer.prototype.recognize = function (reginput, recCb) {
        // Always recognize, but score is less than 1.0 so prompts can still win
        var result = { recognizer: this, score: 0.4, intent: null, entities: null };
        // Send callback
        recCb(null, result);
    };
    BlisRecognizer.prototype.LoadUser_v1 = function (session, cb) {
        // TODO - move invoke contents here
        var context = new BlisContext_1.BlisContext(/*this.bot*/ null, session);
        cb(null, context);
    };
    /** Send result to user */
    BlisRecognizer.prototype.SendResult_v1 = function (recsess, responses, intent, entities) {
        if (!responses && !intent) {
            BlisDebug_1.BlisDebug.Error("Send result with empty response");
            responses = [];
        }
        var result = { responses: responses, intent: intent, entities: entities };
        // Send callback
        recsess.recCb(null, result);
    };
    /** Process result before sending to user */
    BlisRecognizer.prototype.ProcessResult_v1 = function (recsess, responses, intent, entities, teachAction, actionData) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            var memory, inTeach, appId, sessionId;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        memory = recsess.context.Memory();
                        return [4 /*yield*/, memory.BotState().InTeach()];
                    case 1:
                        inTeach = _a.sent();
                        if (!(inTeach && teachAction)) return [3 /*break*/, 4];
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 2:
                        appId = _a.sent();
                        return [4 /*yield*/, memory.BotState().SessionId()];
                    case 3:
                        sessionId = _a.sent();
                        if (teachAction == Consts_1.TeachAction.RETRAIN) {
                            // Send command response out of band
                            responses.push("Retraining...");
                            Utils_1.Utils.SendResponses(recsess.context, responses);
                            // Retrain the model
                            BlisClient_1.BlisClient_v1.client.Retrain_v1(appId, sessionId)
                                .then(function (takeTurnResponse) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                return tslib_1.__generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: 
                                        // Continue teach session
                                        return [4 /*yield*/, this.TakeTurnCallback_v1(recsess, takeTurnResponse)];
                                        case 1:
                                            // Continue teach session
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); })
                                .catch(function (error) {
                                _this.SendResult_v1(recsess, [error]);
                            });
                        }
                        else if (teachAction == Consts_1.TeachAction.PICKACTION && actionData != null) {
                            // Send command response out of band
                            responses.push("Retraining...");
                            Utils_1.Utils.SendResponses(recsess.context, responses);
                            // Retrain the model
                            BlisClient_1.BlisClient_v1.client.Retrain_v1(appId, sessionId)
                                .then(function (takeTurnResponse) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                return tslib_1.__generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            // Take the next turn
                                            BlisDebug_1.BlisDebug.Log("TT: Retrain", "flow");
                                            return [4 /*yield*/, this.TakeTurn_v1(recsess, recsess.userInput, actionData)];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); })
                                .catch(function (error) {
                                _this.SendResult_v1(recsess, [error]);
                            });
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        this.SendResult_v1(recsess, responses, intent, entities);
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.TakeTurnCallback_v1 = function (recsess, ttResponse, error) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, responses_1, responses, output, inTeach, outText;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Verbose("TakeTurnCallback");
                        memory = recsess.context.Memory();
                        if (!error) return [3 /*break*/, 2];
                        responses_1 = Menu_1.Menu.AddEditCards(recsess.context, [error]);
                        return [4 /*yield*/, this.ProcessResult_v1(recsess, responses_1, null, null)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                    case 2:
                        responses = [];
                        if (!(ttResponse.mode == Consts_1.TakeTurnModes.TEACH)) return [3 /*break*/, 8];
                        if (!(ttResponse.teachStep == Consts_1.TeachStep.LABELENTITY)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.ProcessLabelEntity_v1(recsess, ttResponse, responses)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 4:
                        if (!(ttResponse.teachStep == Consts_1.TeachStep.LABELACTION)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.ProcessLabelAction_v1(recsess, ttResponse, responses)];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        responses.push("Unrecognized TeachStep " + ttResponse.teachStep);
                        _a.label = 7;
                    case 7: return [3 /*break*/, 19];
                    case 8:
                        if (!(ttResponse.mode == Consts_1.TakeTurnModes.ACTION)) return [3 /*break*/, 18];
                        output = ttResponse.actions[0].content;
                        return [4 /*yield*/, memory.TrainHistory().SetLastStep(Consts_1.SaveStep.RESPONSES, output)];
                    case 9:
                        _a.sent();
                        // Clear any suggested entity hints from response  TODO - this seems outdate
                        output = output ? output.replace(" !", " ") : output;
                        return [4 /*yield*/, memory.BotState().InTeach()];
                    case 10:
                        inTeach = _a.sent();
                        outText = null;
                        if (!this.blisCallback) return [3 /*break*/, 12];
                        return [4 /*yield*/, this.PromisifyBC(this.blisCallback, output, memory)];
                    case 11:
                        outText = _a.sent();
                        return [3 /*break*/, 14];
                    case 12: return [4 /*yield*/, this.PromisifyBC(this.DefaultBlisCallback_v1, output, memory)];
                    case 13:
                        outText = _a.sent();
                        _a.label = 14;
                    case 14:
                        if (!inTeach) return [3 /*break*/, 16];
                        return [4 /*yield*/, memory.TrainHistory().SetStep(Consts_1.SaveStep.RESPONSES, outText)];
                    case 15:
                        _a.sent();
                        responses.push(Utils_1.Utils.MakeHero('Trained Response:', outText + "\n\n", "Type next user input for this Dialog or", { "Dialog Complete": Command_1.IntCommands.DONETEACH }));
                        return [3 /*break*/, 17];
                    case 16:
                        responses.push(outText);
                        _a.label = 17;
                    case 17: return [3 /*break*/, 19];
                    case 18:
                        if (ttResponse.mode == Consts_1.TakeTurnModes.ERROR) {
                            responses.push(ttResponse.error);
                        }
                        else {
                            responses.push("Don't know mode: " + ttResponse.mode);
                        }
                        _a.label = 19;
                    case 19:
                        if (!(responses && responses.length > 0)) return [3 /*break*/, 21];
                        return [4 /*yield*/, this.ProcessResult_v1(recsess, responses, null, null)];
                    case 20:
                        _a.sent();
                        _a.label = 21;
                    case 21: return [2 /*return*/];
                }
            });
        });
    };
    /** Process Label Entity Training Step */
    BlisRecognizer.prototype.ProcessLabelEntity_v1 = function (recsess, ttResponse, responses) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, body, cardtitle, lastResponses, suggestedEntity, suggestedText, body, cardsub, cardtext, entities, _a, _b, _i, i, labelEntity, entityName, score, body;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Verbose("ProcessLabelEntity");
                        memory = recsess.context.Memory();
                        if (!ttResponse.teachError) return [3 /*break*/, 1];
                        body = "Input did not match original text. Let's try again.\n\n";
                        responses.push(Utils_1.Utils.ErrorCard(body));
                        return [3 /*break*/, 4];
                    case 1: return [4 /*yield*/, memory.TrainHistory().SetStep(Consts_1.SaveStep.INPUT, recsess.userInput)];
                    case 2:
                        _c.sent();
                        return [4 /*yield*/, memory.TrainHistory().SetLastStep(Consts_1.SaveStep.INPUT, recsess.userInput)];
                    case 3:
                        _c.sent();
                        _c.label = 4;
                    case 4:
                        cardtitle = "Teach Step: Detected Entities";
                        if (!(ttResponse.teachLabelEntities.length == 0)) return [3 /*break*/, 6];
                        return [4 /*yield*/, memory.TrainHistory().LastStep(Consts_1.SaveStep.RESPONSES)];
                    case 5:
                        lastResponses = _c.sent();
                        suggestedEntity = Action_1.Action_v1.GetEntitySuggestion(lastResponses);
                        if (suggestedEntity) {
                            suggestedText = "[" + suggestedEntity + " " + recsess.userInput + "]";
                            responses.push(suggestedText);
                            body = "Click Correct if suggested entity is valid or indicate entities in input string";
                            responses.push(Utils_1.Utils.MakeHero(cardtitle, null, body, { "Correct": suggestedText,
                                "Help": Command_1.HelpCommands.PICKENTITY
                            }));
                        }
                        else {
                            cardsub = "No new entities found.\n\n";
                            cardtext = "Click None if correct or indicate entities in input string";
                            responses.push(Utils_1.Utils.MakeHero(cardtitle, cardsub, cardtext, {
                                "None": "1",
                                "Help": Command_1.HelpCommands.PICKENTITY
                            }));
                        }
                        return [3 /*break*/, 11];
                    case 6:
                        entities = "";
                        _a = [];
                        for (_b in ttResponse.teachLabelEntities)
                            _a.push(_b);
                        _i = 0;
                        _c.label = 7;
                    case 7:
                        if (!(_i < _a.length)) return [3 /*break*/, 10];
                        i = _a[_i];
                        labelEntity = ttResponse.teachLabelEntities[i];
                        return [4 /*yield*/, memory.EntityLookup().ToName(labelEntity.id)];
                    case 8:
                        entityName = _c.sent();
                        score = labelEntity.score ? "_Score: " + labelEntity.score.toFixed(3) + "_" : "";
                        entities += "[$" + entityName + ": " + labelEntity.value + "]    " + score + "\n\n";
                        _c.label = 9;
                    case 9:
                        _i++;
                        return [3 /*break*/, 7];
                    case 10:
                        responses.push(entities);
                        body = "Click Correct if entities are valid or indicate entities in input string";
                        responses.push(Utils_1.Utils.MakeHero(cardtitle, null, body, { "Correct": "1", "Help": Command_1.HelpCommands.PICKENTITY }));
                        _c.label = 11;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /** Process Label Action Training Step */
    BlisRecognizer.prototype.ProcessLabelAction_v1 = function (recsess, ttResponse, responses) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, input, ents, title, body, choices, body_1, msg, displayIndex, i, labelAction, type, score;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Verbose("ProcessLabelEntity");
                        memory = recsess.context.Memory();
                        return [4 /*yield*/, memory.TrainHistory().CurrentInput()];
                    case 1:
                        input = _a.sent();
                        if (!!input) return [3 /*break*/, 4];
                        // Only run if no suggested entity is found
                        return [4 /*yield*/, memory.TrainHistory().SetStep(Consts_1.SaveStep.INPUT, recsess.userInput)];
                    case 2:
                        // Only run if no suggested entity is found
                        _a.sent();
                        return [4 /*yield*/, memory.TrainHistory().SetLastStep(Consts_1.SaveStep.INPUT, recsess.userInput)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [4 /*yield*/, memory.BotMemory().ToString()];
                    case 5:
                        ents = _a.sent();
                        return [4 /*yield*/, memory.TrainHistory().SetStep(Consts_1.SaveStep.ENTITY, ents)];
                    case 6:
                        _a.sent();
                        title = "Teach Step: Select Action";
                        body = ttResponse.teachLabelActions.length == 0 ? 'No actions matched' : 'Select Action by number or enter a new one';
                        // TODO support API and RESPONSE types, not just base
                        responses.push(Utils_1.Utils.MakeHero(title, null, body, {
                            "Add Response": Command_1.CueCommands.ADDRESPONSE,
                            "Add API": Command_1.CueCommands.ADDAPICALL
                        }));
                        choices = {};
                        if (!(ttResponse.teachLabelActions.length > 0)) return [3 /*break*/, 8];
                        body_1 = ents + "\n\n";
                        responses.push(Utils_1.Utils.MakeHero("Memory", null, body_1, null));
                        msg = "";
                        displayIndex = 1;
                        for (i in ttResponse.teachLabelActions) {
                            labelAction = ttResponse.teachLabelActions[i];
                            type = labelAction.actionType.toUpperCase();
                            type += labelAction.waitAction ? " WAIT" : "";
                            if (labelAction.available) {
                                score = labelAction.score ? labelAction.score.toFixed(3) : "*UNKNOWN*";
                                msg += "(" + displayIndex + ") " + labelAction.content + " _(" + type + ")_ Score: " + score + "\n\n";
                                choices[displayIndex] = labelAction.id;
                            }
                            else {
                                msg += "(  ) " + labelAction.content + " _(" + type + ")_ DISQUALIFIED\n\n";
                            }
                            displayIndex++;
                        }
                        responses.push(msg);
                        // Remember valid choices
                        return [4 /*yield*/, memory.TrainHistory().SetLastStep(Consts_1.SaveStep.CHOICES, choices)];
                    case 7:
                        // Remember valid choices
                        _a.sent();
                        _a.label = 8;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.invoke_v1 = function (session, recCb) {
        var _this = this;
        try {
            if (!session || !session.message) {
                return;
            }
            var address_1 = session.message.address;
            this.LoadUser_v1(session, function (responses, context) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var _this = this;
                var memory, userInput, recsess, help, cueCommand, appId, sessionId, inTeach, choices, msg, actionId;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            memory = context.Memory();
                            if (!this.defaultApp) return [3 /*break*/, 3];
                            // Attempt to load the application
                            return [4 /*yield*/, memory.Init(this.defaultApp)];
                        case 1:
                            // Attempt to load the application
                            _a.sent();
                            return [4 /*yield*/, BlisAppContent_1.BlisAppContent.Load(context, this.defaultApp)];
                        case 2:
                            responses = _a.sent();
                            this.defaultApp = null;
                            _a.label = 3;
                        case 3:
                            userInput = session.message ? session.message.text.trim() : null;
                            recsess = new RecSession(context, userInput, recCb);
                            if (!session.message.text) return [3 /*break*/, 26];
                            // Utils.SendTyping(this.bot, address);
                            BlisDebug_1.BlisDebug.SetAddress(address_1);
                            if (!Command_1.Command.IsHelpCommand(userInput)) return [3 /*break*/, 5];
                            help = Help_1.BlisHelp.Get(userInput);
                            return [4 /*yield*/, this.ProcessResult_v1(recsess, help, null, null)];
                        case 4:
                            _a.sent();
                            return [2 /*return*/];
                        case 5:
                            // Handle cue commands (do this first so can stack cues)
                            if (Command_1.Command.IsCueCommand(userInput)) {
                                CommandHandler_1.CommandHandler.HandleCueCommand(context, userInput, function (responses, teachAction, actionData) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                    return tslib_1.__generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.ProcessResult_v1(recsess, responses, null, null, teachAction, actionData)];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, memory.CueCommand().Get()];
                        case 6:
                            cueCommand = _a.sent();
                            if (cueCommand) {
                                CommandHandler_1.CommandHandler.ProcessCueCommand(context, userInput, function (responses, teachAction, actionData) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                    return tslib_1.__generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.ProcessResult_v1(recsess, responses, null, null, teachAction, actionData)];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                                return [2 /*return*/];
                            }
                            // Handle admin commands
                            if (Command_1.Command.IsLineCommand(userInput)) {
                                CommandHandler_1.CommandHandler.HandleLineCommand(context, userInput, function (responses, teachAction, actionData) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                    return tslib_1.__generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.ProcessResult_v1(recsess, responses, null, null, teachAction, actionData)];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                                return [2 /*return*/];
                            }
                            if (Command_1.Command.IsIntCommand(userInput)) {
                                CommandHandler_1.CommandHandler.HandleIntCommand(context, userInput, function (responses, teachAction, actionData) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                    return tslib_1.__generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.ProcessResult_v1(recsess, responses, null, null, teachAction, actionData)];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, memory.BotState().AppId()];
                        case 7:
                            appId = _a.sent();
                            if (!!appId) return [3 /*break*/, 9];
                            // If error was thrown will be in responses
                            if (!responses)
                                responses = [];
                            responses = responses.concat(Menu_1.Menu.AppPanel('No App Loaded', 'Load or Create one'));
                            return [4 /*yield*/, this.ProcessResult_v1(recsess, responses, null, null)];
                        case 8:
                            _a.sent();
                            return [2 /*return*/];
                        case 9: return [4 /*yield*/, memory.BotState().SessionId()];
                        case 10:
                            sessionId = _a.sent();
                            if (!!sessionId) return [3 /*break*/, 12];
                            // If prev error was thrown will be in responses
                            if (!responses)
                                responses = [];
                            responses = responses.concat(Menu_1.Menu.Home("The app has not been started"));
                            return [4 /*yield*/, this.ProcessResult_v1(recsess, responses, null, null)];
                        case 11:
                            _a.sent();
                            return [2 /*return*/];
                        case 12: return [4 /*yield*/, memory.BotState().InTeach()];
                        case 13:
                            inTeach = _a.sent();
                            if (!inTeach) return [3 /*break*/, 22];
                            return [4 /*yield*/, memory.TrainHistory().LastStep(Consts_1.SaveStep.CHOICES)];
                        case 14:
                            choices = _a.sent();
                            if (!(choices && Object.keys(choices).length > 0)) return [3 /*break*/, 19];
                            if (!!choices[userInput]) return [3 /*break*/, 16];
                            msg = "Please select one of the action from above or click 'Add Action' for a new Action";
                            return [4 /*yield*/, this.ProcessResult_v1(recsess, [msg], null, null)];
                        case 15:
                            _a.sent();
                            return [2 /*return*/];
                        case 16:
                            actionId = choices[userInput];
                            return [4 /*yield*/, memory.TrainHistory().SetLastStep(Consts_1.SaveStep.CHOICES, null)];
                        case 17:
                            _a.sent();
                            BlisDebug_1.BlisDebug.Log("TT: Choose Action", "flow");
                            return [4 /*yield*/, this.TakeTurn_v1(recsess, null, actionId)];
                        case 18:
                            _a.sent();
                            return [3 /*break*/, 21];
                        case 19:
                            BlisDebug_1.BlisDebug.Log("TT: Choose Action", "flow");
                            return [4 /*yield*/, this.TakeTurn_v1(recsess, userInput, null)];
                        case 20:
                            _a.sent();
                            _a.label = 21;
                        case 21: return [3 /*break*/, 25];
                        case 22: return [4 /*yield*/, memory.TrainHistory().SetLastStep(Consts_1.SaveStep.INPUT, userInput)];
                        case 23:
                            _a.sent();
                            BlisDebug_1.BlisDebug.Log("TT: Main", "flow");
                            return [4 /*yield*/, this.TakeTurn_v1(recsess, userInput, null)];
                        case 24:
                            _a.sent();
                            _a.label = 25;
                        case 25: return [3 /*break*/, 27];
                        case 26:
                            if (session.message.attachments && session.message.attachments.length > 0) {
                                Utils_1.Utils.SendMessage(context, "Importing application...");
                                BlisAppContent_1.BlisAppContent.ImportAttachment(context, session.message.attachments[0], function (text) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                    return tslib_1.__generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.ProcessResult_v1(recsess, [text], null, null)];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                                return [2 /*return*/];
                            }
                            _a.label = 27;
                        case 27: return [2 /*return*/];
                    }
                });
            }); });
        }
        catch (error) {
            BlisDebug_1.BlisDebug.Error(error);
            recCb(error, null);
        }
    };
    BlisRecognizer.prototype.PromisifyLC = function (luisCallback, text, luisEntities, memory) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        luisCallback(text, luisEntities, memory, function (takeTurnRequest) {
                            resolve(takeTurnRequest);
                        });
                    })];
            });
        });
    };
    BlisRecognizer.prototype.PromisifyBC = function (blisCallback, text, memory) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        blisCallback(text, memory, function (outText) {
                            resolve(outText);
                        });
                    })];
            });
        });
    };
    BlisRecognizer.prototype.TakeTurn_v1 = function (recsess, input, actionId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, appId, card_1, response_1, modelId, inTeach, response_2, sessionId, response_3, expectedNextModes, requestBody, takeTurnResponse, response, takeTurnRequest, memory_1, action, memory_2, memory_3, entityIds, takeTurnRequest, apiString, apiName, args, intentName, iArgs, entities, api, takeTurnRequest, card, response_4, error_1, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Verbose("TakeTurn");
                        recsess.userInput = (typeof input == 'string') ? input : null;
                        memory = recsess.context.Memory();
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 1:
                        appId = _a.sent();
                        if (!(appId == null)) return [3 /*break*/, 3];
                        card_1 = Menu_1.Menu.AppPanel("No Application has been loaded..");
                        response_1 = this.ErrorResponse(card_1[0]);
                        return [4 /*yield*/, this.TakeTurnCallback_v1(recsess, response_1)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                    case 3: return [4 /*yield*/, memory.BotState().ModelId()];
                    case 4:
                        modelId = _a.sent();
                        return [4 /*yield*/, memory.BotState().InTeach()];
                    case 5:
                        inTeach = _a.sent();
                        if (!(!modelId && !inTeach)) return [3 /*break*/, 7];
                        response_2 = this.ErrorResponse(Menu_1.Menu.Home("This application needs to be trained first."));
                        return [4 /*yield*/, this.TakeTurnCallback_v1(recsess, response_2)];
                    case 6:
                        _a.sent();
                        return [2 /*return*/];
                    case 7: return [4 /*yield*/, memory.BotState().SessionId()];
                    case 8:
                        sessionId = _a.sent();
                        if (!!sessionId) return [3 /*break*/, 10];
                        response_3 = this.ErrorResponse(Menu_1.Menu.Home("The app has not been started"));
                        return [4 /*yield*/, this.TakeTurnCallback_v1(recsess, response_3)];
                    case 9:
                        _a.sent();
                        return [2 /*return*/];
                    case 10:
                        // If passed an existing actionId take a turn with that
                        if (actionId) {
                            expectedNextModes = [Consts_1.TakeTurnModes.CALLBACK, Consts_1.TakeTurnModes.ACTION, Consts_1.TakeTurnModes.TEACH];
                            requestBody = { 'selected-action-id': actionId };
                        }
                        else if (typeof input == 'string') {
                            expectedNextModes = [Consts_1.TakeTurnModes.CALLBACK, Consts_1.TakeTurnModes.ACTION, Consts_1.TakeTurnModes.TEACH];
                            requestBody = { text: input };
                        }
                        else {
                            expectedNextModes = [Consts_1.TakeTurnModes.ACTION, Consts_1.TakeTurnModes.TEACH];
                            requestBody = input.ToJSON(); // TODO use serializer
                        }
                        _a.label = 11;
                    case 11:
                        _a.trys.push([11, 45, , 47]);
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.SendTurnRequest(appId, sessionId, requestBody)];
                    case 12:
                        takeTurnResponse = _a.sent();
                        BlisDebug_1.BlisDebug.Verbose("TakeTurnResponse: " + takeTurnResponse.mode);
                        if (!(!takeTurnResponse.mode || expectedNextModes.indexOf(takeTurnResponse.mode) < 0)) return [3 /*break*/, 14];
                        response = new TakeTurnResponse_1.TakeTurnResponse({ mode: Consts_1.TakeTurnModes.ERROR, error: "Unexpected mode " + takeTurnResponse.mode });
                        return [4 /*yield*/, this.TakeTurnCallback_v1(recsess, response)];
                    case 13:
                        _a.sent();
                        return [2 /*return*/];
                    case 14:
                        if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.CALLBACK)) return [3 /*break*/, 20];
                        takeTurnRequest = void 0;
                        memory_1 = recsess.context.Memory();
                        if (!this.luisCallback) return [3 /*break*/, 16];
                        return [4 /*yield*/, this.PromisifyLC(this.luisCallback, takeTurnResponse.originalText, takeTurnResponse.entities, memory_1)];
                    case 15:
                        takeTurnRequest = _a.sent();
                        return [3 /*break*/, 18];
                    case 16: return [4 /*yield*/, this.PromisifyLC(this.DefaultLuisCallback_v1, takeTurnResponse.originalText, takeTurnResponse.entities, memory_1)];
                    case 17:
                        takeTurnRequest = _a.sent();
                        _a.label = 18;
                    case 18:
                        BlisDebug_1.BlisDebug.Log("TT: Post LC", "flow");
                        return [4 /*yield*/, this.TakeTurn_v1(recsess, takeTurnRequest, null)];
                    case 19:
                        _a.sent();
                        return [3 /*break*/, 44];
                    case 20:
                        if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.TEACH)) return [3 /*break*/, 22];
                        return [4 /*yield*/, this.TakeTurnCallback_v1(recsess, takeTurnResponse)];
                    case 21:
                        _a.sent();
                        return [2 /*return*/];
                    case 22:
                        if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.ACTION)) return [3 /*break*/, 44];
                        action = takeTurnResponse.actions[0];
                        memory_2 = recsess.context.Memory();
                        if (!(action.actionType == Consts_1.ActionTypes_v1.TEXT)) return [3 /*break*/, 29];
                        return [4 /*yield*/, this.TakeTurnCallback_v1(recsess, takeTurnResponse)];
                    case 23:
                        _a.sent();
                        if (!!action.waitAction) return [3 /*break*/, 26];
                        memory_3 = recsess.context.Memory();
                        return [4 /*yield*/, memory_3.BotMemory().RememberedIds()];
                    case 24:
                        entityIds = _a.sent();
                        takeTurnRequest = new TakeTurnRequest_1.TakeTurnRequest({ entities: entityIds });
                        expectedNextModes = [Consts_1.TakeTurnModes.ACTION, Consts_1.TakeTurnModes.TEACH];
                        BlisDebug_1.BlisDebug.Log("TT: Action Text", "flow");
                        return [4 /*yield*/, this.TakeTurn_v1(recsess, takeTurnRequest, null)];
                    case 25:
                        _a.sent();
                        return [3 /*break*/, 28];
                    case 26:
                        if (!inTeach) return [3 /*break*/, 28];
                        return [4 /*yield*/, memory_2.TrainHistory().FinishStep()];
                    case 27:
                        _a.sent();
                        _a.label = 28;
                    case 28: return [2 /*return*/];
                    case 29:
                        if (!(action.actionType == Consts_1.ActionTypes_v1.API)) return [3 /*break*/, 44];
                        apiString = action.content;
                        apiName = apiString.split(' ')[0];
                        args = Utils_1.Utils.RemoveWords(apiString, 1);
                        if (!(apiName == Consts_1.APICalls.FIREINTENT)) return [3 /*break*/, 33];
                        intentName = args.split(' ')[0];
                        iArgs = Utils_1.Utils.RemoveWords(args, 1);
                        return [4 /*yield*/, memory_2.BotMemory().GetEntities(iArgs)];
                    case 30:
                        entities = _a.sent();
                        return [4 /*yield*/, this.ProcessResult_v1(recsess, null, intentName, entities)];
                    case 31:
                        _a.sent();
                        return [4 /*yield*/, memory_2.TrainHistory().SetStep(Consts_1.SaveStep.APICALLS, intentName + " " + entities)];
                    case 32:
                        _a.sent();
                        return [2 /*return*/];
                    case 33: return [4 /*yield*/, memory_2.BotMemory().SubstituteEntities(args)];
                    case 34:
                        // Make any entity substitutions
                        args = _a.sent();
                        api = this.intApiCallbacks[apiName];
                        // Then check user defined APIs
                        if (!api && this.apiCallbacks) {
                            api = this.apiCallbacks[apiName];
                        }
                        if (!api) return [3 /*break*/, 42];
                        return [4 /*yield*/, api(recsess.context, memory_2, args)];
                    case 35:
                        takeTurnRequest = _a.sent();
                        if (!inTeach) return [3 /*break*/, 37];
                        return [4 /*yield*/, memory_2.TrainHistory().SetStep(Consts_1.SaveStep.APICALLS, apiName + " " + args)];
                    case 36:
                        _a.sent();
                        _a.label = 37;
                    case 37:
                        BlisDebug_1.BlisDebug.Verbose("API: {" + apiName + " " + args + "}");
                        if (!!action.waitAction) return [3 /*break*/, 39];
                        expectedNextModes = [Consts_1.TakeTurnModes.ACTION, Consts_1.TakeTurnModes.TEACH];
                        BlisDebug_1.BlisDebug.Log("TT: API", "flow");
                        return [4 /*yield*/, this.TakeTurn_v1(recsess, takeTurnRequest, null)];
                    case 38:
                        _a.sent();
                        return [3 /*break*/, 41];
                    case 39:
                        if (!inTeach) return [3 /*break*/, 41];
                        return [4 /*yield*/, memory_2.TrainHistory().FinishStep()];
                    case 40:
                        _a.sent();
                        card = Utils_1.Utils.MakeHero(null, null, "Type next user input for this Dialog or", { "Dialog Complete": Command_1.IntCommands.DONETEACH });
                        Utils_1.Utils.SendResponses(recsess.context, [card]);
                        _a.label = 41;
                    case 41: return [3 /*break*/, 44];
                    case 42:
                        response_4 = this.ErrorResponse("API " + apiName + " not defined");
                        return [4 /*yield*/, this.TakeTurnCallback_v1(recsess, response_4)];
                    case 43:
                        _a.sent();
                        _a.label = 44;
                    case 44: return [3 /*break*/, 47];
                    case 45:
                        error_1 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_1);
                        return [4 /*yield*/, this.TakeTurnCallback_v1(recsess, null, errMsg)];
                    case 46:
                        _a.sent();
                        return [3 /*break*/, 47];
                    case 47: return [2 /*return*/];
                }
            });
        });
    };
    //====================================================
    // Built in API calls
    //====================================================
    BlisRecognizer.prototype.CallAzureFuncCB_v1 = function (context, memory, args) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var errCard, _a, funct, query, output, entityIds;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!BlisClient_1.BlisClient_v1.client.azureFunctionsUrl) return [3 /*break*/, 1];
                        errCard = Utils_1.Utils.ErrorCard("Attempt to call Azure Function with no URL.", "Must set 'azureFunctionsUrl' in Bot implimentation.");
                        Utils_1.Utils.SendMessage(context, errCard);
                        return [3 /*break*/, 3];
                    case 1:
                        _a = args.split(' '), funct = _a[0], query = _a[1];
                        return [4 /*yield*/, AzureFunctions_1.AzureFunctions.Call(BlisClient_1.BlisClient_v1.client.azureFunctionsUrl, BlisClient_1.BlisClient_v1.client.azureFunctionsKey, funct, query)];
                    case 2:
                        output = _b.sent();
                        if (output) {
                            Utils_1.Utils.SendMessage(context, output);
                        }
                        _b.label = 3;
                    case 3: return [4 /*yield*/, memory.BotMemory().RememberedIds()];
                    case 4:
                        entityIds = _b.sent();
                        return [4 /*yield*/, memory.TrainHistory().SetLastStep(Consts_1.SaveStep.RESPONSES, args)];
                    case 5:
                        _b.sent(); // TEMP try remember last apicall
                        return [2 /*return*/, new TakeTurnRequest_1.TakeTurnRequest({ entities: entityIds })];
                }
            });
        });
    };
    // EXPIRIMENTAL = TODO
    // Set a task to the "ON" state
    BlisRecognizer.prototype.SetTaskCB = function (context, memory, entityName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityIds;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        memory.BotMemory().RememberByName(entityName, "ON");
                        return [4 /*yield*/, memory.BotMemory().RememberedIds()];
                    case 1:
                        entityIds = _a.sent();
                        return [2 /*return*/, new TakeTurnRequest_1.TakeTurnRequest({ entities: entityIds })];
                }
            });
        });
    };
    // Set a task to the "OFF" state
    BlisRecognizer.prototype.ClearTaskCB = function (context, memory, entityName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityIds;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, memory.BotMemory().ForgetByName(entityName, null)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, memory.BotMemory().RememberedIds()];
                    case 2:
                        entityIds = _a.sent();
                        return [2 /*return*/, new TakeTurnRequest_1.TakeTurnRequest({ entities: entityIds })];
                }
            });
        });
    };
    //====================================================
    BlisRecognizer.prototype.ErrorResponse = function (error) {
        return new TakeTurnResponse_1.TakeTurnResponse({ mode: Consts_1.TakeTurnModes.ERROR, error: error });
    };
    BlisRecognizer.prototype.DefaultLuisCallback_v1 = function (text, entities, memory, done) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _i, entities_1, entity, remembered, entityIds, ttr;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _i = 0, entities_1 = entities;
                        _a.label = 1;
                    case 1:
                        if (!(_i < entities_1.length)) return [3 /*break*/, 9];
                        entity = entities_1[_i];
                        if (!(entity.metadata && entity.metadata.positive)) return [3 /*break*/, 3];
                        return [4 /*yield*/, memory.BotMemory().ForgetByLabel(entity)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, memory.BotMemory().RememberByLabel(entity)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        if (!(entity.metadata && entity.metadata.task)) return [3 /*break*/, 8];
                        return [4 /*yield*/, memory.BotMemory().WasRemembered(entity.metadata.task)];
                    case 6:
                        remembered = _a.sent();
                        if (!!remembered) return [3 /*break*/, 8];
                        return [4 /*yield*/, memory.BotMemory().ForgetByLabel(entity)];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8:
                        _i++;
                        return [3 /*break*/, 1];
                    case 9: return [4 /*yield*/, memory.BotMemory().RememberedIds()];
                    case 10:
                        entityIds = _a.sent();
                        ttr = new TakeTurnRequest_1.TakeTurnRequest({ input: text, entities: entityIds });
                        done(ttr);
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.DefaultBlisCallback_v1 = function (text, memory, done) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var outText;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, memory.BotMemory().Substitute(text)];
                    case 1:
                        outText = _a.sent();
                        done(outText);
                        return [2 /*return*/];
                }
            });
        });
    };
    return BlisRecognizer;
}());
exports.BlisRecognizer = BlisRecognizer;
//# sourceMappingURL=BlisRecognizer.js.map