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
    BlisRecognizer.prototype.IsInternalApi = function (apicall) {
        var apiName = apicall.split(' ')[0];
        return (this.intApiCallbacks[apiName] != null);
    };
    BlisRecognizer.prototype.LoadUser = function (address, cb) {
        var _this = this;
        // TODO handle errors
        BlisUserState_1.BlisUserState.Get(this.bot, address, this.defaultApp, function (error, userState, isNew) {
            var context = new BlisContext_1.BlisContext(_this.bot, _this.blisClient, userState, address);
            if (isNew) {
                // Attempt to load the application
                BlisAppContent_1.BlisAppContent.Load(context, _this.defaultApp, function (responses) {
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
                var that = _this;
                var inTeach = context.state[Consts_1.UserStates.TEACH];
                var memory = new BlisMemory_1.BlisMemory(context);
                var userInput = reginput.message ? reginput.message.text.trim() : null;
                /** Process result before sending to user */
                var ProcessResult = function (context, cb, responses, teachAction, actionData) {
                    var _this = this;
                    // Some commands require taking a post command TeachAction (if user is in teach mode)
                    if (inTeach && teachAction) {
                        if (teachAction == Consts_1.TeachAction.RETRAIN) {
                            // Send command response out of band
                            responses.push("Retraining...");
                            Utils_1.Utils.SendResponses(context, responses);
                            // Retrain the model
                            that.blisClient.Retrain(context.state[Consts_1.UserStates.APP], context.state[Consts_1.UserStates.SESSION])
                                .then(function (takeTurnResponse) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                return tslib_1.__generator(this, function (_a) {
                                    // Continue teach session
                                    TakeTurnCallback(takeTurnResponse);
                                    return [2 /*return*/];
                                });
                            }); })
                                .catch(function (error) {
                                that.SendResult(context, cb, [error]);
                            });
                        }
                        else if (teachAction == Consts_1.TeachAction.PICKACTION && actionData != null) {
                            // Send command response out of band
                            responses.push("Retraining...");
                            Utils_1.Utils.SendResponses(context, responses);
                            // Retrain the model
                            that.blisClient.Retrain(context.state[Consts_1.UserStates.APP], context.state[Consts_1.UserStates.SESSION])
                                .then(function (takeTurnResponse) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                return tslib_1.__generator(this, function (_a) {
                                    /// Take the next turn
                                    that.TakeTurn(context, userInput, actionData, TakeTurnCallback);
                                    return [2 /*return*/];
                                });
                            }); })
                                .catch(function (error) {
                                that.SendResult(context, cb, [error]);
                            });
                        }
                    }
                    else {
                        that.SendResult(context, cb, responses);
                    }
                };
                /** Process Label Entity Step */
                var ProcessLabelEntity = function (ttResponse, responses) {
                    BlisDebug_1.BlisDebug.Verbose("ProcessLabelEntity");
                    if (ttResponse.teachError) {
                        var title = "**ERROR**\n\n";
                        var body = "Input did not match original text. Let's try again.\n\n";
                        responses.push(Utils_1.Utils.MakeHero(title, body, null, null));
                    }
                    else {
                        memory.RememberTrainStep(Consts_1.SaveStep.INPUT, userInput);
                        memory.RememberLastStep(Consts_1.SaveStep.INPUT, userInput);
                    }
                    var cardtitle = "Teach Step: Detected Entities";
                    if (ttResponse.teachLabelEntities.length == 0) {
                        // Look for suggested entity in previous response
                        var lastResponse = memory.LastStep(Consts_1.SaveStep.RESPONSE);
                        var suggestedEntity = Action_1.Action.GetEntitySuggestion(lastResponse);
                        if (suggestedEntity) {
                            // If one exist let user pick it 
                            responses.push("[" + suggestedEntity + " " + userInput + "]");
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
                            var entityName = memory.EntityId2Name(labelEntity.id);
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
                var ProcessLabelAction = function (ttResponse, responses) {
                    BlisDebug_1.BlisDebug.Verbose("ProcessLabelEntity");
                    // If app contains no entities, LabelEntity skip is stepped, so input must still be saved
                    if (!memory.TrainStepInput()) {
                        // Only run if no suggested entity is found
                        memory.RememberTrainStep(Consts_1.SaveStep.INPUT, userInput);
                        memory.RememberLastStep(Consts_1.SaveStep.INPUT, userInput);
                    }
                    // If a SuggestedEntity (i.e. *entity) was in previous bot response, the entity wasn't already assigned
                    // and no different entities were selected by the user, call saveEntity API
                    var lastResponse = memory.LastStep(Consts_1.SaveStep.RESPONSE);
                    var entities = memory.LastStep(Consts_1.SaveStep.ENTITY);
                    var suggestedEntity = Action_1.Action.GetEntitySuggestion(lastResponse);
                    if (!entities && suggestedEntity && !memory.EntityValue(suggestedEntity)) {
                        var apiId = memory.APILookup(suggestedEntity);
                        if (apiId) {
                            // Find the saveEntity action and take it
                            for (var i in ttResponse.teachLabelActions) {
                                var labelAction = ttResponse.teachLabelActions[i];
                                if (labelAction.id == apiId) {
                                    var userInput_1 = (+i + 1).toString(); // Incriment string number
                                    memory.RememberLastStep(Consts_1.SaveStep.RESPONSE, userInput_1);
                                    memory.RememberTrainStep(Consts_1.SaveStep.ENTITY, memory.DumpEntities());
                                    that.TakeTurn(context, userInput_1, null, TakeTurnCallback);
                                    return;
                                }
                            }
                        }
                    }
                    memory.RememberTrainStep(Consts_1.SaveStep.ENTITY, memory.DumpEntities());
                    var title = "Teach Step: Select Action";
                    var body = ttResponse.teachLabelActions.length == 0 ? 'No actions matched' : 'Select Action by number or enter a new one';
                    responses.push(Utils_1.Utils.MakeHero(title, null, body, {
                        "Add Response": Consts_1.IntCommands.ADDRESPONSE,
                        "Add API": Consts_1.IntCommands.ADDAPICALL
                    }));
                    var choices = {};
                    if (ttResponse.teachLabelActions.length > 0) {
                        var body_1 = memory.DumpEntities() + "\n\n";
                        responses.push(Utils_1.Utils.MakeHero("Memory", null, body_1, null));
                        var msg = "";
                        var displayIndex = 1;
                        for (var i in ttResponse.teachLabelActions) {
                            var labelAction = ttResponse.teachLabelActions[i];
                            // Don't show internal API calls to developer
                            if (!that.IsInternalApi(labelAction.content)) {
                                if (labelAction.available) {
                                    var score = labelAction.score ? labelAction.score.toFixed(3) : "*UNKNOWN*";
                                    msg += "(" + displayIndex + ") " + labelAction.content + " _(" + labelAction.actionType.toUpperCase() + ")_ Score: " + score + "\n\n";
                                    choices[displayIndex] = (1 + Number(i)).toString();
                                }
                                else {
                                    msg += "(  ) " + labelAction.content + " _(" + labelAction.actionType.toUpperCase() + ")_ DISQUALIFIED\n\n";
                                }
                                displayIndex++;
                            }
                        }
                        responses.push(msg);
                        // Remember valid choices
                        memory.RememberLastStep(Consts_1.SaveStep.CHOICES, choices);
                    }
                };
                var TakeTurnCallback = function (ttResponse, error) {
                    BlisDebug_1.BlisDebug.Verbose("TakeTurnCallback");
                    if (error) {
                        ProcessResult(context, cb, [error]);
                        return;
                    }
                    var responses = [];
                    if (ttResponse.mode == Consts_1.TakeTurnModes.TEACH) {
                        if (ttResponse.teachStep == Consts_1.TeachStep.LABELENTITY) {
                            ProcessLabelEntity(ttResponse, responses);
                        }
                        else if (ttResponse.teachStep == Consts_1.TeachStep.LABELACTION) {
                            ProcessLabelAction(ttResponse, responses);
                        }
                        else {
                            responses.push("Unrecognized TeachStep " + ttResponse.teachStep);
                        }
                    }
                    else if (ttResponse.mode == Consts_1.TakeTurnModes.ACTION) {
                        var output = ttResponse.actions[0].content;
                        memory.RememberLastStep(Consts_1.SaveStep.RESPONSE, output);
                        // Clear any suggested entity hints from response
                        output = output ? output.replace(" !", " ") : output;
                        // Allow for dev to update
                        var outText = null;
                        if (that.blisCallback) {
                            outText = that.blisCallback(output, memory);
                        }
                        else {
                            outText = that.DefaultBlisCallback(output, memory);
                        }
                        if (inTeach) {
                            memory.RememberTrainStep(Consts_1.SaveStep.RESPONSE, outText);
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
                        ProcessResult(context, cb, responses);
                    }
                };
                if (reginput.message.text) {
                    Utils_1.Utils.SendTyping(_this.bot, address_1);
                    BlisDebug_1.BlisDebug.SetAddress(address_1);
                    // Check for Edit Commands
                    if (memory.CueCommand()) {
                        CommandHandler_1.CommandHandler.HandleCueCommand(context, userInput, function (responses, teachAction, actionData) {
                            ProcessResult(context, cb, responses, teachAction, actionData);
                        });
                    }
                    else if (userInput.startsWith('!')) {
                        CommandHandler_1.CommandHandler.HandleCommandLine(context, userInput, function (responses, teachAction, actionData) {
                            ProcessResult(context, cb, responses, teachAction, actionData);
                        });
                    }
                    else if (userInput.startsWith('~')) {
                        CommandHandler_1.CommandHandler.HandleIntCommand(context, userInput, function (responses, teachAction, actionData) {
                            ProcessResult(context, cb, responses, teachAction, actionData);
                        });
                    }
                    else if (userInput.startsWith('#')) {
                        var help = Help_1.BlisHelp.Get(userInput);
                        ProcessResult(context, cb, [help]);
                    }
                    else {
                        if (inTeach) {
                            // Check if user has limited set of choices
                            var choices = memory.LastStep(Consts_1.SaveStep.CHOICES);
                            if (choices && Object.keys(choices).length > 0) {
                                if (!choices[userInput]) {
                                    var msg = "Please select one of the action from above or click 'Add Action' for a new Action";
                                    ProcessResult(context, cb, [msg]);
                                    return;
                                }
                                userInput = choices[userInput];
                                memory.RememberLastStep(Consts_1.SaveStep.CHOICES, null);
                            }
                        }
                        else {
                            memory.RememberLastStep(Consts_1.SaveStep.INPUT, userInput);
                        }
                        _this.TakeTurn(context, userInput, null, TakeTurnCallback);
                    }
                }
                else if (reginput.message.attachments && reginput.message.attachments.length > 0) {
                    Utils_1.Utils.SendMessage(context, "Importing application...");
                    BlisAppContent_1.BlisAppContent.ImportAttachment(context, reginput.message.attachments[0], function (text) {
                        ProcessResult(context, cb, [text]);
                    });
                    return;
                }
            });
        }
        catch (error) {
            var errMsg = Utils_1.Utils.ErrorString(error);
            BlisDebug_1.BlisDebug.Error(errMsg);
            cb(error, null);
        }
    };
    BlisRecognizer.prototype.TakeTurn = function (context, payload, actionId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var card, response_1, card, response_2, card, response_3, expectedNextModes, requestBody, takeTurnResponse, response, takeTurnRequest, memory, action, apiString, _a, apiName, arg, api, memory, takeTurnRequest, response_4, error_1, errMsg;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Verbose("TakeTurn");
                        // Error checking
                        if (context.state[Consts_1.UserStates.APP] == null) {
                            card = Menu_1.Menu.Apps("No Application has been loaded..");
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
                        // If passed an existing actionId take a turn with that
                        if (actionId) {
                            expectedNextModes = [Consts_1.TakeTurnModes.CALLBACK, Consts_1.TakeTurnModes.ACTION, Consts_1.TakeTurnModes.TEACH];
                            requestBody = { 'selected-action-id': actionId };
                        }
                        else if (typeof payload == 'string') {
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
                        return [4 /*yield*/, this.TakeTurn(context, takeTurnRequest, null, cb)];
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
                        return [4 /*yield*/, this.TakeTurn(context, takeTurnRequest, null, cb)];
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