"use strict";
var tslib_1 = require("tslib");
var Menu_1 = require("./Menu");
var TrainDialog_1 = require("./Model/TrainDialog");
var BlisApp_1 = require("./Model/BlisApp");
var BlisMemory_1 = require("./BlisMemory");
var BlisDebug_1 = require("./BlisDebug");
var BlisSession_1 = require("./Model/BlisSession");
var CueCommand_1 = require("./Model/CueCommand");
var Help_1 = require("./Model/Help");
var Action_1 = require("./Model/Action");
var Entity_1 = require("./Model/Entity");
var BlisAppContent_1 = require("./Model/BlisAppContent");
var Utils_1 = require("./Utils");
var Consts_1 = require("./Model/Consts");
// Internal command prefix
var INTPREFIX = "%~";
// Command line prefix
var COMMANDPREFIX = "!";
// Internal commands. (Not for user)
exports.IntCommands = {
    ADDAPICALL: INTPREFIX + "addapicall",
    ADDENTITY: INTPREFIX + "addentity",
    ADDRESPONSE: INTPREFIX + "addresponse",
    APICALLS: INTPREFIX + "apicalls",
    APPS: INTPREFIX + "apps",
    CANCEL: INTPREFIX + "cancel",
    CREATEAPP: INTPREFIX + "createapp",
    DELETEAPP: INTPREFIX + "deleteapp",
    DELETEDIALOG: INTPREFIX + "deletedialog",
    DONETEACH: INTPREFIX + "doneteach",
    EDITAPP: INTPREFIX + "editapp",
    EDITAPICALL: INTPREFIX + "editapicall",
    EDITENTITY: INTPREFIX + "editentity",
    EDITRESPONSE: INTPREFIX + "editresponse",
    ENTITIES: INTPREFIX + "entities",
    FORGETTEACH: INTPREFIX + "forgetteach",
    HOME: INTPREFIX + "home",
    RESPONSES: INTPREFIX + "responses",
    SAVETEACH: INTPREFIX + "saveteach",
    TRAINDIALOGS: INTPREFIX + "traindialogs"
};
exports.LineCommands = {
    ABANDON: COMMANDPREFIX + "abandon",
    ACTIONS: COMMANDPREFIX + "actions",
    ADDENTITY: COMMANDPREFIX + "addentity",
    ADDAPICALL: COMMANDPREFIX + "addapicall",
    ADDRESPONSE: COMMANDPREFIX + "addresponse",
    APICALLS: COMMANDPREFIX + "apicalls",
    APPS: COMMANDPREFIX + "apps",
    CREATEAPP: COMMANDPREFIX + "createapp",
    DEBUG: COMMANDPREFIX + "debug",
    DEBUGHELP: COMMANDPREFIX + "debughelp",
    DELETEACTION: COMMANDPREFIX + "deleteaction",
    DELETEALLAPPS: COMMANDPREFIX + "deleteallapps",
    DELETEAPP: COMMANDPREFIX + "deleteapp",
    DELETEENTITY: COMMANDPREFIX + "deleteentity",
    DUMP: COMMANDPREFIX + "dump",
    EDITAPICALL: COMMANDPREFIX + "editapicall",
    EDITENTITY: COMMANDPREFIX + "editentity",
    EDITRESPONSE: COMMANDPREFIX + "editresponse",
    ENTITIES: COMMANDPREFIX + "entities",
    EXPORTAPP: COMMANDPREFIX + "exportapp",
    HELP: COMMANDPREFIX + "help",
    IMPORTAPP: COMMANDPREFIX + "importapp",
    LOADAPP: COMMANDPREFIX + "loadapp",
    RESPONSES: COMMANDPREFIX + "responses",
    START: COMMANDPREFIX + "start",
    TEACH: COMMANDPREFIX + "teach",
    TRAINDIALOGS: COMMANDPREFIX + "traindialogs"
};
var CommandHandler = (function () {
    function CommandHandler() {
    }
    CommandHandler.IsIntCommand = function (text) {
        return text.startsWith(INTPREFIX);
    };
    CommandHandler.IsCommandLine = function (text) {
        return text.startsWith(COMMANDPREFIX);
    };
    /** Next incoming text from user is a command.  Send cue card */
    CommandHandler.CueCommand = function (context, command, args, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var cueCommand, memory, action, entity, action, error_1, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 14, , 15]);
                        cueCommand = new CueCommand_1.CueCommand(command, args);
                        memory = new BlisMemory_1.BlisMemory(context);
                        memory.SetCueCommand(cueCommand);
                        if (!(command == exports.LineCommands.ADDAPICALL)) return [3 /*break*/, 1];
                        cb([Menu_1.Menu.AddAPICall()]);
                        return [3 /*break*/, 13];
                    case 1:
                        if (!(command == exports.LineCommands.ADDENTITY)) return [3 /*break*/, 2];
                        cb([Menu_1.Menu.AddEntity()]);
                        return [3 /*break*/, 13];
                    case 2:
                        if (!(command == exports.LineCommands.ADDRESPONSE)) return [3 /*break*/, 3];
                        cb([Menu_1.Menu.AddResponse()]);
                        return [3 /*break*/, 13];
                    case 3:
                        if (!(command == exports.LineCommands.APICALLS)) return [3 /*break*/, 4];
                        cb([Menu_1.Menu.APICalls()]);
                        return [3 /*break*/, 13];
                    case 4:
                        if (!(command == exports.LineCommands.APPS)) return [3 /*break*/, 5];
                        cb([Menu_1.Menu.Apps()]);
                        return [3 /*break*/, 13];
                    case 5:
                        if (!(command == exports.LineCommands.CREATEAPP)) return [3 /*break*/, 6];
                        cb([Menu_1.Menu.CreateApp()]);
                        return [3 /*break*/, 13];
                    case 6:
                        if (!(command == exports.LineCommands.EDITAPICALL)) return [3 /*break*/, 8];
                        return [4 /*yield*/, context.client.GetAction(context.state[Consts_1.UserStates.APP], args)];
                    case 7:
                        action = _a.sent();
                        cb([Menu_1.Menu.EditAPICall(action)]);
                        return [3 /*break*/, 13];
                    case 8:
                        if (!(command == exports.LineCommands.EDITENTITY)) return [3 /*break*/, 10];
                        return [4 /*yield*/, context.client.GetEntity(context.state[Consts_1.UserStates.APP], args)];
                    case 9:
                        entity = _a.sent();
                        cb([Menu_1.Menu.EditEntity(entity)]);
                        return [3 /*break*/, 13];
                    case 10:
                        if (!(command == exports.LineCommands.EDITRESPONSE)) return [3 /*break*/, 12];
                        return [4 /*yield*/, context.client.GetAction(context.state[Consts_1.UserStates.APP], args)];
                    case 11:
                        action = _a.sent();
                        cb([Menu_1.Menu.EditResponse(action)]);
                        return [3 /*break*/, 13];
                    case 12:
                        if (command == exports.LineCommands.ENTITIES) {
                            cb([Menu_1.Menu.Entities()]);
                        }
                        else if (command == exports.LineCommands.RESPONSES) {
                            cb([Menu_1.Menu.Responses()]);
                        }
                        else if (command == exports.IntCommands.TRAINDIALOGS) {
                            cb([Menu_1.Menu.TrainDialogs()]);
                        }
                        _a.label = 13;
                    case 13: return [3 /*break*/, 15];
                    case 14:
                        error_1 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_1);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb([errMsg]);
                        return [3 /*break*/, 15];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    CommandHandler.HandleIntCommand = function (context, input, cb) {
        var _a = input.split(' '), command = _a[0], arg = _a[1], arg2 = _a[2], arg3 = _a[3];
        command = command.toLowerCase();
        //-------- Valid any time -----------------------//
        if (command == exports.IntCommands.ADDRESPONSE) {
            this.CueCommand(context, exports.LineCommands.ADDRESPONSE, null, function (responses) {
                cb(responses);
            });
            return;
        }
        else if (command == exports.IntCommands.ADDAPICALL) {
            this.CueCommand(context, exports.LineCommands.ADDAPICALL, null, function (responses) {
                cb(responses);
            });
            return;
        }
        //-------- Only valid in Teach ------------------//
        if (context.state[Consts_1.UserStates.TEACH]) {
            if (command == exports.IntCommands.APICALLS) {
                this.CueCommand(context, exports.LineCommands.APICALLS, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.IntCommands.SAVETEACH) {
                var cards_1 = Menu_1.Menu.Home("Dialog Trained");
                BlisSession_1.BlisSession.EndSession(context, function (text) {
                    cb(cards_1);
                });
            }
            else if (command == exports.IntCommands.FORGETTEACH) {
                // TODO: flag to not save training
                var cards_2 = Menu_1.Menu.Home("Dialog Abandoned");
                BlisSession_1.BlisSession.EndSession(context, function (text) {
                    cb(cards_2);
                });
            }
            else if (command == exports.IntCommands.DONETEACH) {
                var steps = BlisSession_1.BlisSession.TrainStepText(context);
                var card = Utils_1.Utils.MakeHero("", "", "Does this look good?", {
                    "Save": exports.IntCommands.SAVETEACH,
                    "Abandon": exports.IntCommands.FORGETTEACH
                });
                cb([steps, card]);
            }
            else {
                cb(["Action can't be performed while teaching."]);
            }
        }
        else {
            if (command == exports.IntCommands.ADDENTITY) {
                this.CueCommand(context, exports.LineCommands.ADDENTITY, null, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.IntCommands.APPS) {
                this.CueCommand(context, exports.LineCommands.APPS, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.IntCommands.CREATEAPP) {
                this.CueCommand(context, exports.LineCommands.CREATEAPP, null, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.IntCommands.DELETEAPP) {
                BlisApp_1.BlisApp.Delete(context, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.IntCommands.DELETEDIALOG) {
                TrainDialog_1.TrainDialog.Delete(context, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.IntCommands.EDITAPICALL) {
                this.CueCommand(context, exports.LineCommands.EDITAPICALL, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.IntCommands.EDITAPP) {
                cb(Menu_1.Menu.EditApp());
            }
            else if (command == exports.IntCommands.EDITENTITY) {
                this.CueCommand(context, exports.LineCommands.EDITENTITY, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.IntCommands.EDITRESPONSE) {
                this.CueCommand(context, exports.LineCommands.EDITRESPONSE, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.IntCommands.ENTITIES) {
                this.CueCommand(context, exports.LineCommands.ENTITIES, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.IntCommands.HOME) {
                cb(Menu_1.Menu.Home(""));
            }
            else if (command == exports.IntCommands.RESPONSES) {
                this.CueCommand(context, exports.LineCommands.RESPONSES, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.IntCommands.TRAINDIALOGS) {
                this.CueCommand(context, exports.LineCommands.TRAINDIALOGS, arg, function (responses) {
                    cb(responses);
                });
            }
            else {
                cb(["Not a valid command or only available in Teach mode."]);
            }
        }
    };
    CommandHandler.HandleCommandLine = function (context, input, cb) {
        var command = input.split(' ')[0];
        var args = this.RemoveCommandWord(input);
        this.ProcessCommand(context, command, args, cb);
    };
    CommandHandler.ProcessCommand = function (context, command, args, cb) {
        //---------------------------------------------------
        // Commands allowed at any time
        if (command == exports.LineCommands.ACTIONS) {
            Action_1.Action.GetAll(context, null, args, function (responses) {
                cb(responses);
            });
        }
        else if (command == exports.LineCommands.ADDAPICALL) {
            Action_1.Action.Add(context, null, Consts_1.ActionTypes.API, args, function (responses, actionId) {
                cb(responses, Consts_1.TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == exports.LineCommands.ADDRESPONSE) {
            Action_1.Action.Add(context, null, Consts_1.ActionTypes.TEXT, args, function (responses, actionId) {
                cb(responses, Consts_1.TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == exports.LineCommands.ADDENTITY) {
            var _a = args.split(' '), content = _a[0], type = _a[1];
            Entity_1.Entity.Add(context, null, type, content, function (responses) {
                cb(responses, Consts_1.TeachAction.RETRAIN);
            });
        }
        else if (command == exports.LineCommands.APICALLS) {
            Action_1.Action.GetAll(context, Consts_1.ActionTypes.API, args, function (responses) {
                cb(responses);
            });
        }
        else if (command == exports.LineCommands.DEBUG) {
            context.state[Consts_1.UserStates.DEBUG] = !context.state[Consts_1.UserStates.DEBUG];
            BlisDebug_1.BlisDebug.enabled = context.state[Consts_1.UserStates.DEBUG];
            cb(["Debug " + (BlisDebug_1.BlisDebug.enabled ? "Enabled" : "Disabled")]);
        }
        else if (command == exports.LineCommands.DEBUGHELP) {
            cb([this.DebugHelp()]);
        }
        else if (command == exports.LineCommands.DUMP) {
            var memory = new BlisMemory_1.BlisMemory(context);
            cb([memory.Dump()]);
        }
        else if (command == exports.LineCommands.ENTITIES) {
            Entity_1.Entity.Get(context, args, function (responses) {
                cb(responses);
            });
        }
        else if (command == exports.LineCommands.HELP) {
            cb([this.Help(args)]);
        }
        else if (command == exports.LineCommands.RESPONSES) {
            Action_1.Action.GetAll(context, Consts_1.ActionTypes.TEXT, args, function (responses) {
                cb(responses);
            });
        }
        else if (context.state[Consts_1.UserStates.TEACH]) {
            if (command == exports.LineCommands.ABANDON) {
                this.HandleIntCommand(context, exports.IntCommands.FORGETTEACH, cb);
            }
            else {
                cb(["_Command not valid while in Teach mode_"]);
            }
        }
        else {
            if (command == exports.LineCommands.APPS) {
                BlisApp_1.BlisApp.GetAll(context, args, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.LineCommands.CREATEAPP) {
                var _b = args.split(' '), appname = _b[0], luiskey = _b[1];
                BlisApp_1.BlisApp.Create(context, appname, luiskey, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.LineCommands.DELETEALLAPPS) {
                BlisApp_1.BlisApp.DeleteAll(context, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.LineCommands.DELETEACTION) {
                var actionId = args.split(' ')[0];
                Action_1.Action.Delete(context, actionId, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.LineCommands.DELETEAPP) {
                Utils_1.Utils.SendMessage(context, "Deleting app...");
                var appid = args.split(' ')[0];
                BlisApp_1.BlisApp.Delete(context, appid, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.LineCommands.DELETEENTITY) {
                var entityId = args.split(' ')[0];
                Entity_1.Entity.Delete(context, entityId, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.LineCommands.EDITAPICALL) {
                var actionId = args.split(' ')[0];
                var content = this.RemoveWords(args, 1);
                Action_1.Action.Add(context, actionId, Consts_1.ActionTypes.API, content, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.LineCommands.EDITRESPONSE) {
                var actionId = args.split(' ')[0];
                var content = this.RemoveWords(args, 1);
                Action_1.Action.Add(context, actionId, Consts_1.ActionTypes.TEXT, content, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.LineCommands.EDITENTITY) {
                var _c = args.split(' '), entityId = _c[0], content = _c[1];
                Entity_1.Entity.Add(context, entityId, null, content, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.LineCommands.EXPORTAPP) {
                BlisAppContent_1.BlisAppContent.Export(context, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.LineCommands.IMPORTAPP) {
                Utils_1.Utils.SendMessage(context, "Importing app...");
                var appId = args.split(' ')[0];
                BlisAppContent_1.BlisAppContent.Import(context, appId, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.LineCommands.LOADAPP) {
                Utils_1.Utils.SendMessage(context, "Loading app...");
                var appId = args.split(' ')[0];
                BlisAppContent_1.BlisAppContent.Load(context, appId, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.LineCommands.START) {
                BlisSession_1.BlisSession.NewSession(context, false, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.LineCommands.TEACH) {
                var memory = new BlisMemory_1.BlisMemory(context);
                memory.ClearTrainSteps();
                BlisSession_1.BlisSession.NewSession(context, true, function (responses) {
                    cb(responses);
                });
            }
            else if (command == exports.LineCommands.TRAINDIALOGS) {
                var search = args.split(' ')[0];
                TrainDialog_1.TrainDialog.Get(context, search, function (responses) {
                    cb(responses);
                });
            }
            else {
                var text = "_Command unrecognized or not valid in Teach mode_\n\n\n\n" + this.Help(null);
                cb([text]);
            }
        }
    };
    // For handling buttons that require subsequent text input
    CommandHandler.HandleCueCommand = function (context, input, cb) {
        var memory = new BlisMemory_1.BlisMemory(context);
        try {
            // Check for cancel action
            if (input == exports.IntCommands.CANCEL) {
                var responses = [];
                responses.push("Cancelled...");
                cb(Menu_1.Menu.EditApp(true));
                return;
            }
            var cueCommand = memory.CueCommand();
            var args = cueCommand.args ? cueCommand.args + " " : "";
            this.ProcessCommand(context, cueCommand.commandName, "" + args + input, cb);
        }
        catch (error) {
            var errMsg = Utils_1.Utils.ErrorString(error);
            BlisDebug_1.BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
        finally {
            // Clear cue command
            memory.SetCueCommand(null);
        }
    };
    CommandHandler.Help = function (command) {
        if (command) {
            // Don't require user to put ! in front of command
            if (!command.startsWith(COMMANDPREFIX)) {
                command = COMMANDPREFIX + command;
            }
            var helpmsg = Help_1.BlisHelp.CommandHelpString(command);
            return helpmsg;
        }
        var text = "";
        for (var item in exports.LineCommands) {
            var key = exports.LineCommands[item];
            var comObj = Help_1.BlisHelp.CommandHelp(key);
            text += key + " " + comObj.args + "\n\n     " + comObj.description + "\n\n\n\n";
        }
        return text;
    };
    /** Remove first work (i.e. command) from command string */
    CommandHandler.RemoveCommandWord = function (text) {
        var firstSpace = text.indexOf(' ');
        return (firstSpace > 0) ? text.slice(firstSpace + 1) : "";
    };
    /** Remove words from start from command string */
    CommandHandler.RemoveWords = function (text, numWords) {
        var firstSpace = text.indexOf(' ');
        var remaining = (firstSpace > 0) ? text.slice(firstSpace + 1) : "";
        numWords--;
        if (numWords == 0) {
            return remaining;
        }
        return this.RemoveWords(remaining, numWords);
    };
    CommandHandler.DebugHelp = function () {
        var text = "";
        text += exports.LineCommands.DEBUG + "\n\n       Toggle debug mode\n\n";
        text += exports.LineCommands.DELETEAPP + " {appId}\n\n       Delete specified application\n\n";
        text += exports.LineCommands.DUMP + "\n\n       Show client state\n\n";
        text += exports.LineCommands.ENTITIES + "\n\n       Return list of entities\n\n";
        text += exports.LineCommands.RESPONSES + " {y/n}\n\n       Return list of actions. If 'Y' show IDs\n\n";
        text += exports.LineCommands.TRAINDIALOGS + "\n\n       Return list of training dialogs\n\n";
        text += exports.LineCommands.HELP + "\n\n       General help";
        return text;
    };
    return CommandHandler;
}());
exports.CommandHandler = CommandHandler;
//# sourceMappingURL=CommandHandler.js.map