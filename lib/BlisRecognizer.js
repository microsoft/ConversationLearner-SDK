"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var TakeTurnRequest_1 = require("./Model/TakeTurnRequest");
var BlisAppContent_1 = require("./Model/BlisAppContent");
var BlisClient_1 = require("./BlisClient");
var BlisMemory_1 = require("./BlisMemory");
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
            return tslib_1.__generator(this, function (_a) {
                try {
                    BlisDebug_1.BlisDebug.Log("Creating client...");
                    this.blisClient = new BlisClient_1.BlisClient(options.serviceUri, options.user, options.secret, options.azureFunctionsUrl);
                    this.LuisCallback = options.luisCallback;
                    this.apiCallbacks = options.apiCallbacks;
                    this.intApiCallbacks[Consts_1.APICalls.SETTASK] = this.SetTaskCB;
                    this.intApiCallbacks[Consts_1.APICalls.AZUREFUNCTION] = this.CallAzureFuncCB;
                    this.connector = options.connector;
                    this.defaultApp = options.appId;
                    this.blisCallback = options.blisCallback ? options.blisCallback : this.DefaultBlisCallback;
                }
                catch (error) {
                    BlisDebug_1.BlisDebug.Error(error);
                }
                return [2 /*return*/];
            });
        });
    };
    BlisRecognizer.prototype.LoadUser = function (session, cb) {
        var context = new BlisContext_1.BlisContext(this.bot, this.blisClient, session);
        // Is new?
        if (!session.userData.Blis) {
            context.InitState(this.defaultApp);
            // Attempt to load the application
            BlisAppContent_1.BlisAppContent.Load(context, this.defaultApp, function (responses) {
                cb(responses, context);
            });
        }
        else {
            cb(null, context);
        }
    };
    /** Send result to user */
    BlisRecognizer.prototype.SendResult = function (recsess, responses, intent, entities) {
        if (!responses && !intent) {
            BlisDebug_1.BlisDebug.Error("Send result with empty response");
            responses = [];
        }
        var result = { responses: responses, intent: intent, entities: entities };
        // Send callback
        recsess.recCb(null, result);
    };
    /** Process result before sending to user */
    BlisRecognizer.prototype.ProcessResult = function (recsess, responses, intent, entities, teachAction, actionData) {
        var _this = this;
        // Some commands require taking a post command TeachAction (if user is in teach mode)
        var inTeach = recsess.context.State(Consts_1.UserStates.TEACH);
        if (inTeach && teachAction) {
            if (teachAction == Consts_1.TeachAction.RETRAIN) {
                // Send command response out of band
                responses.push("Retraining...");
                Utils_1.Utils.SendResponses(recsess.context, responses);
                // Retrain the model
                recsess.context.client.Retrain(recsess.context.State(Consts_1.UserStates.APP), recsess.context.State(Consts_1.UserStates.SESSION))
                    .then(function (takeTurnResponse) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    return tslib_1.__generator(this, function (_a) {
                        // Continue teach session
                        this.TakeTurnCallback(recsess, takeTurnResponse);
                        return [2 /*return*/];
                    });
                }); })
                    .catch(function (error) {
                    _this.SendResult(recsess, [error]);
                });
            }
            else if (teachAction == Consts_1.TeachAction.PICKACTION && actionData != null) {
                // Send command response out of band
                responses.push("Retraining...");
                Utils_1.Utils.SendResponses(recsess.context, responses);
                // Retrain the model
                recsess.context.client.Retrain(recsess.context.State(Consts_1.UserStates.APP), recsess.context.State(Consts_1.UserStates.SESSION))
                    .then(function (takeTurnResponse) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    return tslib_1.__generator(this, function (_a) {
                        // Take the next turn
                        this.TakeTurn(recsess, recsess.userInput, actionData);
                        return [2 /*return*/];
                    });
                }); })
                    .catch(function (error) {
                    _this.SendResult(recsess, [error]);
                });
            }
        }
        else {
            this.SendResult(recsess, responses, intent, entities);
        }
    };
    BlisRecognizer.prototype.TakeTurnCallback = function (recsess, ttResponse, error) {
        BlisDebug_1.BlisDebug.Verbose("TakeTurnCallback");
        var memory = new BlisMemory_1.BlisMemory(recsess.context.session);
        if (error) {
            var responses_1 = Menu_1.Menu.AddEditCards(recsess.context, [error]);
            this.ProcessResult(recsess, responses_1, null, null);
            return;
        }
        var responses = [];
        if (ttResponse.mode == Consts_1.TakeTurnModes.TEACH) {
            if (ttResponse.teachStep == Consts_1.TeachStep.LABELENTITY) {
                this.ProcessLabelEntity(recsess, ttResponse, responses);
            }
            else if (ttResponse.teachStep == Consts_1.TeachStep.LABELACTION) {
                this.ProcessLabelAction(recsess, ttResponse, responses);
            }
            else {
                responses.push("Unrecognized TeachStep " + ttResponse.teachStep);
            }
        }
        else if (ttResponse.mode == Consts_1.TakeTurnModes.ACTION) {
            var output = ttResponse.actions[0].content;
            memory.RememberLastStep(Consts_1.SaveStep.RESPONSES, output);
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
            var inTeach = recsess.context.State(Consts_1.UserStates.TEACH);
            if (inTeach) {
                memory.RememberTrainStep(Consts_1.SaveStep.RESPONSES, outText);
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
            this.ProcessResult(recsess, responses, null, null);
        }
    };
    /** Remove internal API calls from actions available to developer */
    /*  TODO  no longer used
    private RemoveInternalAPIs(labelActions : LabelAction[])  : LabelAction[]
    {
        let outActions = [];
        let sumScore = 0;
        for (let i in labelActions)
        {
            let labelAction = labelActions[i];
            // Don't show internal API calls to developer
            if (!this.IsInternalApi(labelAction.content))
            {
                outActions.push(labelAction);
                if (labelAction.available)
                {
                    sumScore += labelAction.score;
                }
            }
        }

        // Now renormalize scores after removing internal API calls
        if (sumScore <= 0) return outActions;

        for (let labelAction of outActions)
        {
            labelAction.score = labelAction.score / sumScore;
        }

        return outActions;
    }*/
    /** Process Label Entity Training Step */
    BlisRecognizer.prototype.ProcessLabelEntity = function (recsess, ttResponse, responses) {
        BlisDebug_1.BlisDebug.Verbose("ProcessLabelEntity");
        var memory = new BlisMemory_1.BlisMemory(recsess.context.session);
        if (ttResponse.teachError) {
            var body = "Input did not match original text. Let's try again.\n\n";
            responses.push(Utils_1.Utils.ErrorCard(body));
        }
        else {
            memory.RememberTrainStep(Consts_1.SaveStep.INPUT, recsess.userInput);
            memory.RememberLastStep(Consts_1.SaveStep.INPUT, recsess.userInput);
        }
        var cardtitle = "Teach Step: Detected Entities";
        if (ttResponse.teachLabelEntities.length == 0) {
            // Look for suggested entity in previous response
            var lastResponses = memory.LastStep(Consts_1.SaveStep.RESPONSES);
            var suggestedEntity = Action_1.Action.GetEntitySuggestion(lastResponses);
            if (suggestedEntity) {
                // Add suggested entity as a choice
                var suggestedText = "[" + suggestedEntity + " " + recsess.userInput + "]";
                responses.push(suggestedText);
                var body = "Click Correct if suggested entity is valid or indicate entities in input string";
                responses.push(Utils_1.Utils.MakeHero(cardtitle, null, body, { "Correct": suggestedText,
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
    BlisRecognizer.prototype.ProcessLabelAction = function (recsess, ttResponse, responses) {
        BlisDebug_1.BlisDebug.Verbose("ProcessLabelEntity");
        var memory = new BlisMemory_1.BlisMemory(recsess.context.session);
        // If app contains no entities, LabelEntity skip is stepped, so input must still be saved
        if (!memory.TrainStepInput()) {
            // Only run if no suggested entity is found
            memory.RememberTrainStep(Consts_1.SaveStep.INPUT, recsess.userInput);
            memory.RememberLastStep(Consts_1.SaveStep.INPUT, recsess.userInput);
        }
        memory.RememberTrainStep(Consts_1.SaveStep.ENTITY, memory.DumpEntities());
        var title = "Teach Step: Select Action";
        var body = ttResponse.teachLabelActions.length == 0 ? 'No actions matched' : 'Select Action by number or enter a new one';
        // TODO support API and RESPONSE types, not just base
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
                var type = labelAction.actionType.toUpperCase();
                type += labelAction.waitAction ? " WAIT" : "";
                if (labelAction.available) {
                    var score = labelAction.score ? labelAction.score.toFixed(3) : "*UNKNOWN*";
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
            memory.RememberLastStep(Consts_1.SaveStep.CHOICES, choices);
        }
    };
    BlisRecognizer.prototype.recognize = function (reginput, recCb) {
        // Always recognize, but score is less than 1.0 so prompts can still win
        var result = { recognizer: this, score: 0.4, intent: null, entities: null };
        // Send callback
        recCb(null, result);
    };
    BlisRecognizer.prototype.invoke = function (session, recCb) {
        var _this = this;
        try {
            if (!session || !session.message) {
                return;
            }
            var address_1 = session.message.address;
            this.LoadUser(session, function (responses, context) {
                var memory = context.Memory();
                var userInput = session.message ? session.message.text.trim() : null;
                var recsess = new RecSession(context, userInput, recCb);
                if (session.message.text) {
                    Utils_1.Utils.SendTyping(_this.bot, address_1);
                    BlisDebug_1.BlisDebug.SetAddress(address_1);
                    // HELP
                    if (Command_1.Command.IsHelpCommand(userInput)) {
                        var help = Help_1.BlisHelp.Get(userInput);
                        _this.ProcessResult(recsess, help, null, null);
                        return;
                    }
                    // Handle cue commands (do this first so can stack cues)
                    if (Command_1.Command.IsCueCommand(userInput)) {
                        CommandHandler_1.CommandHandler.HandleCueCommand(context, userInput, function (responses, teachAction, actionData) {
                            _this.ProcessResult(recsess, responses, null, null, teachAction, actionData);
                        });
                    }
                    else if (memory.CueCommand()) {
                        CommandHandler_1.CommandHandler.ProcessCueCommand(context, userInput, function (responses, teachAction, actionData) {
                            _this.ProcessResult(recsess, responses, null, null, teachAction, actionData);
                        });
                    }
                    else if (Command_1.Command.IsLineCommand(userInput)) {
                        CommandHandler_1.CommandHandler.HandleLineCommand(context, userInput, function (responses, teachAction, actionData) {
                            _this.ProcessResult(recsess, responses, null, null, teachAction, actionData);
                        });
                    }
                    else if (Command_1.Command.IsIntCommand(userInput)) {
                        CommandHandler_1.CommandHandler.HandleIntCommand(context, userInput, function (responses, teachAction, actionData) {
                            _this.ProcessResult(recsess, responses, null, null, teachAction, actionData);
                        });
                    }
                    else if (!context.State(Consts_1.UserStates.APP)) {
                        // If error was thrown will be in responses
                        if (!responses)
                            responses = [];
                        responses = responses.concat(Menu_1.Menu.AppPanel('No App Loaded', 'Load or Create one'));
                        _this.ProcessResult(recsess, responses, null, null);
                        return;
                    }
                    else if (!context.State(Consts_1.UserStates.SESSION)) {
                        // If prev error was thrown will be in responses
                        if (!responses)
                            responses = [];
                        responses = responses.concat(Menu_1.Menu.Home("The app has not been started"));
                        _this.ProcessResult(recsess, responses, null, null);
                        return;
                    }
                    else {
                        if (context.State(Consts_1.UserStates.TEACH)) {
                            // Check if user has limited set of choices
                            var choices = memory.LastStep(Consts_1.SaveStep.CHOICES);
                            if (choices && Object.keys(choices).length > 0) {
                                if (!choices[userInput]) {
                                    var msg = "Please select one of the action from above or click 'Add Action' for a new Action";
                                    _this.ProcessResult(recsess, [msg], null, null);
                                    return;
                                }
                                // Convert numeric choice to actionId
                                var actionId = choices[userInput];
                                memory.RememberLastStep(Consts_1.SaveStep.CHOICES, null);
                                _this.TakeTurn(recsess, null, actionId);
                            }
                            else {
                                _this.TakeTurn(recsess, userInput, null);
                            }
                        }
                        else {
                            memory.RememberLastStep(Consts_1.SaveStep.INPUT, userInput);
                            _this.TakeTurn(recsess, userInput, null);
                        }
                    }
                }
                else if (session.message.attachments && session.message.attachments.length > 0) {
                    Utils_1.Utils.SendMessage(context, "Importing application...");
                    BlisAppContent_1.BlisAppContent.ImportAttachment(context, session.message.attachments[0], function (text) {
                        _this.ProcessResult(recsess, [text], null, null);
                    });
                    return;
                }
            });
        }
        catch (error) {
            BlisDebug_1.BlisDebug.Error(error);
            recCb(error, null);
        }
    };
    BlisRecognizer.prototype.TakeTurn = function (recsess, input, actionId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var card_1, response_1, response_2, response_3, expectedNextModes, requestBody, takeTurnResponse, response, takeTurnRequest, memory, action, memory, entityIds, takeTurnRequest, apiString, apiName, args, intentName, iArgs, entities, api, takeTurnRequest, card, response_4, error_1, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Verbose("TakeTurn");
                        recsess.userInput = (typeof input == 'string') ? input : null;
                        // Error checking
                        if (recsess.context.State(Consts_1.UserStates.APP) == null) {
                            card_1 = Menu_1.Menu.AppPanel("No Application has been loaded..");
                            response_1 = this.ErrorResponse(card_1[0]);
                            this.TakeTurnCallback(recsess, response_1);
                            return [2 /*return*/];
                        }
                        else if (!recsess.context.State(Consts_1.UserStates.MODEL) && !recsess.context.State(Consts_1.UserStates.TEACH)) {
                            response_2 = this.ErrorResponse(Menu_1.Menu.Home("This application needs to be trained first."));
                            this.TakeTurnCallback(recsess, response_2);
                            return [2 /*return*/];
                        }
                        else if (!recsess.context.State(Consts_1.UserStates.SESSION)) {
                            response_3 = this.ErrorResponse(Menu_1.Menu.Home("The app has not been started"));
                            this.TakeTurnCallback(recsess, response_3);
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
                        _a.trys.push([1, 18, , 19]);
                        return [4 /*yield*/, this.blisClient.SendTurnRequest(recsess.context.State(Consts_1.UserStates.APP), recsess.context.State(Consts_1.UserStates.SESSION), requestBody)];
                    case 2:
                        takeTurnResponse = _a.sent();
                        BlisDebug_1.BlisDebug.Verbose("TakeTurnResponse: " + takeTurnResponse.mode);
                        // Check that expected mode matches
                        if (!takeTurnResponse.mode || expectedNextModes.indexOf(takeTurnResponse.mode) < 0) {
                            response = new TakeTurnResponse_1.TakeTurnResponse({ mode: Consts_1.TakeTurnModes.ERROR, error: "Unexpected mode " + takeTurnResponse.mode });
                            this.TakeTurnCallback(recsess, response);
                            return [2 /*return*/];
                        }
                        if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.CALLBACK)) return [3 /*break*/, 4];
                        takeTurnRequest = void 0;
                        memory = new BlisMemory_1.BlisMemory(recsess.context.session);
                        if (this.LuisCallback) {
                            takeTurnRequest = this.LuisCallback(takeTurnResponse.originalText, takeTurnResponse.entities, memory);
                        }
                        else {
                            takeTurnRequest = this.DefaultLuisCallback(takeTurnResponse.originalText, takeTurnResponse.entities, memory);
                        }
                        return [4 /*yield*/, this.TakeTurn(recsess, takeTurnRequest, null)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 17];
                    case 4:
                        if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.TEACH)) return [3 /*break*/, 5];
                        this.TakeTurnCallback(recsess, takeTurnResponse);
                        return [2 /*return*/];
                    case 5:
                        if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.ACTION)) return [3 /*break*/, 17];
                        action = takeTurnResponse.actions[0];
                        memory = new BlisMemory_1.BlisMemory(recsess.context.session);
                        if (!(action.actionType == Consts_1.ActionTypes.TEXT)) return [3 /*break*/, 9];
                        this.TakeTurnCallback(recsess, takeTurnResponse);
                        if (!action.waitAction) return [3 /*break*/, 6];
                        memory.FinishTrainStep();
                        return [3 /*break*/, 8];
                    case 6:
                        entityIds = recsess.context.Memory().EntityIds();
                        takeTurnRequest = new TakeTurnRequest_1.TakeTurnRequest({ entities: entityIds });
                        expectedNextModes = [Consts_1.TakeTurnModes.ACTION, Consts_1.TakeTurnModes.TEACH];
                        return [4 /*yield*/, this.TakeTurn(recsess, takeTurnRequest, null)];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: return [2 /*return*/];
                    case 9:
                        if (!(action.actionType == Consts_1.ActionTypes.API)) return [3 /*break*/, 17];
                        apiString = action.content;
                        apiName = apiString.split(' ')[0];
                        args = Utils_1.Utils.RemoveWords(apiString, 1);
                        if (!(apiName == Consts_1.APICalls.FIREINTENT)) return [3 /*break*/, 11];
                        intentName = args.split(' ')[0];
                        iArgs = Utils_1.Utils.RemoveWords(args, 1);
                        entities = recsess.context.Memory().GetEntities(iArgs);
                        return [4 /*yield*/, this.ProcessResult(recsess, null, intentName, entities)];
                    case 10:
                        _a.sent();
                        return [2 /*return*/];
                    case 11:
                        // Make any entity substitutions
                        args = recsess.context.Memory().SubstituteEntities(args);
                        api = this.intApiCallbacks[apiName];
                        // Then check user defined APIs
                        if (!api && this.apiCallbacks) {
                            api = this.apiCallbacks[apiName];
                        }
                        if (!api) return [3 /*break*/, 16];
                        return [4 /*yield*/, api(recsess.context, memory, args)];
                    case 12:
                        takeTurnRequest = _a.sent();
                        // If in teach mode, remember the step
                        if (recsess.context.State(Consts_1.UserStates.TEACH)) {
                            memory.RememberTrainStep(Consts_1.SaveStep.APICALLS, apiName + " " + args);
                        }
                        BlisDebug_1.BlisDebug.Verbose("API: {" + apiName + " " + args + "}");
                        if (!!action.waitAction) return [3 /*break*/, 14];
                        expectedNextModes = [Consts_1.TakeTurnModes.ACTION, Consts_1.TakeTurnModes.TEACH];
                        return [4 /*yield*/, this.TakeTurn(recsess, takeTurnRequest, null)];
                    case 13:
                        _a.sent();
                        return [3 /*break*/, 15];
                    case 14:
                        if (recsess.context.State(Consts_1.UserStates.TEACH)) {
                            memory.FinishTrainStep();
                            card = Utils_1.Utils.MakeHero(null, null, "Type next user input for this Dialog or", { "Dialog Complete": Command_1.IntCommands.DONETEACH });
                            Utils_1.Utils.SendResponses(recsess.context, [card]);
                        }
                        _a.label = 15;
                    case 15: return [3 /*break*/, 17];
                    case 16:
                        response_4 = this.ErrorResponse("API " + apiName + " not defined");
                        this.TakeTurnCallback(recsess, response_4);
                        _a.label = 17;
                    case 17: return [3 /*break*/, 19];
                    case 18:
                        error_1 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_1);
                        this.TakeTurnCallback(recsess, null, errMsg);
                        return [3 /*break*/, 19];
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    //====================================================
    // Built in API calls
    //====================================================
    BlisRecognizer.prototype.CallAzureFuncCB = function (context, memory, args) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var errCard, _a, funct, query, output, entityIds;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!context.client.azureFunctionsUrl) return [3 /*break*/, 1];
                        errCard = Utils_1.Utils.ErrorCard("Attempt to call Azure Function with no URL.", "Must set 'azureFunctionsUrl' in Bot implimentation.");
                        Utils_1.Utils.SendMessage(context, errCard);
                        return [3 /*break*/, 3];
                    case 1:
                        _a = args.split(' '), funct = _a[0], query = _a[1];
                        return [4 /*yield*/, AzureFunctions_1.AzureFunctions.Call(context.client.azureFunctionsUrl, funct, query)];
                    case 2:
                        output = _b.sent();
                        if (output) {
                            Utils_1.Utils.SendMessage(context, output);
                        }
                        _b.label = 3;
                    case 3:
                        entityIds = memory.EntityIds();
                        memory.RememberLastStep(Consts_1.SaveStep.RESPONSES, args); // TEMP try remember last apicall
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