"use strict";
var tslib_1 = require("tslib");
var TakeTurnRequest_1 = require("./Model/TakeTurnRequest");
var BlisAppContent_1 = require("./Model/BlisAppContent");
var BlisClient_1 = require("./BlisClient");
var BlisMemory_1 = require("./BlisMemory");
var BlisDebug_1 = require("./BlisDebug");
var BlisContext_1 = require("./BlisContext");
var BlisUserState_1 = require("./BlisUserState");
var Action_1 = require("./Model/Action");
var Consts_1 = require("./Model/Consts");
var Help_1 = require("./Model/Help");
var TakeTurnResponse_1 = require("./Model/TakeTurnResponse");
var Utils_1 = require("./Utils");
var Menu_1 = require("./Menu");
var CommandHandler_1 = require("./CommandHandler");
var BlisRecognizer = (function () {
    function BlisRecognizer(bot, options) {
        this.bot = bot;
        this.entityValues = {};
        // Mappting between prebuild API names and functions
        this.intApiCallbacks = {};
        this.init(options);
        BlisDebug_1.BlisDebug.InitLogger(bot);
    }
    BlisRecognizer.prototype.init = function (options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var errMsg;
            return tslib_1.__generator(this, function (_a) {
                try {
                    BlisDebug_1.BlisDebug.Log("Creating client...");
                    this.blisClient = new BlisClient_1.BlisClient(options.serviceUri, options.user, options.secret);
                    this.LuisCallback = options.luisCallback;
                    this.apiCallbacks = options.apiCallbacks;
                    this.intApiCallbacks[Consts_1.APICalls.SAVEENTITY] = this.SaveEntityCB;
                    this.connector = options.connector;
                    this.defaultApp = options.appId;
                    this.blisCallback = options.blisCallback ? options.blisCallback : this.DefaultBlisCallback;
                }
                catch (error) {
                    errMsg = Utils_1.Utils.ErrorString(error);
                    BlisDebug_1.BlisDebug.Error(errMsg);
                }
                return [2 /*return*/];
            });
        });
    };
    BlisRecognizer.prototype.LoadUser = function (address, cb) {
        var _this = this;
        // TODO handle errors
        BlisUserState_1.BlisUserState.Get(this.bot, address, this.defaultApp, function (error, userState, isNew) {
            var context = new BlisContext_1.BlisContext(_this.bot, _this.blisClient, userState, address);
            if (isNew) {
                // Attempt to load the application
                BlisAppContent_1.BlisAppContent.Load(context, _this.defaultApp, function (text) {
                    BlisDebug_1.BlisDebug.Log(text);
                    cb(null, context);
                });
            }
            else {
                cb(null, context);
            }
        });
    };
    BlisRecognizer.prototype.SendResult = function (context, cb, responses) {
        if (!responses) {
            BlisDebug_1.BlisDebug.Error("Send result with empty response");
            responses = [];
        }
        // Save user state
        BlisUserState_1.BlisUserState.Save(context);
        // Assume BLIS always wins for now 
        var result = { score: 1.0, responses: responses, intent: null };
        // Send callback
        cb(null, result);
    };
    BlisRecognizer.prototype.recognize = function (reginput, cb) {
        var _this = this;
        try {
            if (!reginput || !reginput.message) {
                return;
            }
            var address_1 = reginput.message.address;
            this.LoadUser(address_1, function (error, context) {
                if (reginput.message.attachments && reginput.message.attachments.length > 0) {
                    Utils_1.Utils.SendMessage(context, "Importing application...");
                    BlisAppContent_1.BlisAppContent.ImportAttachment(context, reginput.message.attachments[0], function (text) {
                        _this.SendResult(context, cb, [text]);
                    });
                    return;
                }
                if (reginput.message.text) {
                    var inTeach_1 = context.state[Consts_1.UserStates.TEACH];
                    var that_1 = _this;
                    var memory_1 = new BlisMemory_1.BlisMemory(context);
                    /** Process Label Entity Step */
                    var ProcessLabelEntity_1 = function (ttResponse, responses) {
                        BlisDebug_1.BlisDebug.Verbose("ProcessLabelEntity");
                        if (ttResponse.teachError) {
                            var title = "**ERROR**\n\n";
                            var body = "Input did not match original text. Let's try again.\n\n";
                            responses.push(Utils_1.Utils.MakeHero(title, body, null, null));
                        }
                        else {
                            memory_1.RememberTrainStep(Consts_1.SaveStep.INPUT, userInput_1);
                            memory_1.RememberLastStep(Consts_1.SaveStep.INPUT, userInput_1);
                        }
                        var cardtitle = "Teach Step: Detected Entities";
                        if (ttResponse.teachLabelEntities.length == 0) {
                            // Look for suggested entity in previous response
                            var lastResponse = memory_1.LastStep(Consts_1.SaveStep.RESPONSE);
                            var suggestedEntity = Action_1.Action.GetEntitySuggestion(lastResponse);
                            if (suggestedEntity) {
                                // If one exist let user pick it 
                                responses.push("[" + suggestedEntity + " " + userInput_1 + "]");
                                var body = "Click Correct if suggested entity is valid or indicate entities in input string";
                                responses.push(Utils_1.Utils.MakeHero(cardtitle, null, body, { "Correct": "1", "Help": Help_1.Help.PICKENTITY }));
                            }
                            else {
                                var cardsub = "No new entities found.\n\n";
                                var cardtext = "Click None if correct or indicate entities in input string";
                                responses.push(Utils_1.Utils.MakeHero(cardtitle, cardsub, cardtext, { "None": "1", "Help": Help_1.Help.PICKENTITY }));
                            }
                        }
                        else {
                            var entities = "";
                            for (var i in ttResponse.teachLabelEntities) {
                                var labelEntity = ttResponse.teachLabelEntities[i];
                                var entityName = memory_1.EntityId2Name(labelEntity.id);
                                // Prebuild entities don't have a score
                                var score = labelEntity.score ? "_Score: " + labelEntity.score.toFixed(3) + "_" : "";
                                entities += "[$" + entityName + ": " + labelEntity.value + "]    " + score + "\n\n";
                            }
                            responses.push(entities);
                            var body = "Click Correct if entities are valid or indicate entities in input string";
                            responses.push(Utils_1.Utils.MakeHero(cardtitle, null, body, { "Correct": "1", "Help": Help_1.Help.PICKENTITY }));
                        }
                    };
                    /** Process Label Entity Step */
                    var ProcessLabelAction_1 = function (ttResponse, responses) {
                        BlisDebug_1.BlisDebug.Verbose("ProcessLabelEntity");
                        // If app contains no entities, LabelEntity skip is stepped, so input must still be saved
                        if (!memory_1.TrainStepInput()) {
                            // Only run if no suggested entity is found
                            memory_1.RememberTrainStep(Consts_1.SaveStep.INPUT, userInput_1);
                            memory_1.RememberLastStep(Consts_1.SaveStep.INPUT, userInput_1);
                        }
                        // If a SuggestedEntity (i.e. *entity) was in previous bot response, the entity wasn't already assigned
                        // and no different entities were selected by the user, call saveEntity API
                        var lastResponse = memory_1.LastStep(Consts_1.SaveStep.RESPONSE);
                        var entities = memory_1.LastStep(Consts_1.SaveStep.ENTITY);
                        var suggestedEntity = Action_1.Action.GetEntitySuggestion(lastResponse);
                        if (!entities && suggestedEntity && !memory_1.EntityValue(suggestedEntity)) {
                            var apiId = memory_1.APILookup(suggestedEntity);
                            if (apiId) {
                                // Find the saveEntity action and take it
                                for (var i in ttResponse.teachLabelActions) {
                                    var labelAction = ttResponse.teachLabelActions[i];
                                    if (labelAction.id == apiId) {
                                        var userInput_2 = (+i + 1).toString(); // Incriment string number
                                        memory_1.RememberLastStep(Consts_1.SaveStep.RESPONSE, userInput_2);
                                        memory_1.RememberTrainStep(Consts_1.SaveStep.ENTITY, memory_1.DumpEntities());
                                        that_1.TakeTurn(context, userInput_2, TakeTurnCallback_1);
                                        return;
                                    }
                                }
                            }
                        }
                        memory_1.RememberTrainStep(Consts_1.SaveStep.ENTITY, memory_1.DumpEntities());
                        var title = "Teach Step: Select Action";
                        var body = ttResponse.teachLabelActions.length == 0 ? 'No actions matched' : 'Select Action by number or enter a new one';
                        responses.push(Utils_1.Utils.MakeHero(title, null, body, { "Add Action": Help_1.Help.ADDACTION }));
                        if (ttResponse.teachLabelActions.length > 0) {
                            var body_1 = memory_1.DumpEntities() + "\n\n";
                            responses.push(Utils_1.Utils.MakeHero(" ", null, body_1, null));
                            var msg = "";
                            for (var i in ttResponse.teachLabelActions) {
                                var labelAction = ttResponse.teachLabelActions[i];
                                if (labelAction.available) {
                                    var score = labelAction.score ? labelAction.score.toFixed(3) : "*UNKNOWN*";
                                    msg += "(" + (1 + Number(i)) + ") " + labelAction.content + " _(" + labelAction.actionType.toUpperCase() + ")_ Score: " + score + "\n\n";
                                }
                                else {
                                    msg += "_(" + (1 + Number(i)) + ") " + labelAction.content + "_ _(" + labelAction.actionType.toUpperCase() + ")_ DISQUALIFIED\n\n";
                                }
                            }
                            responses.push(msg);
                        }
                    };
                    var TakeTurnCallback_1 = function (ttResponse, error) {
                        BlisDebug_1.BlisDebug.Verbose("TakeTurnCallback");
                        if (error) {
                            that_1.SendResult(context, cb, [error]);
                            return;
                        }
                        var responses = [];
                        if (ttResponse.mode == Consts_1.TakeTurnModes.TEACH) {
                            if (ttResponse.teachStep == Consts_1.TeachStep.LABELENTITY) {
                                ProcessLabelEntity_1(ttResponse, responses);
                            }
                            else if (ttResponse.teachStep == Consts_1.TeachStep.LABELACTION) {
                                ProcessLabelAction_1(ttResponse, responses);
                            }
                            else {
                                responses.push("Unrecognized TeachStep " + ttResponse.teachStep);
                            }
                        }
                        else if (ttResponse.mode == Consts_1.TakeTurnModes.ACTION) {
                            var output = ttResponse.actions[0].content;
                            memory_1.RememberLastStep(Consts_1.SaveStep.RESPONSE, output);
                            // Clear any suggested entity hints from response
                            output = output ? output.replace(" !", " ") : output;
                            // Allow for dev to update
                            var outText = null;
                            if (that_1.blisCallback) {
                                outText = that_1.blisCallback(output, memory_1);
                            }
                            else {
                                outText = that_1.DefaultBlisCallback(output, memory_1);
                            }
                            if (inTeach_1) {
                                memory_1.RememberTrainStep(Consts_1.SaveStep.RESPONSE, outText);
                                responses.push(Utils_1.Utils.MakeHero('Trained Response:', outText + "\n\n", "Type next user input for this Dialog or", { "Dialog Complete": Consts_1.IntCommands.DONETEACH }));
                            }
                            else {
                                responses.push(outText);
                            }
                        }
                        else if (ttResponse.mode == Consts_1.TakeTurnModes.ERROR) {
                            responses.push(ttResponse.error);
                        }
                        else {
                            responses.push("Don't know mode: " + ttResponse.mode);
                        }
                        if (responses && responses.length > 0) {
                            that_1.SendResult(context, cb, responses);
                        }
                    };
                    Utils_1.Utils.SendTyping(_this.bot, address_1);
                    BlisDebug_1.BlisDebug.SetAddress(address_1);
                    var userInput_1 = reginput.message.text.trim();
                    // Check for Edit Commands
                    if (memory_1.CueCommand()) {
                        CommandHandler_1.CommandHandler.HandleCueCommand(context, userInput_1, function (responses, retrain) {
                            _this.SendResult(context, cb, responses);
                        });
                    }
                    else if (userInput_1.startsWith('!')) {
                        CommandHandler_1.CommandHandler.HandleCommandLine(context, userInput_1, function (responses, retrain) {
                            // Some commands require retraining if user is in teach mode
                            if (inTeach_1 && retrain) {
                                // Send command response out of band
                                responses.push("Retraining...");
                                Utils_1.Utils.SendResponses(context, responses);
                                // Retrain the model
                                _this.blisClient.Retrain(context.state[Consts_1.UserStates.APP], context.state[Consts_1.UserStates.APP])
                                    .then(function (takeTurnResponse) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                    return tslib_1.__generator(this, function (_a) {
                                        // Continue teach session
                                        TakeTurnCallback_1(takeTurnResponse);
                                        return [2 /*return*/];
                                    });
                                }); })
                                    .catch(function (error) {
                                    _this.SendResult(context, cb, [error]);
                                });
                            }
                            else {
                                _this.SendResult(context, cb, responses);
                            }
                        });
                    }
                    else if (userInput_1.startsWith('~')) {
                        CommandHandler_1.CommandHandler.HandleIntCommand(context, userInput_1, function (responses, retrain) {
                            _this.SendResult(context, cb, responses);
                        });
                    }
                    else if (userInput_1.startsWith('#')) {
                        var help = Help_1.BlisHelp.Get(userInput_1);
                        _this.SendResult(context, cb, [help]);
                    }
                    else {
                        // If not in teach mode remember last user input
                        if (!inTeach_1) {
                            memory_1.RememberLastStep(Consts_1.SaveStep.INPUT, userInput_1);
                        }
                        BlisDebug_1.BlisDebug.LogObject(context.state[Consts_1.UserStates.LASTSTEP]);
                        _this.TakeTurn(context, userInput_1, TakeTurnCallback_1);
                    }
                }
            });
        }
        catch (error) {
            var errMsg = Utils_1.Utils.ErrorString(error);
            BlisDebug_1.BlisDebug.Error(errMsg);
            cb(error, null);
        }
    };
    BlisRecognizer.prototype.TakeTurn = function (context, payload, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var card, response_1, card, response_2, card, response_3, expectedNextModes, requestBody, takeTurnResponse, response, takeTurnRequest, memory, action, apiString, _a, apiName, arg, api, memory, takeTurnRequest, response_4, error_1, errMsg;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Verbose("TakeTurn");
                        // Error checking
                        if (context.state[Consts_1.UserStates.APP] == null) {
                            card = Menu_1.Menu.NotLoaded("No Application has been loaded..");
                            response_1 = this.ErrorResponse(card[0]);
                            cb(response_1);
                            return [2 /*return*/];
                        }
                        else if (!context.state[Consts_1.UserStates.MODEL] && !context.state[Consts_1.UserStates.TEACH]) {
                            card = Menu_1.Menu.Home("This application needs to be trained first.");
                            response_2 = this.ErrorResponse(card[0]);
                            cb(response_2);
                            return [2 /*return*/];
                        }
                        else if (!context.state[Consts_1.UserStates.SESSION]) {
                            card = Menu_1.Menu.Home("The app has not been started");
                            response_3 = this.ErrorResponse(card[0]);
                            cb(response_3);
                            return [2 /*return*/];
                        }
                        if (typeof payload == 'string') {
                            expectedNextModes = [Consts_1.TakeTurnModes.CALLBACK, Consts_1.TakeTurnModes.ACTION, Consts_1.TakeTurnModes.TEACH];
                            requestBody = { text: payload };
                        }
                        else {
                            expectedNextModes = [Consts_1.TakeTurnModes.ACTION, Consts_1.TakeTurnModes.TEACH];
                            requestBody = payload.ToJSON(); // TODO use serializer
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 10, , 11]);
                        return [4 /*yield*/, this.blisClient.SendTurnRequest(context.state, requestBody)];
                    case 2:
                        takeTurnResponse = _b.sent();
                        // Check that expected mode matches
                        if (!takeTurnResponse.mode || expectedNextModes.indexOf(takeTurnResponse.mode) < 0) {
                            response = new TakeTurnResponse_1.TakeTurnResponse({ mode: Consts_1.TakeTurnModes.ERROR, error: "Unexpected mode " + takeTurnResponse.mode });
                            cb(response);
                            return [2 /*return*/];
                        }
                        if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.CALLBACK)) return [3 /*break*/, 4];
                        takeTurnRequest = void 0;
                        memory = new BlisMemory_1.BlisMemory(context);
                        if (this.LuisCallback) {
                            takeTurnRequest = this.LuisCallback(takeTurnResponse.originalText, takeTurnResponse.entities, memory);
                        }
                        else {
                            takeTurnRequest = this.DefaultLuisCallback(takeTurnResponse.originalText, takeTurnResponse.entities, memory);
                        }
                        return [4 /*yield*/, this.TakeTurn(context, takeTurnRequest, cb)];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 4:
                        if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.TEACH)) return [3 /*break*/, 5];
                        cb(takeTurnResponse);
                        return [2 /*return*/];
                    case 5:
                        if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.ACTION)) return [3 /*break*/, 9];
                        action = takeTurnResponse.actions[0];
                        if (!(action.actionType == Consts_1.ActionTypes.TEXT)) return [3 /*break*/, 6];
                        cb(takeTurnResponse);
                        return [2 /*return*/];
                    case 6:
                        if (!(action.actionType == Consts_1.ActionTypes.API)) return [3 /*break*/, 9];
                        apiString = action.content;
                        _a = apiString.split(' '), apiName = _a[0], arg = _a[1];
                        api = this.intApiCallbacks[apiName];
                        // Then check user defined APIs
                        if (!api && this.apiCallbacks) {
                            api = this.apiCallbacks[apiName];
                        }
                        if (!api) return [3 /*break*/, 8];
                        memory = new BlisMemory_1.BlisMemory(context);
                        takeTurnRequest = api(memory, arg);
                        // If in teach mode, remember the step
                        if (context.state[Consts_1.UserStates.TEACH]) {
                            memory.RememberTrainStep(Consts_1.SaveStep.API, apiName + " " + arg);
                        }
                        BlisDebug_1.BlisDebug.Verbose("API: {" + apiName + " " + arg + "}");
                        expectedNextModes = [Consts_1.TakeTurnModes.ACTION, Consts_1.TakeTurnModes.TEACH];
                        return [4 /*yield*/, this.TakeTurn(context, takeTurnRequest, cb)];
                    case 7:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        response_4 = this.ErrorResponse("API " + apiName + " not defined");
                        cb(response_4);
                        _b.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        error_1 = _b.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_1);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb(null, errMsg);
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    //====================================================
    // Built in API GetActions
    //====================================================
    BlisRecognizer.prototype.SaveEntityCB = function (memory, entityName) {
        var lastInput = memory.LastStep(Consts_1.SaveStep.INPUT);
        memory.RememberEntityByName(entityName, lastInput);
        var entityIds = memory.EntityIds();
        return new TakeTurnRequest_1.TakeTurnRequest({ entities: entityIds });
    };
    //====================================================
    BlisRecognizer.prototype.ErrorResponse = function (error) {
        return new TakeTurnResponse_1.TakeTurnResponse({ mode: Consts_1.TakeTurnModes.ERROR, error: error });
    };
    BlisRecognizer.prototype.DefaultLuisCallback = function (text, entities, memory) {
        // Update entities in my memory
        for (var _i = 0, entities_1 = entities; _i < entities_1.length; _i++) {
            var entity = entities_1[_i];
            // If negative entity will have a positive counter entity
            if (entity.metadata && entity.metadata.positive) {
                memory.ForgetEntity(entity);
            }
            else {
                memory.RememberEntity(entity);
            }
        }
        // Get entities from my memory
        var entityIds = memory.EntityIds();
        return new TakeTurnRequest_1.TakeTurnRequest({ input: text, entities: entityIds });
    };
    BlisRecognizer.prototype.DefaultBlisCallback = function (text, memory) {
        return memory.Substitute(text);
    };
    return BlisRecognizer;
}());
exports.BlisRecognizer = BlisRecognizer;
//# sourceMappingURL=BlisRecognizer.js.map