"use strict";
var tslib_1 = require("tslib");
var TakeTurnRequest_1 = require("./Model/TakeTurnRequest");
var BlisApp_1 = require("./Model/BlisApp");
var BlisClient_1 = require("./BlisClient");
var BlisMemory_1 = require("./BlisMemory");
var BlisDebug_1 = require("./BlisDebug");
var BlisUserState_1 = require("./BlisUserState");
var Action_1 = require("./Model/Action");
var Entity_1 = require("./Model/Entity");
var TrainDialog_1 = require("./Model/TrainDialog");
var Consts_1 = require("./Model/Consts");
var Help_1 = require("./Model/Help");
var TakeTurnResponse_1 = require("./Model/TakeTurnResponse");
var EditCommand_1 = require("./Model/EditCommand");
var Utils_1 = require("./Utils");
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
    BlisRecognizer.prototype.CueEditAction = function (userState, actionId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var editCommand, memory, action, card, error_1, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        editCommand = new EditCommand_1.EditCommand(Consts_1.Commands.EDITACTION, actionId);
                        memory = new BlisMemory_1.BlisMemory(userState);
                        memory.SetEditCommand(editCommand);
                        return [4 /*yield*/, this.blisClient.GetAction(userState[Consts_1.UserStates.APP], actionId)];
                    case 1:
                        action = _a.sent();
                        card = Utils_1.Utils.MakeHero("Edit Action", action.content, "Enter new Action context", null);
                        cb([card]);
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_1);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb(errMsg);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.CueEditEntity = function (userState, entityId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var editCommand, memory, entity, type, card, error_2, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        editCommand = new EditCommand_1.EditCommand(Consts_1.Commands.EDITENTITY, entityId);
                        memory = new BlisMemory_1.BlisMemory(userState);
                        memory.SetEditCommand(editCommand);
                        return [4 /*yield*/, this.blisClient.GetEntity(userState[Consts_1.UserStates.APP], entityId)];
                    case 1:
                        entity = _a.sent();
                        type = entity.luisPreName ? entity.luisPreName : entity.entityType;
                        card = Utils_1.Utils.MakeHero("Edit: (" + entity.name + ")", type, "Enter new Entity name", null);
                        cb([card]);
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_2);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb(errMsg);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.DebugHelp = function () {
        var text = "";
        text += Consts_1.Commands.DEBUG + "\n\n       Toggle debug mode\n\n";
        text += Consts_1.Commands.DELETEAPP + " {appId}\n\n       Delete specified application\n\n";
        text += Consts_1.Commands.DUMP + "\n\n       Show client state\n\n";
        text += Consts_1.Commands.ENTITIES + "\n\n       Return list of entities\n\n";
        text += Consts_1.Commands.ACTIONS + " {y/n}\n\n       Return list of actions. If 'Y' show IDs\n\n";
        text += Consts_1.Commands.TRAINDIALOGS + "\n\n       Return list of training dialogs\n\n";
        text += Consts_1.Commands.HELP + "\n\n       General help";
        return text;
    };
    BlisRecognizer.prototype.EndSession = function (userState, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var sessionId, modelId, error_3, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.blisClient.EndSession(userState[Consts_1.UserStates.APP], userState[Consts_1.UserStates.SESSION])];
                    case 1:
                        sessionId = _a.sent();
                        new BlisMemory_1.BlisMemory(userState).EndSession();
                        return [4 /*yield*/, this.blisClient.GetModel(userState[Consts_1.UserStates.APP])];
                    case 2:
                        modelId = _a.sent();
                        userState[Consts_1.UserStates.MODEL] = modelId;
                        cb(sessionId);
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_3);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb(errMsg);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /** Return text of current training steps */
    BlisRecognizer.prototype.TrainStepText = function (userState) {
        var memory = new BlisMemory_1.BlisMemory(userState);
        var trainSteps = memory.TrainSteps();
        var msg = "** New Dialog Summary **\n\n";
        msg += "-----------------------------\n\n";
        for (var _i = 0, trainSteps_1 = trainSteps; _i < trainSteps_1.length; _i++) {
            var trainstep = trainSteps_1[_i];
            msg += trainstep.input;
            if (trainstep.entity) {
                msg += "    _" + trainstep.entity + "_\n\n";
            }
            else {
                msg += "\n\n";
            }
            for (var _a = 0, _b = trainstep.api; _a < _b.length; _a++) {
                var api = _b[_a];
                msg += "     {" + api + "}\n\n";
            }
            msg += "     " + trainstep.response + "\n\n";
        }
        return msg;
    };
    BlisRecognizer.prototype.Help = function (command) {
        if (command) {
            // Don't require user to put ! in front of command
            if (!command.startsWith('!')) {
                command = "!" + command;
            }
            var comObj = Help_1.BlisHelp.CommandHelp(command);
            var msg = command + " " + comObj.args + "\n\n     " + comObj.description + "\n\n";
            if (comObj.examples && comObj.examples.length > 0) {
                msg += "For example:\n\n";
                for (var _i = 0, _a = comObj.examples; _i < _a.length; _i++) {
                    var example = _a[_i];
                    msg += "     " + example + "\n\n";
                }
            }
            return msg;
        }
        var text = "";
        for (var item in Consts_1.Commands) {
            var key = Consts_1.Commands[item];
            var comObj = Help_1.BlisHelp.CommandHelp(key);
            text += key + " " + comObj.args + "\n\n     " + comObj.description + "\n\n";
        }
        return text;
    };
    BlisRecognizer.prototype.NewSession = function (userState, teach, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var endId, sessionId, body, subtext, card, error_4, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to create new session, Teach = " + teach);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.blisClient.EndSession(userState[Consts_1.UserStates.APP], userState[Consts_1.UserStates.SESSION])];
                    case 2:
                        endId = _a.sent();
                        BlisDebug_1.BlisDebug.Log("Ended session " + endId);
                        return [4 /*yield*/, this.blisClient.StartSession(userState[Consts_1.UserStates.APP], teach)];
                    case 3:
                        sessionId = _a.sent();
                        new BlisMemory_1.BlisMemory(userState).StartSession(sessionId, teach);
                        BlisDebug_1.BlisDebug.Log("Started session " + sessionId);
                        if (teach) {
                            body = "Provide your first input for this teach dialog.\n\n\n\n";
                            subtext = "At any point type \"" + Consts_1.Commands.ABANDON + "\" to abort";
                            card = Utils_1.Utils.MakeHero("Teach mode started", subtext, body, null);
                            cb([card]);
                        }
                        else {
                            cb(["_Bot started..._"]);
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_4 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_4);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        userState[Consts_1.UserStates.SESSION] = null; // Clear the bad session
                        cb([errMsg]);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.LoadUser = function (address, cb) {
        var _this = this;
        // TODO handle errors
        BlisUserState_1.BlisUserState.Get(this.bot, address, this.defaultApp, function (error, userState, isNew) {
            if (isNew) {
                // Attempt to load the application
                BlisApp_1.BlisApp.Load(_this.blisClient, userState, address, _this.defaultApp, function (text) {
                    BlisDebug_1.BlisDebug.Log(text);
                    cb(null, userState);
                });
            }
            else {
                cb(null, userState);
            }
        });
    };
    BlisRecognizer.prototype.SendResult = function (address, userState, cb, responses) {
        if (!responses) {
            BlisDebug_1.BlisDebug.Error("Send result with empty response");
            responses = [];
        }
        // Save user state
        BlisUserState_1.BlisUserState.Save(this.bot, address, userState);
        // Assume BLIS always wins for now 
        var result = { score: 1.0, responses: responses, intent: null };
        // Send callback
        cb(null, result);
    };
    // For handling buttons that require subsequent text input
    BlisRecognizer.prototype.HandleEditCommand = function (input, address, userState, cb) {
        var memory = new BlisMemory_1.BlisMemory(userState);
        try {
            var editCommand = memory.EditCommand();
            if (editCommand.commandName == Consts_1.Commands.EDITACTION) {
                Action_1.Action.Add(this.blisClient, userState, input, Consts_1.ActionTypes.TEXT, editCommand.id /*actionId*/, function (responses) {
                    cb(responses);
                });
            }
            else if (editCommand.commandName == Consts_1.Commands.EDITENTITY) {
                var _a = input.split(' '), name_1 = _a[0], type = _a[1], prebuilt = _a[2];
                Entity_1.Entity.Add(this.blisClient, userState, editCommand.id /*entityId*/, name_1, type, prebuilt, function (responses) {
                    cb(responses);
                });
            }
        }
        catch (error) {
            var errMsg = Utils_1.Utils.ErrorString(error);
            BlisDebug_1.BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
        finally {
            // Clear edit command
            memory.SetEditCommand(null);
        }
    };
    BlisRecognizer.prototype.HandleHelp = function (input, address, userState, cb) {
        var help = Help_1.BlisHelp.Get(input);
        this.SendResult(address, userState, cb, [help]);
    };
    BlisRecognizer.prototype.HandleCommand = function (input, address, userState, cb) {
        var _a = input.split(' '), command = _a[0], arg = _a[1], arg2 = _a[2], arg3 = _a[3], arg4 = _a[4];
        command = command.toLowerCase();
        //---------------------------------------------------
        // Commands allowed at any time
        if (command == Consts_1.Commands.ACTIONS) {
            Action_1.Action.Get(this.blisClient, userState, arg, function (responses) {
                cb(responses);
            });
        }
        else if (command == Consts_1.Commands.ADDENTITY) {
            Entity_1.Entity.Add(this.blisClient, userState, null, arg, arg2, arg3, function (responses) {
                cb(responses, true);
            });
        }
        else if (command == Consts_1.Commands.DEBUG) {
            userState[Consts_1.UserStates.DEBUG] = !userState[Consts_1.UserStates.DEBUG];
            BlisDebug_1.BlisDebug.enabled = userState[Consts_1.UserStates.DEBUG];
            cb(["Debug " + (BlisDebug_1.BlisDebug.enabled ? "Enabled" : "Disabled")]);
        }
        else if (command == Consts_1.Commands.DEBUGHELP) {
            cb([this.DebugHelp()]);
        }
        else if (command == Consts_1.Commands.DUMP) {
            var memory = new BlisMemory_1.BlisMemory(userState);
            cb([memory.Dump()]);
        }
        else if (command == Consts_1.Commands.ENTITIES) {
            Entity_1.Entity.Get(this.blisClient, userState, arg, function (responses) {
                cb(responses);
            });
        }
        else if (command == Consts_1.Commands.HELP) {
            cb([this.Help(arg)]);
        }
        else if (userState[Consts_1.UserStates.TEACH]) {
            if (command == Consts_1.Commands.ABANDON) {
                this.HandleIntCommand(Consts_1.IntCommands.FORGETTEACH, address, userState, cb);
            }
            else {
                cb(["_Command not valid while in Teach mode_"]);
            }
        }
        else {
            if (command == Consts_1.Commands.ADDAPIACTION) {
                var arg_1 = this.RemoveCommandWord(input);
                Action_1.Action.Add(this.blisClient, userState, arg_1, Consts_1.ActionTypes.API, null, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.ADDTEXTACTION) {
                var arg_2 = this.RemoveCommandWord(input);
                Action_1.Action.Add(this.blisClient, userState, arg_2, Consts_1.ActionTypes.TEXT, null, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.APPS) {
                BlisApp_1.BlisApp.GetAll(this.blisClient, address, arg, function (text) {
                    cb(text);
                });
            }
            else if (command == Consts_1.Commands.CREATEAPP) {
                BlisApp_1.BlisApp.Create(this.blisClient, userState, arg, arg2, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.DELETEALLAPPS) {
                BlisApp_1.BlisApp.DeleteAll(this.blisClient, userState, address, function (text) {
                    cb([text]);
                });
            }
            else if (command == Consts_1.Commands.DELETEACTION) {
                Action_1.Action.Delete(this.blisClient, userState, arg, function (text) {
                    cb([text]);
                });
            }
            else if (command == Consts_1.Commands.DELETEAPP) {
                Utils_1.Utils.SendMessage(this.bot, address, "Deleting apps...");
                BlisApp_1.BlisApp.Delete(this.blisClient, userState, arg, function (text) {
                    cb([text]);
                });
            }
            else if (command == Consts_1.Commands.DELETEENTITY) {
                Entity_1.Entity.Delete(this.blisClient, userState, arg, function (text) {
                    cb([text]);
                });
            }
            else if (command == Consts_1.Commands.EDITACTION) {
                var content = this.RemoveWords(input, 2); // Remove command and actionId             
                Action_1.Action.Add(this.blisClient, userState, content, Consts_1.ActionTypes.TEXT, arg /*actionId*/, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.EDITENTITY) {
                Entity_1.Entity.Add(this.blisClient, userState, arg /*entityId*/, arg2, arg3, arg4, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.EXPORTAPP) {
                BlisApp_1.BlisApp.Export(this.blisClient, userState, address, this.bot, function (text) {
                    cb([text]);
                });
            }
            else if (command == Consts_1.Commands.IMPORTAPP) {
                Utils_1.Utils.SendMessage(this.bot, address, "Importing app...");
                BlisApp_1.BlisApp.Import(this.blisClient, userState, address, arg, function (text) {
                    cb([text]);
                });
            }
            else if (command == Consts_1.Commands.LOADAPP) {
                Utils_1.Utils.SendMessage(this.bot, address, "Loading app...");
                BlisApp_1.BlisApp.Load(this.blisClient, userState, address, arg, function (text) {
                    cb([text]);
                });
            }
            else if (command == Consts_1.Commands.START) {
                this.NewSession(userState, false, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.TEACH) {
                var memory = new BlisMemory_1.BlisMemory(userState);
                memory.ClearTrainSteps();
                this.NewSession(userState, true, function (results) {
                    cb(results);
                });
            }
            else if (command == Consts_1.Commands.TRAINDIALOGS) {
                TrainDialog_1.TrainDialog.Get(this.blisClient, userState, address, arg, function (text) {
                    cb(text);
                });
            }
            else {
                var text = "_Command unrecognized or not valid in Teach mode_\n\n\n\n" + this.Help(null);
                cb([text]);
            }
        }
    };
    BlisRecognizer.prototype.HandleIntCommand = function (input, address, userState, cb) {
        var _a = input.split(' '), command = _a[0], arg = _a[1], arg2 = _a[2], arg3 = _a[3];
        command = command.toLowerCase();
        //-------- Only valid in Teach ------------------//
        if (userState[Consts_1.UserStates.TEACH]) {
            if (command == Consts_1.IntCommands.SAVETEACH) {
                var card_1 = Utils_1.Utils.MakeHero("Dialog Trained", null, null, { "Start": Consts_1.Commands.START, "Teach": Consts_1.Commands.TEACH, "Edit": Help_1.Help.NEWAPP });
                this.EndSession(userState, function (text) {
                    cb([card_1]);
                });
            }
            else if (command == Consts_1.IntCommands.FORGETTEACH) {
                // TODO: flag to not save training
                var card_2 = Utils_1.Utils.MakeHero("Dialog Abandoned", null, null, { "Start": Consts_1.Commands.START, "Teach": Consts_1.Commands.TEACH, "Edit": Help_1.Help.NEWAPP });
                this.EndSession(userState, function (text) {
                    cb([card_2]);
                });
            }
            else if (command == Consts_1.IntCommands.DONETEACH) {
                var steps = this.TrainStepText(userState);
                var card = Utils_1.Utils.MakeHero("", "", "Does this look good?", { "Save": Consts_1.IntCommands.SAVETEACH, "Abandon": Consts_1.IntCommands.FORGETTEACH });
                cb([steps, card]);
            }
            else {
                cb(["_In teaching mode. The only valid command is_ " + Consts_1.IntCommands.DONETEACH]);
            }
        }
        else if (command == Consts_1.IntCommands.DELETEAPP) {
            BlisApp_1.BlisApp.Delete(this.blisClient, userState, arg, function (text) {
                cb([text]);
            });
        }
        else if (command == Consts_1.IntCommands.DELETEDIALOG) {
            TrainDialog_1.TrainDialog.Delete(this.blisClient, userState, arg, function (text) {
                cb([text]);
            });
        }
        else if (command == Consts_1.IntCommands.EDITACTION) {
            this.CueEditAction(userState, arg, function (responses) {
                cb(responses);
            });
        }
        else if (command == Consts_1.IntCommands.EDITENTITY) {
            this.CueEditEntity(userState, arg, function (responses) {
                cb(responses);
            });
        }
        else {
            var text = "_Not a valid command._\n\n\n\n" + this.Help(null);
            cb([text]);
        }
    };
    BlisRecognizer.prototype.recognize = function (context, cb) {
        var _this = this;
        try {
            if (!context || !context.message) {
                return;
            }
            var address_1 = context.message.address;
            this.LoadUser(address_1, function (error, userState) {
                if (context.message.attachments && context.message.attachments.length > 0) {
                    Utils_1.Utils.SendMessage(_this.bot, address_1, "Importing application...");
                    BlisApp_1.BlisApp.ImportAttachment(_this.blisClient, userState, address_1, context.message.attachments[0], function (text) {
                        _this.SendResult(address_1, userState, cb, [text]);
                    });
                    return;
                }
                if (context.message.text) {
                    var inTeach_1 = userState[Consts_1.UserStates.TEACH];
                    var that_1 = _this;
                    var memory_1 = new BlisMemory_1.BlisMemory(userState);
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
                                var entityName = memory_1.EntityId2Name(labelEntity.entityId);
                                // Prebuild entities don't have a score
                                var score = labelEntity.score ? "_Score: " + labelEntity.score.toFixed(3) + "_" : "";
                                entities += "[$" + entityName + ": " + labelEntity.entityValue + "]    " + score + "\n\n";
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
                                        that_1.TakeTurn(userState, userInput_2, TakeTurnCallback_1);
                                        return;
                                    }
                                }
                            }
                        }
                        memory_1.RememberTrainStep(Consts_1.SaveStep.ENTITY, memory_1.DumpEntities());
                        var title = "Teach Step: Select Action";
                        var body = memory_1.DumpEntities() + "\n\n";
                        responses.push(Utils_1.Utils.MakeHero(title, null, body, null));
                        if (ttResponse.teachLabelActions.length == 0) {
                            responses.push('No actions matched.\n\n');
                            body = 'Enter a new Action\n\n';
                        }
                        else {
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
                            responses.push(Utils_1.Utils.MakeHero(" ", null, 'Select Action by number or enter a new one', { "Help": Help_1.Help.ADDACTION }));
                        }
                    };
                    var TakeTurnCallback_1 = function (ttResponse, error) {
                        BlisDebug_1.BlisDebug.Verbose("TakeTurnCallback");
                        if (error) {
                            that_1.SendResult(address_1, userState, cb, [error]);
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
                            that_1.SendResult(address_1, userState, cb, responses);
                        }
                    };
                    Utils_1.Utils.SendTyping(_this.bot, address_1);
                    BlisDebug_1.BlisDebug.SetAddress(address_1);
                    var userInput_1 = context.message.text.trim();
                    // Check for Edit Commands
                    if (memory_1.EditCommand()) {
                        _this.HandleEditCommand(userInput_1, address_1, userState, function (responses, retrain) {
                            _this.SendResult(address_1, userState, cb, responses);
                        });
                    }
                    else if (userInput_1.startsWith('!')) {
                        _this.HandleCommand(userInput_1, address_1, userState, function (responses, retrain) {
                            // Some commands require retraining if user is in teach mode
                            if (inTeach_1 && retrain) {
                                // Send command response out of band
                                responses.push("Retraining...");
                                Utils_1.Utils.SendResponses(_this.bot, address_1, responses);
                                // Retrain the model
                                _this.blisClient.Retrain(userState[Consts_1.UserStates.APP], userState[Consts_1.UserStates.APP])
                                    .then(function (takeTurnResponse) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                    return tslib_1.__generator(this, function (_a) {
                                        // Continue teach session
                                        TakeTurnCallback_1(takeTurnResponse);
                                        return [2 /*return*/];
                                    });
                                }); })
                                    .catch(function (error) {
                                    _this.SendResult(address_1, userState, cb, [error]);
                                });
                            }
                            else {
                                _this.SendResult(address_1, userState, cb, responses);
                            }
                        });
                    }
                    else if (userInput_1.startsWith('~')) {
                        _this.HandleIntCommand(userInput_1, address_1, userState, function (responses, retrain) {
                            _this.SendResult(address_1, userState, cb, responses);
                        });
                    }
                    else if (userInput_1.startsWith('#')) {
                        _this.HandleHelp(userInput_1, address_1, userState, cb);
                    }
                    else {
                        // If not in teach mode remember last user input
                        if (!inTeach_1) {
                            memory_1.RememberLastStep(Consts_1.SaveStep.INPUT, userInput_1);
                        }
                        _this.TakeTurn(userState, userInput_1, TakeTurnCallback_1);
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
    BlisRecognizer.prototype.TakeTurn = function (userState, payload, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var response_1, response_2, response_3, expectedNextModes, requestBody, takeTurnResponse, response, takeTurnRequest, memory, action, apiString, _a, apiName, arg, api, memory, takeTurnRequest, response_4, error_5, errMsg;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Verbose("TakeTurn");
                        // Error checking
                        if (userState[Consts_1.UserStates.APP] == null) {
                            response_1 = this.ErrorResponse("No Application has been loaded.\n\nTry _!createapp_, _!loadapp_ or _!help_ for more info.");
                            cb(response_1);
                            return [2 /*return*/];
                        }
                        else if (!userState[Consts_1.UserStates.MODEL] && !userState[Consts_1.UserStates.TEACH]) {
                            response_2 = this.ErrorResponse("This application needs to be trained first.\n\nTry _!teach, _!traindialogs_ or _!help_ for more info.");
                            cb(response_2);
                            return [2 /*return*/];
                        }
                        else if (!userState[Consts_1.UserStates.SESSION]) {
                            response_3 = this.ErrorResponse("Start the bot first with _!start_ or train more with _!teach_");
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
                        return [4 /*yield*/, this.blisClient.SendTurnRequest(userState, requestBody)];
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
                        memory = new BlisMemory_1.BlisMemory(userState);
                        if (this.LuisCallback) {
                            takeTurnRequest = this.LuisCallback(takeTurnResponse.originalText, takeTurnResponse.entities, memory);
                        }
                        else {
                            takeTurnRequest = this.DefaultLuisCallback(takeTurnResponse.originalText, takeTurnResponse.entities, memory);
                        }
                        return [4 /*yield*/, this.TakeTurn(userState, takeTurnRequest, cb)];
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
                        memory = new BlisMemory_1.BlisMemory(userState);
                        takeTurnRequest = api(memory, arg);
                        // If in teach mode, remember the step
                        if (userState[Consts_1.UserStates.TEACH]) {
                            memory.RememberTrainStep(Consts_1.SaveStep.API, apiName + " " + arg);
                        }
                        BlisDebug_1.BlisDebug.Verbose("API: {" + apiName + " " + arg + "}");
                        expectedNextModes = [Consts_1.TakeTurnModes.ACTION, Consts_1.TakeTurnModes.TEACH];
                        return [4 /*yield*/, this.TakeTurn(userState, takeTurnRequest, cb)];
                    case 7:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        response_4 = this.ErrorResponse("API " + apiName + " not defined");
                        cb(response_4);
                        _b.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        error_5 = _b.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_5);
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
    BlisRecognizer.prototype.ErrorResponse = function (text) {
        return new TakeTurnResponse_1.TakeTurnResponse({ mode: Consts_1.TakeTurnModes.ERROR, error: text });
    };
    /** Remove first work (i.e. command) from command string */
    BlisRecognizer.prototype.RemoveCommandWord = function (text) {
        var firstSpace = text.indexOf(' ');
        return (firstSpace > 0) ? text.slice(firstSpace + 1) : "";
    };
    /** Remove words from start from command string */
    BlisRecognizer.prototype.RemoveWords = function (text, numWords) {
        var firstSpace = text.indexOf(' ');
        var remaining = (firstSpace > 0) ? text.slice(firstSpace + 1) : "";
        numWords--;
        if (numWords == 0) {
            return remaining;
        }
        return this.RemoveWords(remaining, numWords);
    };
    BlisRecognizer.prototype.DefaultLuisCallback = function (text, entities, memory) {
        // Update entities in my memory
        for (var _i = 0, entities_1 = entities; _i < entities_1.length; _i++) {
            var entity = entities_1[_i];
            // TEMP
            if (!entity.id) {
                BlisDebug_1.BlisDebug.Error("Entity Id not set.");
                entity.id = entity.type;
            }
            var entityName = memory.EntityId2Name(entity.id);
            // Tilda indicates a 'not' action on memory
            if (entityName.startsWith('~')) {
                var notEntityName = entityName.slice(1);
                memory.ForgetEntityByName(notEntityName, entity.value);
            }
            else {
                memory.RememberEntityById(entity.id, entity.value);
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