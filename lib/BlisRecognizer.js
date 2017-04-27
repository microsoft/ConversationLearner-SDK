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
                    this.intApiCallbacks[Consts_1.APICalls.SETTASK] = this.SetTaskCB;
                    this.intApiCallbacks[Consts_1.APICalls.AZUREFUNCTION] = this.CallAzureFuncCB;
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
        return apiName == Consts_1.APICalls.SAVEENTITY;
        // TEMP THINK MORE ABOUT THIS
        //  return (this.intApiCallbacks[apiName] != null);
    };
    BlisRecognizer.prototype.LoadUser = function (address, cb) {
        var _this = this;
        // TODO handle errors
        BlisUserState_1.BlisUserState.Get(this.bot, address, this.defaultApp, function (error, userState, isNew) {
            var context = new BlisContext_1.BlisContext(_this.bot, _this.blisClient, userState, address);
            if (isNew) {
                // Attempt to load the application
                BlisAppContent_1.BlisAppContent.Load(context, _this.defaultApp, function (responses) {
                    cb(responses, context);
                });
            }
            else {
                cb(null, context);
            }
        });
    };
    /** Send result to user */
    BlisRecognizer.prototype.SendResult = function (session, responses) {
        if (!responses) {
            BlisDebug_1.BlisDebug.Error("Send result with empty response");
            responses = [];
        }
        // Save user state
        BlisUserState_1.BlisUserState.Save(session.context);
        // Assume BLIS always wins for now 
        var result = { score: 1.0, responses: responses, intent: null };
        // Send callback
        session.recCb(null, result);
    };
    /** Process result before sending to user */
    BlisRecognizer.prototype.ProcessResult = function (session, responses, teachAction, actionData) {
        var _this = this;
        // Some commands require taking a post command TeachAction (if user is in teach mode)
        var inTeach = session.context.state[Consts_1.UserStates.TEACH];
        if (inTeach && teachAction) {
            if (teachAction == Consts_1.TeachAction.RETRAIN) {
                // Send command response out of band
                responses.push("Retraining...");
                Utils_1.Utils.SendResponses(session.context, responses);
                // Retrain the model
                session.context.client.Retrain(session.context.state[Consts_1.UserStates.APP], session.context.state[Consts_1.UserStates.SESSION])
                    .then(function (takeTurnResponse) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    return tslib_1.__generator(this, function (_a) {
                        // Continue teach session
                        this.TakeTurnCallback(session, takeTurnResponse);
                        return [2 /*return*/];
                    });
                }); })
                    .catch(function (error) {
                    _this.SendResult(session, [error]);
                });
            }
            else if (teachAction == Consts_1.TeachAction.PICKACTION && actionData != null) {
                // Send command response out of band
                responses.push("Retraining...");
                Utils_1.Utils.SendResponses(session.context, responses);
                // Retrain the model
                session.context.client.Retrain(session.context.state[Consts_1.UserStates.APP], session.context.state[Consts_1.UserStates.SESSION])
                    .then(function (takeTurnResponse) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    return tslib_1.__generator(this, function (_a) {
                        /// Take the next turn
                        this.TakeTurn(session, session.userInput, actionData);
                        return [2 /*return*/];
                    });
                }); })
                    .catch(function (error) {
                    _this.SendResult(session, [error]);
                });
            }
        }
        else {
            this.SendResult(session, responses);
        }
    };
    BlisRecognizer.prototype.TakeTurnCallback = function (session, ttResponse, error) {
        BlisDebug_1.BlisDebug.Verbose("TakeTurnCallback");
        var memory = new BlisMemory_1.BlisMemory(session.context);
        if (error) {
            var responses_1 = Menu_1.Menu.AddEditCards(session.context, [error]);
            this.ProcessResult(session, responses_1);
            return;
        }
        var responses = [];
        if (ttResponse.mode == Consts_1.TakeTurnModes.TEACH) {
            if (ttResponse.teachStep == Consts_1.TeachStep.LABELENTITY) {
                this.ProcessLabelEntity(session, ttResponse, responses);
            }
            else if (ttResponse.teachStep == Consts_1.TeachStep.LABELACTION) {
                this.ProcessLabelAction(session, ttResponse, responses);
            }
            else {
                responses.push("Unrecognized TeachStep " + ttResponse.teachStep);
            }
        }
        else if (ttResponse.mode == Consts_1.TakeTurnModes.ACTION) {
            var output = ttResponse.actions[0].content;
            memory.RememberLastStep(Consts_1.SaveStep.RESPONSE, output);
            // Clear any suggested entity hints from response  TODO - this seems outdate
            output = output ? output.replace(" !", " ") : output;
            // Allow for dev to update
            var outText = null;
            if (this.blisCallback) {
                outText = this.blisCallback(output, memory);
            }
            else {
                outText = this.DefaultBlisCallback(output, memory);
            }
            var inTeach = session.context.state[Consts_1.UserStates.TEACH];
            if (inTeach) {
                memory.RememberTrainStep(Consts_1.SaveStep.RESPONSE, outText);
                responses.push(Utils_1.Utils.MakeHero('Trained Response:', outText + "\n\n", "Type next user input for this Dialog or", { "Dialog Complete": Command_1.IntCommands.DONETEACH }));
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
            this.ProcessResult(session, responses);
        }
    };
    /** Process Label Entity Training Step */
    BlisRecognizer.prototype.ProcessLabelEntity = function (session, ttResponse, responses) {
        BlisDebug_1.BlisDebug.Verbose("ProcessLabelEntity");
        var memory = new BlisMemory_1.BlisMemory(session.context);
        if (ttResponse.teachError) {
            var title = "**ERROR**\n\n";
            var body = "Input did not match original text. Let's try again.\n\n";
            responses.push(Utils_1.Utils.MakeHero(title, body, null, null));
        }
        else {
            memory.RememberTrainStep(Consts_1.SaveStep.INPUT, session.userInput);
            memory.RememberLastStep(Consts_1.SaveStep.INPUT, session.userInput);
        }
        var cardtitle = "Teach Step: Detected Entities";
        if (ttResponse.teachLabelEntities.length == 0) {
            // Look for suggested entity in previous response
            var lastResponse = memory.LastStep(Consts_1.SaveStep.RESPONSE);
            var suggestedEntity = Action_1.Action.GetEntitySuggestion(lastResponse);
            if (suggestedEntity) {
                // If one exist let user pick it 
                responses.push("[" + suggestedEntity + " " + session.userInput + "]");
                var body = "Click Correct if suggested entity is valid or indicate entities in input string";
                responses.push(Utils_1.Utils.MakeHero(cardtitle, null, body, { "Correct": "1",
                    "Help": Command_1.HelpCommands.PICKENTITY
                }));
            }
            else {
                var cardsub = "No new entities found.\n\n";
                var cardtext = "Click None if correct or indicate entities in input string";
                responses.push(Utils_1.Utils.MakeHero(cardtitle, cardsub, cardtext, {
                    "None": "1",
                    "Help": Command_1.HelpCommands.PICKENTITY
                }));
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
            responses.push(Utils_1.Utils.MakeHero(cardtitle, null, body, { "Correct": "1", "Help": Command_1.HelpCommands.PICKENTITY }));
        }
    };
    /** Process Label Action Training Step */
    BlisRecognizer.prototype.ProcessLabelAction = function (session, ttResponse, responses) {
        BlisDebug_1.BlisDebug.Verbose("ProcessLabelEntity");
        var memory = new BlisMemory_1.BlisMemory(session.context);
        // If app contains no entities, LabelEntity skip is stepped, so input must still be saved
        if (!memory.TrainStepInput()) {
            // Only run if no suggested entity is found
            memory.RememberTrainStep(Consts_1.SaveStep.INPUT, session.userInput);
            memory.RememberLastStep(Consts_1.SaveStep.INPUT, session.userInput);
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
                        var userInput = (+i + 1).toString(); // Incriment string number
                        memory.RememberLastStep(Consts_1.SaveStep.RESPONSE, userInput);
                        memory.RememberTrainStep(Consts_1.SaveStep.ENTITY, memory.DumpEntities());
                        this.TakeTurn(session, userInput, null);
                        return;
                    }
                }
            }
        }
        memory.RememberTrainStep(Consts_1.SaveStep.ENTITY, memory.DumpEntities());
        var title = "Teach Step: Select Action";
        var body = ttResponse.teachLabelActions.length == 0 ? 'No actions matched' : 'Select Action by number or enter a new one';
        responses.push(Utils_1.Utils.MakeHero(title, null, body, {
            "Add Response": Command_1.CueCommands.ADDRESPONSE,
            "Add API": Command_1.CueCommands.ADDAPICALL
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
                if (!this.IsInternalApi(labelAction.content)) {
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
    BlisRecognizer.prototype.recognize = function (reginput, recCb) {
        var _this = this;
        try {
            if (!reginput || !reginput.message) {
                return;
            }
            var address_1 = reginput.message.address;
            this.LoadUser(address_1, function (responses, context) {
                var memory = context.Memory();
                var userInput = reginput.message ? reginput.message.text.trim() : null;
                var session = new RecSession(context, userInput, recCb);
                if (reginput.message.text) {
                    Utils_1.Utils.SendTyping(_this.bot, address_1);
                    BlisDebug_1.BlisDebug.SetAddress(address_1);
                    // HELP
                    if (Command_1.Command.IsHelpCommand(userInput)) {
                        var help = Help_1.BlisHelp.Get(userInput);
                        _this.ProcessResult(session, help);
                        return;
                    }
                    // Handle cue commands (do this first so can stack cues)
                    if (Command_1.Command.IsCueCommand(userInput)) {
                        CommandHandler_1.CommandHandler.HandleCueCommand(context, userInput, function (responses, teachAction, actionData) {
                            _this.ProcessResult(session, responses, teachAction, actionData);
                        });
                    }
                    else if (memory.CueCommand()) {
                        CommandHandler_1.CommandHandler.ProcessCueCommand(context, userInput, function (responses, teachAction, actionData) {
                            _this.ProcessResult(session, responses, teachAction, actionData);
                        });
                    }
                    else if (Command_1.Command.IsLineCommand(userInput)) {
                        CommandHandler_1.CommandHandler.HandleLineCommand(context, userInput, function (responses, teachAction, actionData) {
                            _this.ProcessResult(session, responses, teachAction, actionData);
                        });
                    }
                    else if (Command_1.Command.IsIntCommand(userInput)) {
                        CommandHandler_1.CommandHandler.HandleIntCommand(context, userInput, function (responses, teachAction, actionData) {
                            _this.ProcessResult(session, responses, teachAction, actionData);
                        });
                    }
                    else if (!context.state[Consts_1.UserStates.SESSION]) {
                        // If error was thrown will be in responses
                        if (!responses)
                            responses = [];
                        responses = responses.concat(Menu_1.Menu.AppPanel('No App Loaded', 'Load or Create one'));
                        _this.ProcessResult(session, responses);
                        return;
                    }
                    else {
                        if (context.state[Consts_1.UserStates.TEACH]) {
                            // Check if user has limited set of choices
                            var choices = memory.LastStep(Consts_1.SaveStep.CHOICES);
                            if (choices && Object.keys(choices).length > 0) {
                                if (!choices[userInput]) {
                                    var msg = "Please select one of the action from above or click 'Add Action' for a new Action";
                                    _this.ProcessResult(session, [msg]);
                                    return;
                                }
                                userInput = choices[userInput];
                                memory.RememberLastStep(Consts_1.SaveStep.CHOICES, null);
                            }
                        }
                        else {
                            memory.RememberLastStep(Consts_1.SaveStep.INPUT, userInput);
                        }
                        _this.TakeTurn(session, userInput, null);
                    }
                }
                else if (reginput.message.attachments && reginput.message.attachments.length > 0) {
                    Utils_1.Utils.SendMessage(context, "Importing application...");
                    BlisAppContent_1.BlisAppContent.ImportAttachment(context, reginput.message.attachments[0], function (text) {
                        _this.ProcessResult(session, [text]);
                    });
                    return;
                }
            });
        }
        catch (error) {
            var errMsg = Utils_1.Utils.ErrorString(error);
            BlisDebug_1.BlisDebug.Error(errMsg);
            recCb(error, null);
        }
    };
    BlisRecognizer.prototype.TakeTurn = function (session, input, actionId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var card, response_1, response_2, response_3, expectedNextModes, requestBody, takeTurnResponse, response, takeTurnRequest, memory, action, apiString, apiName, args, api, memory, takeTurnRequest, response_4, error_1, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Verbose("TakeTurn");
                        session.userInput = (typeof input == 'string') ? input : null;
                        // Error checking
                        if (session.context.state[Consts_1.UserStates.APP] == null) {
                            card = Menu_1.Menu.AppPanel("No Application has been loaded..");
                            response_1 = this.ErrorResponse(card[0]);
                            this.TakeTurnCallback(session, response_1);
                            return [2 /*return*/];
                        }
                        else if (!session.context.state[Consts_1.UserStates.MODEL] && !session.context.state[Consts_1.UserStates.TEACH]) {
                            response_2 = this.ErrorResponse(Menu_1.Menu.Home("This application needs to be trained first."));
                            this.TakeTurnCallback(session, response_2);
                            return [2 /*return*/];
                        }
                        else if (!session.context.state[Consts_1.UserStates.SESSION]) {
                            response_3 = this.ErrorResponse(Menu_1.Menu.Home("The app has not been started"));
                            this.TakeTurnCallback(session, response_3);
                            return [2 /*return*/];
                        }
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
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 11, , 12]);
                        return [4 /*yield*/, this.blisClient.SendTurnRequest(session.context.state, requestBody)];
                    case 2:
                        takeTurnResponse = _a.sent();
                        // Check that expected mode matches
                        if (!takeTurnResponse.mode || expectedNextModes.indexOf(takeTurnResponse.mode) < 0) {
                            response = new TakeTurnResponse_1.TakeTurnResponse({ mode: Consts_1.TakeTurnModes.ERROR, error: "Unexpected mode " + takeTurnResponse.mode });
                            this.TakeTurnCallback(session, response);
                            return [2 /*return*/];
                        }
                        if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.CALLBACK)) return [3 /*break*/, 4];
                        takeTurnRequest = void 0;
                        memory = new BlisMemory_1.BlisMemory(session.context);
                        if (this.LuisCallback) {
                            takeTurnRequest = this.LuisCallback(takeTurnResponse.originalText, takeTurnResponse.entities, memory);
                        }
                        else {
                            takeTurnRequest = this.DefaultLuisCallback(takeTurnResponse.originalText, takeTurnResponse.entities, memory);
                        }
                        return [4 /*yield*/, this.TakeTurn(session, takeTurnRequest, null)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 10];
                    case 4:
                        if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.TEACH)) return [3 /*break*/, 5];
                        this.TakeTurnCallback(session, takeTurnResponse);
                        return [2 /*return*/];
                    case 5:
                        if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.ACTION)) return [3 /*break*/, 10];
                        action = takeTurnResponse.actions[0];
                        if (!(action.actionType == Consts_1.ActionTypes.TEXT)) return [3 /*break*/, 6];
                        this.TakeTurnCallback(session, takeTurnResponse);
                        return [2 /*return*/];
                    case 6:
                        if (!(action.actionType == Consts_1.ActionTypes.API)) return [3 /*break*/, 10];
                        apiString = action.content;
                        apiName = apiString.split(' ')[0];
                        args = Utils_1.Utils.RemoveWords(apiString, 1);
                        // Make any entity substitutions
                        args = session.context.Memory().SubstituteEntities(args);
                        api = this.intApiCallbacks[apiName];
                        // Then check user defined APIs
                        if (!api && this.apiCallbacks) {
                            api = this.apiCallbacks[apiName];
                        }
                        if (!api) return [3 /*break*/, 9];
                        memory = new BlisMemory_1.BlisMemory(session.context);
                        return [4 /*yield*/, api(session.context, memory, args)];
                    case 7:
                        takeTurnRequest = _a.sent();
                        // If in teach mode, remember the step
                        if (session.context.state[Consts_1.UserStates.TEACH]) {
                            memory.RememberTrainStep(Consts_1.SaveStep.API, apiName + " " + args);
                        }
                        BlisDebug_1.BlisDebug.Verbose("API: {" + apiName + " " + args + "}");
                        expectedNextModes = [Consts_1.TakeTurnModes.ACTION, Consts_1.TakeTurnModes.TEACH];
                        return [4 /*yield*/, this.TakeTurn(session, takeTurnRequest, null)];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 10];
                    case 9:
                        response_4 = this.ErrorResponse("API " + apiName + " not defined");
                        this.TakeTurnCallback(session, response_4);
                        _a.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        error_1 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_1);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        this.TakeTurnCallback(session, null, errMsg);
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    //====================================================
    // Built in API GetActions
    //====================================================
    BlisRecognizer.prototype.SaveEntityCB = function (context, memory, entityName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var lastInput, entityIds;
            return tslib_1.__generator(this, function (_a) {
                lastInput = memory.LastStep(Consts_1.SaveStep.INPUT);
                memory.RememberEntityByName(entityName, lastInput);
                entityIds = memory.EntityIds();
                return [2 /*return*/, new TakeTurnRequest_1.TakeTurnRequest({ entities: entityIds })];
            });
        });
    };
    BlisRecognizer.prototype.CallAzureFuncCB = function (context, memory, args) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, funct, query, output, entityIds;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Disallow repetative API calls in case BLIS gets stuck TODO
                        /*     var lastResponse = memory.LastStep(SaveStep.RESPONSE);
                             if (lastResponse == args)
                             {
                                 return;
                             }*/
                        memory.ForgetEntityByName("company", null); // TEMP
                        _a = args.split(' '), funct = _a[0], query = _a[1];
                        return [4 /*yield*/, AzureFunctions_1.AzureFunctions.Call(funct, query)];
                    case 1:
                        output = _b.sent();
                        if (output) {
                            Utils_1.Utils.SendMessage(context, output);
                        }
                        entityIds = memory.EntityIds();
                        memory.RememberLastStep(Consts_1.SaveStep.RESPONSE, args); // TEMP try remember last apicall
                        return [2 /*return*/, new TakeTurnRequest_1.TakeTurnRequest({ entities: entityIds })];
                }
            });
        });
    };
    // Set a task to the "ON" state
    BlisRecognizer.prototype.SetTaskCB = function (context, memory, entityName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityIds;
            return tslib_1.__generator(this, function (_a) {
                memory.RememberEntityByName(entityName, "ON");
                entityIds = memory.EntityIds();
                return [2 /*return*/, new TakeTurnRequest_1.TakeTurnRequest({ entities: entityIds })];
            });
        });
    };
    // Set a task to the "OFF" state
    BlisRecognizer.prototype.ClearTaskCB = function (context, memory, entityName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityIds;
            return tslib_1.__generator(this, function (_a) {
                memory.ForgetEntityByName(entityName, null);
                entityIds = memory.EntityIds();
                return [2 /*return*/, new TakeTurnRequest_1.TakeTurnRequest({ entities: entityIds })];
            });
        });
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
            // If entity is associated with a task, make sure task is active
            if (entity.metadata && entity.metadata.task) {
                // If task is no longer active, clear the memory
                if (!memory.WasRemembered(entity.metadata.task)) {
                    memory.ForgetEntity(entity);
                }
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