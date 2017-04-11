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
var CommandHandler = (function () {
    function CommandHandler() {
    }
    /** Next incoming text from user is a command.  Send cue card */
    CommandHandler.CueCommand = function (context, command, args, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var cueCommand, memory, card, card, card, card, card, card, action, card, entity, type, card, card, card, card, error_1, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 12, , 13]);
                        cueCommand = new CueCommand_1.CueCommand(command, args);
                        memory = new BlisMemory_1.BlisMemory(context);
                        memory.SetCueCommand(cueCommand);
                        if (!(command == Consts_1.Commands.ADDAPICALL)) return [3 /*break*/, 1];
                        card = Utils_1.Utils.MakeHero("Add API Call", null, "Enter new API Call", {
                            //      "Help" : Commands.HELP,   TODO
                            "Cancel": Consts_1.IntCommands.CANCEL
                        });
                        cb([card]);
                        return [3 /*break*/, 11];
                    case 1:
                        if (!(command == Consts_1.Commands.ADDENTITY)) return [3 /*break*/, 2];
                        card = Utils_1.Utils.MakeHero("Add Entity", null, "Enter new Entity", {
                            //      "Help" : Commands.HELP,   TODO
                            "Cancel": Consts_1.IntCommands.CANCEL
                        });
                        cb([card]);
                        return [3 /*break*/, 11];
                    case 2:
                        if (!(command == Consts_1.Commands.ADDRESPONSE)) return [3 /*break*/, 3];
                        card = Utils_1.Utils.MakeHero("Add Response", null, "Enter new Response", {
                            //      "Help" : Commands.HELP,   TODO
                            "Cancel": Consts_1.IntCommands.CANCEL
                        });
                        cb([card]);
                        return [3 /*break*/, 11];
                    case 3:
                        if (!(command == Consts_1.Commands.APICALLS)) return [3 /*break*/, 4];
                        card = Utils_1.Utils.MakeHero("Find API call", null, "Enter search term", {
                            "Cancel": Consts_1.IntCommands.CANCEL
                        });
                        cb([card]);
                        return [3 /*break*/, 11];
                    case 4:
                        if (!(command == Consts_1.Commands.APPS)) return [3 /*break*/, 5];
                        card = Utils_1.Utils.MakeHero("Find App", null, "Enter search term", {
                            "Cancel": Consts_1.IntCommands.CANCEL
                        });
                        cb([card]);
                        return [3 /*break*/, 11];
                    case 5:
                        if (!(command == Consts_1.Commands.CREATEAPP)) return [3 /*break*/, 6];
                        card = Utils_1.Utils.MakeHero("Create App", '{appName} {LUIS key}', "Enter new App name and Luis Key", {
                            "Cancel": Consts_1.IntCommands.CANCEL
                        });
                        cb([card]);
                        return [3 /*break*/, 11];
                    case 6:
                        if (!(command == Consts_1.Commands.EDITACTION)) return [3 /*break*/, 8];
                        return [4 /*yield*/, context.client.GetAction(context.state[Consts_1.UserStates.APP], args)];
                    case 7:
                        action = _a.sent();
                        card = Utils_1.Utils.MakeHero("Edit Action", action.content, "Enter new Action context", {
                            "Cancel": Consts_1.IntCommands.CANCEL
                        });
                        cb([card]);
                        return [3 /*break*/, 11];
                    case 8:
                        if (!(command == Consts_1.Commands.EDITENTITY)) return [3 /*break*/, 10];
                        return [4 /*yield*/, context.client.GetEntity(context.state[Consts_1.UserStates.APP], args)];
                    case 9:
                        entity = _a.sent();
                        type = entity.luisPreName ? entity.luisPreName : entity.entityType;
                        card = Utils_1.Utils.MakeHero("Edit: (" + entity.name + ")", type, "Enter new Entity name", {
                            "Cancel": Consts_1.IntCommands.CANCEL
                        });
                        cb([card]);
                        return [3 /*break*/, 11];
                    case 10:
                        if (command == Consts_1.Commands.ENTITIES) {
                            card = Utils_1.Utils.MakeHero("Find Entity", null, "Enter search term", {
                                "Cancel": Consts_1.IntCommands.CANCEL
                            });
                            cb([card]);
                        }
                        else if (command == Consts_1.Commands.RESPONSES) {
                            card = Utils_1.Utils.MakeHero("Find Response", null, "Enter search term", {
                                "Cancel": Consts_1.IntCommands.CANCEL
                            });
                            cb([card]);
                        }
                        else if (command == Consts_1.IntCommands.TRAINDIALOGS) {
                            card = Utils_1.Utils.MakeHero("Find Training Dialog", null, "Enter search term", {
                                "Cancel": Consts_1.IntCommands.CANCEL
                            });
                            cb([card]);
                        }
                        _a.label = 11;
                    case 11: return [3 /*break*/, 13];
                    case 12:
                        error_1 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_1);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb([errMsg]);
                        return [3 /*break*/, 13];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    CommandHandler.HandleIntCommand = function (context, input, cb) {
        var _a = input.split(' '), command = _a[0], arg = _a[1], arg2 = _a[2], arg3 = _a[3];
        command = command.toLowerCase();
        //-------- Valid any time -----------------------//
        if (command == Consts_1.IntCommands.ADDRESPONSE) {
            this.CueCommand(context, Consts_1.Commands.ADDRESPONSE, null, function (responses) {
                cb(responses);
            });
            return;
        }
        else if (command == Consts_1.IntCommands.ADDAPICALL) {
            this.CueCommand(context, Consts_1.Commands.ADDAPICALL, null, function (responses) {
                cb(responses);
            });
            return;
        }
        //-------- Only valid in Teach ------------------//
        if (context.state[Consts_1.UserStates.TEACH]) {
            if (command == Consts_1.IntCommands.APICALLS) {
                this.CueCommand(context, Consts_1.Commands.APICALLS, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.IntCommands.SAVETEACH) {
                var cards_1 = Menu_1.Menu.Home("Dialog Trained");
                BlisSession_1.BlisSession.EndSession(context, function (text) {
                    cb(cards_1);
                });
            }
            else if (command == Consts_1.IntCommands.FORGETTEACH) {
                // TODO: flag to not save training
                var cards_2 = Menu_1.Menu.Home("Dialog Abandoned");
                BlisSession_1.BlisSession.EndSession(context, function (text) {
                    cb(cards_2);
                });
            }
            else if (command == Consts_1.IntCommands.DONETEACH) {
                var steps = BlisSession_1.BlisSession.TrainStepText(context);
                var card = Utils_1.Utils.MakeHero("", "", "Does this look good?", {
                    "Save": Consts_1.IntCommands.SAVETEACH,
                    "Abandon": Consts_1.IntCommands.FORGETTEACH
                });
                cb([steps, card]);
            }
            else {
                cb(["Action can't be performed while teaching."]);
            }
        }
        else {
            if (command == Consts_1.IntCommands.ADDENTITY) {
                this.CueCommand(context, Consts_1.Commands.ADDENTITY, null, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.IntCommands.APPS) {
                this.CueCommand(context, Consts_1.Commands.APPS, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.IntCommands.CREATEAPP) {
                this.CueCommand(context, Consts_1.Commands.CREATEAPP, null, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.IntCommands.DELETEAPP) {
                BlisApp_1.BlisApp.Delete(context, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.IntCommands.DELETEDIALOG) {
                TrainDialog_1.TrainDialog.Delete(context, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.IntCommands.EDITACTION) {
                this.CueCommand(context, Consts_1.Commands.EDITACTION, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.IntCommands.EDITAPP) {
                cb(Menu_1.Menu.EditApp());
            }
            else if (command == Consts_1.IntCommands.EDITENTITY) {
                this.CueCommand(context, Consts_1.Commands.EDITENTITY, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.IntCommands.ENTITIES) {
                this.CueCommand(context, Consts_1.Commands.ENTITIES, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.IntCommands.HOME) {
                cb(Menu_1.Menu.Home(""));
            }
            else if (command == Consts_1.IntCommands.RESPONSES) {
                this.CueCommand(context, Consts_1.Commands.RESPONSES, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.IntCommands.TRAINDIALOGS) {
                this.CueCommand(context, Consts_1.Commands.TRAINDIALOGS, arg, function (responses) {
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
        if (command == Consts_1.Commands.ACTIONS) {
            Action_1.Action.GetAll(context, null, args, function (responses) {
                cb(responses);
            });
        }
        else if (command == Consts_1.Commands.ADDAPICALL) {
            Action_1.Action.Add(context, null, Consts_1.ActionTypes.API, args, function (responses, actionId) {
                cb(responses, Consts_1.TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == Consts_1.Commands.ADDRESPONSE) {
            Action_1.Action.Add(context, null, Consts_1.ActionTypes.TEXT, args, function (responses, actionId) {
                cb(responses, Consts_1.TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == Consts_1.Commands.ADDENTITY) {
            var _a = args.split(' '), content = _a[0], type = _a[1];
            Entity_1.Entity.Add(context, null, type, content, function (responses) {
                cb(responses, Consts_1.TeachAction.RETRAIN);
            });
        }
        else if (command == Consts_1.Commands.APICALLS) {
            Action_1.Action.GetAll(context, Consts_1.ActionTypes.API, args, function (responses) {
                cb(responses);
            });
        }
        else if (command == Consts_1.Commands.DEBUG) {
            context.state[Consts_1.UserStates.DEBUG] = !context.state[Consts_1.UserStates.DEBUG];
            BlisDebug_1.BlisDebug.enabled = context.state[Consts_1.UserStates.DEBUG];
            cb(["Debug " + (BlisDebug_1.BlisDebug.enabled ? "Enabled" : "Disabled")]);
        }
        else if (command == Consts_1.Commands.DEBUGHELP) {
            cb([this.DebugHelp()]);
        }
        else if (command == Consts_1.Commands.DUMP) {
            var memory = new BlisMemory_1.BlisMemory(context);
            cb([memory.Dump()]);
        }
        else if (command == Consts_1.Commands.ENTITIES) {
            Entity_1.Entity.Get(context, args, function (responses) {
                cb(responses);
            });
        }
        else if (command == Consts_1.Commands.HELP) {
            cb([this.Help(args)]);
        }
        else if (command == Consts_1.Commands.RESPONSES) {
            Action_1.Action.GetAll(context, Consts_1.ActionTypes.TEXT, args, function (responses) {
                cb(responses);
            });
        }
        else if (context.state[Consts_1.UserStates.TEACH]) {
            if (command == Consts_1.Commands.ABANDON) {
                this.HandleIntCommand(context, Consts_1.IntCommands.FORGETTEACH, cb);
            }
            else {
                cb(["_Command not valid while in Teach mode_"]);
            }
        }
        else {
            if (command == Consts_1.Commands.APPS) {
                BlisApp_1.BlisApp.GetAll(context, args, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.CREATEAPP) {
                var _b = args.split(' '), appname = _b[0], luiskey = _b[1];
                BlisApp_1.BlisApp.Create(context, appname, luiskey, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.DELETEALLAPPS) {
                BlisApp_1.BlisApp.DeleteAll(context, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.DELETEACTION) {
                var actionId = args.split(' ')[0];
                Action_1.Action.Delete(context, actionId, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.DELETEAPP) {
                Utils_1.Utils.SendMessage(context, "Deleting app...");
                var appid = args.split(' ')[0];
                BlisApp_1.BlisApp.Delete(context, appid, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.DELETEENTITY) {
                var entityId = args.split(' ')[0];
                Entity_1.Entity.Delete(context, entityId, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.EDITACTION) {
                var _c = args.split(' '), actionId = _c[0], content = _c[1];
                Action_1.Action.Add(context, actionId, Consts_1.ActionTypes.TEXT, content, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.EDITENTITY) {
                var _d = args.split(' '), entityId = _d[0], content = _d[1];
                Entity_1.Entity.Add(context, entityId, null, content, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.EXPORTAPP) {
                BlisAppContent_1.BlisAppContent.Export(context, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.IMPORTAPP) {
                Utils_1.Utils.SendMessage(context, "Importing app...");
                var appId = args.split(' ')[0];
                BlisAppContent_1.BlisAppContent.Import(context, appId, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.LOADAPP) {
                Utils_1.Utils.SendMessage(context, "Loading app...");
                var appId = args.split(' ')[0];
                BlisAppContent_1.BlisAppContent.Load(context, appId, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.START) {
                BlisSession_1.BlisSession.NewSession(context, false, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.TEACH) {
                var memory = new BlisMemory_1.BlisMemory(context);
                memory.ClearTrainSteps();
                BlisSession_1.BlisSession.NewSession(context, true, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.TRAINDIALOGS) {
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
            if (input == Consts_1.IntCommands.CANCEL) {
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
            if (!command.startsWith('!')) {
                command = "!" + command;
            }
            var helpmsg = Help_1.BlisHelp.CommandHelpString(command);
            return helpmsg;
        }
        var text = "";
        for (var item in Consts_1.Commands) {
            var key = Consts_1.Commands[item];
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
        text += Consts_1.Commands.DEBUG + "\n\n       Toggle debug mode\n\n";
        text += Consts_1.Commands.DELETEAPP + " {appId}\n\n       Delete specified application\n\n";
        text += Consts_1.Commands.DUMP + "\n\n       Show client state\n\n";
        text += Consts_1.Commands.ENTITIES + "\n\n       Return list of entities\n\n";
        text += Consts_1.Commands.RESPONSES + " {y/n}\n\n       Return list of actions. If 'Y' show IDs\n\n";
        text += Consts_1.Commands.TRAINDIALOGS + "\n\n       Return list of training dialogs\n\n";
        text += Consts_1.Commands.HELP + "\n\n       General help";
        return text;
    };
    return CommandHandler;
}());
exports.CommandHandler = CommandHandler;
//# sourceMappingURL=CommandHandler.js.map