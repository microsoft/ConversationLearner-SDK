"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Menu_1 = require("./Menu");
var BlisClient_1 = require("./BlisClient");
var TrainDialog_1 = require("./Model/TrainDialog");
var BlisApp_1 = require("./Model/BlisApp");
var BlisDebug_1 = require("./BlisDebug");
var BlisSession_1 = require("./Model/BlisSession");
var CueCommand_1 = require("./Model/CueCommand");
var Help_1 = require("./Model/Help");
var Action_1 = require("./Model/Action");
var Entity_1 = require("./Model/Entity");
var Pager_1 = require("./Model/Pager");
var BlisAppContent_1 = require("./Model/BlisAppContent");
var Utils_1 = require("./Utils");
var Consts_1 = require("./Model/Consts");
var Command_1 = require("./Model/Command");
var EditableResponse_1 = require("./Model/EditableResponse");
var CommandHandler = (function () {
    function CommandHandler() {
    }
    /** Next incoming text from user is a command.  Send cue card */
    CommandHandler.CueCommand = function (context, command, args, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var cueCommand, memory, card, action, entity, action, error_1, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 17, , 18]);
                        cueCommand = new CueCommand_1.CueCommand(command, args);
                        memory = context.Memory();
                        memory.SetCueCommand(cueCommand);
                        if (!(command == Command_1.LineCommands.ADDALTTEXT)) return [3 /*break*/, 1];
                        card = Utils_1.Utils.MakeHero("Enter Step Number and New User Text", "{turn number} {new input text}", null, []);
                        cb([card]);
                        return [3 /*break*/, 16];
                    case 1:
                        if (!(command == Command_1.LineCommands.ADDAPIAZURE)) return [3 /*break*/, 2];
                        cb([Menu_1.Menu.AddAzureApi()]);
                        return [3 /*break*/, 16];
                    case 2:
                        if (!(command == Command_1.LineCommands.ADDAPILOCAL)) return [3 /*break*/, 3];
                        cb([Menu_1.Menu.AddLocalApi()]);
                        return [3 /*break*/, 16];
                    case 3:
                        if (!(command == Command_1.LineCommands.ADDENTITY)) return [3 /*break*/, 4];
                        cb([Menu_1.Menu.AddEntity()]);
                        return [3 /*break*/, 16];
                    case 4:
                        if (!(command == Command_1.LineCommands.ADDRESPONSETEXT)) return [3 /*break*/, 5];
                        cb([Menu_1.Menu.AddResponseText()]);
                        return [3 /*break*/, 16];
                    case 5:
                        if (!(command == Command_1.LineCommands.ADDRESPONSEINTENT)) return [3 /*break*/, 6];
                        cb([Menu_1.Menu.AddResponseIntent()]);
                        return [3 /*break*/, 16];
                    case 6:
                        if (!(command == Command_1.LineCommands.CUEAPICALLS)) return [3 /*break*/, 7];
                        cb([Menu_1.Menu.APICalls()]);
                        return [3 /*break*/, 16];
                    case 7:
                        if (!(command == Command_1.LineCommands.APPS)) return [3 /*break*/, 8];
                        cb([Menu_1.Menu.Apps()]);
                        return [3 /*break*/, 16];
                    case 8:
                        if (!(command == Command_1.LineCommands.CREATEAPP)) return [3 /*break*/, 9];
                        cb([Menu_1.Menu.CreateApp()]);
                        return [3 /*break*/, 16];
                    case 9:
                        if (!(command == Command_1.LineCommands.EDITAPICALL)) return [3 /*break*/, 11];
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetAction(context.State(Consts_1.UserStates.APP), args)];
                    case 10:
                        action = _a.sent();
                        cb([Menu_1.Menu.EditAPICall(action)]);
                        return [3 /*break*/, 16];
                    case 11:
                        if (!(command == Command_1.LineCommands.EDITENTITY)) return [3 /*break*/, 13];
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetEntity(context.State(Consts_1.UserStates.APP), args)];
                    case 12:
                        entity = _a.sent();
                        cb([Menu_1.Menu.EditEntity(entity)]);
                        return [3 /*break*/, 16];
                    case 13:
                        if (!(command == Command_1.LineCommands.EDITRESPONSE)) return [3 /*break*/, 15];
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetAction(context.State(Consts_1.UserStates.APP), args)];
                    case 14:
                        action = _a.sent();
                        cb([Menu_1.Menu.EditResponse(action)]);
                        return [3 /*break*/, 16];
                    case 15:
                        if (command == Command_1.LineCommands.ENTITIES) {
                            cb([Menu_1.Menu.Entities()]);
                        }
                        else if (command == Command_1.LineCommands.RESPONSES) {
                            cb([Menu_1.Menu.Responses()]);
                        }
                        else if (command == Command_1.LineCommands.TRAINDIALOGS) {
                            cb([Menu_1.Menu.TrainDialogs()]);
                        }
                        _a.label = 16;
                    case 16: return [3 /*break*/, 18];
                    case 17:
                        error_1 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_1);
                        cb([errMsg]);
                        return [3 /*break*/, 18];
                    case 18: return [2 /*return*/];
                }
            });
        });
    };
    CommandHandler.HandleCueCommand = function (context, input, cb) {
        var _a = input.split(' '), command = _a[0], arg = _a[1], arg2 = _a[2], arg3 = _a[3];
        command = command.toLowerCase();
        // Update editable buttons
        EditableResponse_1.EditableResponse.Replace(context.session, command);
        //-------- Valid any time -----------------------//
        if (command == Command_1.CueCommands.ADDRESPONSE) {
            this.CueCommand(context, Command_1.LineCommands.ADDRESPONSE, null, function (responses) {
                cb(responses);
            });
            return;
        }
        else if (command == Command_1.CueCommands.ADDRESPONSETEXT) {
            this.CueCommand(context, Command_1.LineCommands.ADDRESPONSETEXT, null, function (responses) {
                cb(responses);
            });
            return;
        }
        else if (command == Command_1.CueCommands.ADDRESPONSEINTENT) {
            this.CueCommand(context, Command_1.LineCommands.ADDRESPONSEINTENT, null, function (responses) {
                cb(responses);
            });
            return;
        }
        else if (command == Command_1.CueCommands.ADDAPILOCAL) {
            this.CueCommand(context, Command_1.LineCommands.ADDAPILOCAL, null, function (responses) {
                cb(responses);
            });
            return;
        }
        else if (command == Command_1.CueCommands.ADDAPIAZURE) {
            this.CueCommand(context, Command_1.LineCommands.ADDAPIAZURE, null, function (responses) {
                cb(responses);
            });
            return;
        }
        else {
            if (command == Command_1.CueCommands.ADDALTTEXT) {
                this.CueCommand(context, Command_1.LineCommands.ADDALTTEXT, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.CueCommands.ADDENTITY) {
                this.CueCommand(context, Command_1.LineCommands.ADDENTITY, null, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.CueCommands.APPS) {
                this.CueCommand(context, Command_1.LineCommands.APPS, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.CueCommands.CREATEAPP) {
                this.CueCommand(context, Command_1.LineCommands.CREATEAPP, null, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.CueCommands.EDITAPICALL) {
                this.CueCommand(context, Command_1.LineCommands.EDITAPICALL, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.CueCommands.EDITENTITY) {
                this.CueCommand(context, Command_1.LineCommands.EDITENTITY, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.CueCommands.EDITRESPONSE) {
                this.CueCommand(context, Command_1.LineCommands.EDITRESPONSE, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.CueCommands.ENTITIES) {
                this.CueCommand(context, Command_1.LineCommands.ENTITIES, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.CueCommands.RESPONSES) {
                this.CueCommand(context, Command_1.LineCommands.RESPONSES, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.CueCommands.TRAINDIALOGS) {
                this.CueCommand(context, Command_1.LineCommands.TRAINDIALOGS, arg, function (responses) {
                    cb(responses);
                });
            }
            else {
                cb([command + " isn't a valid cue command or can't be performed while teaching."]);
            }
        }
    };
    CommandHandler.HandleIntCommand = function (context, input, cb) {
        var _a = input.split(' '), command = _a[0], arg = _a[1], arg2 = _a[2], arg3 = _a[3];
        command = command.toLowerCase();
        //-------- Valid any time -----------------------//
        if (command == Command_1.IntCommands.CHOOSEAPITYPE) {
            cb([Menu_1.Menu.ChooseAPICall()]);
            return;
        }
        else if (command == Command_1.IntCommands.CHOOSERESPONSETYPE) {
            cb([Menu_1.Menu.ChooseResponse(context.session)]);
            return;
        }
        //-------- Only valid in Teach ------------------//
        if (context.State(Consts_1.UserStates.TEACH)) {
            if (command == Command_1.IntCommands.APICALLS) {
                this.CueCommand(context, Command_1.LineCommands.CUEAPICALLS, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.IntCommands.SAVETEACH) {
                BlisSession_1.BlisSession.EndSession(context, function (text) {
                    cb([Menu_1.Menu.Home("Dialog Trained")]);
                });
            }
            else if (command == Command_1.IntCommands.FORGETTEACH) {
                // TODO: flag to not save training
                BlisSession_1.BlisSession.EndSession(context, function (text) {
                    cb([Menu_1.Menu.Home("Dialog Abandoned")]);
                });
            }
            else if (command == Command_1.IntCommands.DONETEACH) {
                var steps = BlisSession_1.BlisSession.TrainStepText(context);
                var card = Utils_1.Utils.MakeHero("", "", "Does this look good?", {
                    "Save": Command_1.IntCommands.SAVETEACH,
                    "Abandon": Command_1.IntCommands.FORGETTEACH
                });
                cb([steps, card]);
            }
            else {
                cb([command + " isn't a valid Int command or can only be performed while teaching."]);
            }
        }
        else {
            if (command == Command_1.IntCommands.DELETEAPP) {
                BlisApp_1.BlisApp.Delete(context, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.IntCommands.DELETEDIALOG) {
                // Delete
                TrainDialog_1.TrainDialog.Delete(context, arg, function (dreponses) {
                    // Continue displaying remaining dialogs
                    TrainDialog_1.TrainDialog.Get(context, true, function (responses) {
                        responses = dreponses.concat(responses);
                        cb(responses);
                    });
                });
            }
            else if (command == Command_1.IntCommands.EDITDIALOG) {
                TrainDialog_1.TrainDialog.Edit(context, arg, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.IntCommands.EDITAPP) {
                cb(Menu_1.Menu.EditCards());
            }
            else if (command == Command_1.IntCommands.TRAINDIALOG_NEXT) {
                // Next page
                Pager_1.Pager.Next(context.session);
                TrainDialog_1.TrainDialog.Get(context, false, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.IntCommands.TRAINDIALOG_PREV) {
                // Next page
                Pager_1.Pager.Prev(context.session);
                TrainDialog_1.TrainDialog.Get(context, false, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.IntCommands.CANCEL) {
                cb(Menu_1.Menu.EditCards(true));
            }
            else {
                cb([command + " is not a valid Int command or only available in Teach mode."]);
            }
        }
    };
    CommandHandler.HandleLineCommand = function (context, input, cb) {
        var command = input.split(' ')[0];
        var args = this.RemoveCommandWord(input);
        this.ProcessCommand(context, command, args, cb);
    };
    CommandHandler.ProcessCommand = function (context, command, args, cb) {
        //---------------------------------------------------
        // Commands allowed at any time
        if (command == Command_1.LineCommands.ACTIONS) {
            Action_1.Action.GetAll(context, null, args, function (responses) {
                cb(responses);
            });
        }
        else if (command == Command_1.LineCommands.ADDAPICALL) {
            Action_1.Action.Add(context, null, Consts_1.ActionTypes.API, null, args, function (responses, actionId) {
                cb(responses, Consts_1.TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == Command_1.LineCommands.ADDAPIAZURE) {
            Action_1.Action.Add(context, null, Consts_1.ActionTypes.API, Consts_1.APITypes.AZURE, args, function (responses, actionId) {
                cb(responses, Consts_1.TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == Command_1.LineCommands.ADDAPILOCAL) {
            Action_1.Action.Add(context, null, Consts_1.ActionTypes.API, Consts_1.APITypes.LOCAL, args, function (responses, actionId) {
                cb(responses, Consts_1.TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == Command_1.LineCommands.ADDRESPONSE) {
            Action_1.Action.Add(context, null, Consts_1.ActionTypes.TEXT, null, args, function (responses, actionId) {
                cb(responses, Consts_1.TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == Command_1.LineCommands.ADDRESPONSETEXT) {
            Action_1.Action.Add(context, null, Consts_1.ActionTypes.TEXT, null, args, function (responses, actionId) {
                cb(responses, Consts_1.TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == Command_1.LineCommands.ADDRESPONSEINTENT) {
            // NOTE: Response Type INTENT are actuall API calls
            Action_1.Action.Add(context, null, Consts_1.ActionTypes.API, Consts_1.APITypes.INTENT, args, function (responses, actionId) {
                cb(responses, Consts_1.TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == Command_1.LineCommands.ADDENTITY) {
            var _a = args.split(' '), content = _a[0], type = _a[1];
            Entity_1.Entity.Add(context, null, type, content, function (responses) {
                cb(responses, Consts_1.TeachAction.RETRAIN);
            });
        }
        else if (command == Command_1.LineCommands.CUEAPICALLS) {
            Action_1.Action.GetAll(context, Consts_1.ActionTypes.API, args, function (responses) {
                cb(responses);
            });
        }
        else if (command == Command_1.LineCommands.DEBUG) {
            context.SetState(Consts_1.UserStates.DEBUG, !context.State(Consts_1.UserStates.DEBUG));
            BlisDebug_1.BlisDebug.enabled = context.State(Consts_1.UserStates.DEBUG);
            cb(["Debug " + (BlisDebug_1.BlisDebug.enabled ? "Enabled" : "Disabled")]);
        }
        else if (command == Command_1.LineCommands.DEBUGHELP) {
            cb([this.DebugHelp()]);
        }
        else if (command == Command_1.LineCommands.DUMP) {
            var memory = context.Memory();
            cb([memory.Dump()]);
        }
        else if (command == Command_1.LineCommands.ENTITIES) {
            Entity_1.Entity.Get(context, args, function (responses) {
                cb(responses);
            });
        }
        else if (command == Command_1.LineCommands.HELP) {
            cb([this.Help(args)]);
        }
        else if (command == Command_1.LineCommands.RESPONSES) {
            Action_1.Action.GetAll(context, Consts_1.ActionTypes.TEXT, args, function (responses) {
                cb(responses);
            });
        }
        else if (context.State(Consts_1.UserStates.TEACH)) {
            if (command == Command_1.LineCommands.ABANDON) {
                this.HandleIntCommand(context, Command_1.IntCommands.FORGETTEACH, cb);
            }
            else {
                var card = Utils_1.Utils.MakeHero("Not allowed while teaching", null, "Complete teaching first or Abandon teaching session.", {
                    "Abandon": Command_1.IntCommands.FORGETTEACH
                });
                cb([card]);
            }
        }
        else {
            if (command == Command_1.LineCommands.ADDALTTEXT) {
                TrainDialog_1.TrainDialog.Edit(context, args, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.LineCommands.APPS) {
                BlisApp_1.BlisApp.GetAll(context, args, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.LineCommands.CREATEAPP) {
                var _b = args.split(' '), appname = _b[0], luiskey = _b[1];
                BlisApp_1.BlisApp.Create(context, appname, luiskey, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.LineCommands.DELETEALLAPPS) {
                BlisApp_1.BlisApp.DeleteAll(context, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.LineCommands.DELETEACTION) {
                var actionId = args.split(' ')[0];
                Action_1.Action.Delete(context, actionId, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.LineCommands.DELETEAPP) {
                Utils_1.Utils.SendMessage(context, "Deleting app...");
                var appid = args.split(' ')[0];
                BlisApp_1.BlisApp.Delete(context, appid, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.LineCommands.DELETEENTITY) {
                var entityId = args.split(' ')[0];
                Entity_1.Entity.Delete(context, entityId, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.LineCommands.DONE) {
                // End any open session
                BlisSession_1.BlisSession.EndSession(context, function (responses) {
                    cb([Menu_1.Menu.Home()]);
                });
            }
            else if (command == Command_1.LineCommands.EDIT) {
                cb(Menu_1.Menu.EditCards());
            }
            else if (command == Command_1.LineCommands.EDITAPICALL) {
                var actionId = args.split(' ')[0];
                var content = Utils_1.Utils.RemoveWords(args, 1);
                Action_1.Action.Add(context, actionId, Consts_1.ActionTypes.API, null, content, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.LineCommands.EDITRESPONSE) {
                var actionId = args.split(' ')[0];
                var content = Utils_1.Utils.RemoveWords(args, 1);
                Action_1.Action.Add(context, actionId, Consts_1.ActionTypes.TEXT, null, content, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.LineCommands.EDITENTITY) {
                var _c = args.split(' '), entityId = _c[0], content = _c[1];
                Entity_1.Entity.Add(context, entityId, null, content, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.LineCommands.EXPORTAPP) {
                BlisAppContent_1.BlisAppContent.Export(context, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.LineCommands.IMPORTAPP) {
                Utils_1.Utils.SendMessage(context, "Importing app...");
                var appId = args.split(' ')[0];
                BlisAppContent_1.BlisAppContent.Import(context, appId, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.LineCommands.LOADAPP) {
                Utils_1.Utils.SendMessage(context, "Loading app...");
                var appId = args.split(' ')[0];
                BlisAppContent_1.BlisAppContent.Load(context, appId, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.LineCommands.START) {
                BlisSession_1.BlisSession.NewSession(context, false, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.LineCommands.TEACH) {
                var memory = context.Memory();
                memory.ClearTrainSteps();
                BlisSession_1.BlisSession.NewSession(context, true, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Command_1.LineCommands.TRAINDIALOGS) {
                var search = args.split(' ')[0];
                // Set up pager
                Pager_1.Pager.Init(context.session, search);
                TrainDialog_1.TrainDialog.Get(context, true, function (responses) {
                    cb(responses);
                });
            }
            else {
                var text = "_Command unrecognized or not valid in Teach mode_\n\n\n\n" + this.Help(null);
                cb([text]);
            }
        }
    };
    // Response to cued text
    CommandHandler.ProcessCueCommand = function (context, input, cb) {
        var memory = context.Memory();
        try {
            // Check for cancel action
            if (input == Command_1.IntCommands.CANCEL) {
                var responses = [];
                responses.push("Cancelled...");
                cb(Menu_1.Menu.EditCards(true));
                return;
            }
            var cueCommand = memory.CueCommand();
            // Clear cue command
            memory.SetCueCommand(null);
            var args = cueCommand.args ? cueCommand.args + " " : "";
            this.ProcessCommand(context, cueCommand.commandName, "" + args + input, cb);
        }
        catch (error) {
            var errMsg = BlisDebug_1.BlisDebug.Error(error);
            cb([errMsg]);
        }
    };
    CommandHandler.Help = function (command) {
        if (command) {
            // Don't require user to put ! in front of command
            if (!command.startsWith(Command_1.COMMANDPREFIX)) {
                command = Command_1.COMMANDPREFIX + command;
            }
            var helpmsg = Help_1.BlisHelp.CommandHelpString(command);
            return helpmsg;
        }
        var text = "";
        for (var item in Command_1.LineCommands) {
            var key = Command_1.LineCommands[item];
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
    // TOOD GET RID OF THIS
    CommandHandler.DebugHelp = function () {
        var text = "";
        text += Command_1.LineCommands.DEBUG + "\n\n       Toggle debug mode\n\n";
        text += Command_1.LineCommands.DELETEAPP + " {appId}\n\n       Delete specified application\n\n";
        text += Command_1.LineCommands.DUMP + "\n\n       Show client state\n\n";
        text += Command_1.LineCommands.ENTITIES + "\n\n       Return list of entities\n\n";
        text += Command_1.LineCommands.RESPONSES + " {y/n}\n\n       Return list of actions. If 'Y' show IDs\n\n";
        text += Command_1.LineCommands.TRAINDIALOGS + "\n\n       Return list of training dialogs\n\n";
        text += Command_1.LineCommands.HELP + "\n\n       General help";
        return text;
    };
    return CommandHandler;
}());
exports.CommandHandler = CommandHandler;
//# sourceMappingURL=CommandHandler.js.map