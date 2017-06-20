"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Menu_1 = require("./Menu");
var BlisClient_1 = require("./BlisClient");
var TrainDialog_1 = require("./Model/TrainDialog");
var BlisApp_1 = require("./Model/BlisApp");
var BlisDebug_1 = require("./BlisDebug");
var BlisSession_1 = require("./Model/BlisSession");
var CueCommand_1 = require("./Memory/CueCommand");
var Help_1 = require("./Model/Help");
var Action_1 = require("./Model/Action");
var Entity_1 = require("./Model/Entity");
var Pager_1 = require("./Memory/Pager");
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
            var cueCommand, memory, card, appId, action, appId, entity, appId, action, error_1, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 21, , 22]);
                        cueCommand = new CueCommand_1.CueCommand({ commandName: command, args: args });
                        memory = context.Memory();
                        return [4 /*yield*/, memory.CueCommand().Set(cueCommand)];
                    case 1:
                        _a.sent();
                        if (!(command == Command_1.LineCommands.ADDALTTEXT)) return [3 /*break*/, 2];
                        card = Utils_1.Utils.MakeHero("Enter Step Number and New User Text", "{turn number} {new input text}", null, []);
                        cb([card]);
                        return [3 /*break*/, 20];
                    case 2:
                        if (!(command == Command_1.LineCommands.ADDAPIAZURE)) return [3 /*break*/, 3];
                        cb([Menu_1.Menu.AddAzureApi()]);
                        return [3 /*break*/, 20];
                    case 3:
                        if (!(command == Command_1.LineCommands.ADDAPILOCAL)) return [3 /*break*/, 4];
                        cb([Menu_1.Menu.AddLocalApi()]);
                        return [3 /*break*/, 20];
                    case 4:
                        if (!(command == Command_1.LineCommands.ADDENTITY)) return [3 /*break*/, 5];
                        cb([Menu_1.Menu.AddEntity()]);
                        return [3 /*break*/, 20];
                    case 5:
                        if (!(command == Command_1.LineCommands.ADDRESPONSETEXT)) return [3 /*break*/, 6];
                        cb([Menu_1.Menu.AddResponseText()]);
                        return [3 /*break*/, 20];
                    case 6:
                        if (!(command == Command_1.LineCommands.ADDRESPONSEINTENT)) return [3 /*break*/, 7];
                        cb([Menu_1.Menu.AddResponseIntent()]);
                        return [3 /*break*/, 20];
                    case 7:
                        if (!(command == Command_1.LineCommands.CUEAPICALLS)) return [3 /*break*/, 8];
                        cb([Menu_1.Menu.APICalls()]);
                        return [3 /*break*/, 20];
                    case 8:
                        if (!(command == Command_1.LineCommands.APPS)) return [3 /*break*/, 9];
                        cb([Menu_1.Menu.Apps()]);
                        return [3 /*break*/, 20];
                    case 9:
                        if (!(command == Command_1.LineCommands.CREATEAPP)) return [3 /*break*/, 10];
                        cb([Menu_1.Menu.CreateApp()]);
                        return [3 /*break*/, 20];
                    case 10:
                        if (!(command == Command_1.LineCommands.EDITAPICALL)) return [3 /*break*/, 13];
                        return [4 /*yield*/, context.Memory().BotState().AppId()];
                    case 11:
                        appId = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetAction(appId, args)];
                    case 12:
                        action = _a.sent();
                        cb([Menu_1.Menu.EditAPICall(action)]);
                        return [3 /*break*/, 20];
                    case 13:
                        if (!(command == Command_1.LineCommands.EDITENTITY)) return [3 /*break*/, 16];
                        return [4 /*yield*/, context.Memory().BotState().AppId()];
                    case 14:
                        appId = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetEntity_v1(appId, args)];
                    case 15:
                        entity = _a.sent();
                        cb([Menu_1.Menu.EditEntity(entity)]);
                        return [3 /*break*/, 20];
                    case 16:
                        if (!(command == Command_1.LineCommands.EDITRESPONSE)) return [3 /*break*/, 19];
                        return [4 /*yield*/, context.Memory().BotState().AppId()];
                    case 17:
                        appId = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetAction(appId, args)];
                    case 18:
                        action = _a.sent();
                        cb([Menu_1.Menu.EditResponse(action)]);
                        return [3 /*break*/, 20];
                    case 19:
                        if (command == Command_1.LineCommands.ENTITIES) {
                            cb([Menu_1.Menu.Entities()]);
                        }
                        else if (command == Command_1.LineCommands.RESPONSES) {
                            cb([Menu_1.Menu.Responses()]);
                        }
                        else if (command == Command_1.LineCommands.TRAINDIALOGS) {
                            cb([Menu_1.Menu.TrainDialogs()]);
                        }
                        _a.label = 20;
                    case 20: return [3 /*break*/, 22];
                    case 21:
                        error_1 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_1);
                        cb([errMsg]);
                        return [3 /*break*/, 22];
                    case 22: return [2 /*return*/];
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
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, command, arg, arg2, arg3, memory, inTeach, steps, card;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = input.split(' '), command = _a[0], arg = _a[1], arg2 = _a[2], arg3 = _a[3];
                        command = command.toLowerCase();
                        //-------- Valid any time -----------------------//
                        if (command == Command_1.IntCommands.CHOOSEAPITYPE) {
                            cb([Menu_1.Menu.ChooseAPICall()]);
                            return [2 /*return*/];
                        }
                        else if (command == Command_1.IntCommands.CHOOSERESPONSETYPE) {
                            cb([Menu_1.Menu.ChooseResponse(context.session)]);
                            return [2 /*return*/];
                        }
                        memory = context.Memory();
                        return [4 /*yield*/, memory.BotState().InTeach()];
                    case 1:
                        inTeach = _b.sent();
                        if (!inTeach) return [3 /*break*/, 8];
                        if (!(command == Command_1.IntCommands.APICALLS)) return [3 /*break*/, 2];
                        this.CueCommand(context, Command_1.LineCommands.CUEAPICALLS, arg, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 7];
                    case 2:
                        if (!(command == Command_1.IntCommands.SAVETEACH)) return [3 /*break*/, 3];
                        BlisSession_1.BlisSession.EndSession(context, function (text) {
                            cb([Menu_1.Menu.Home("Dialog Trained")]);
                        });
                        return [3 /*break*/, 7];
                    case 3:
                        if (!(command == Command_1.IntCommands.FORGETTEACH)) return [3 /*break*/, 4];
                        // TODO: flag to not save training
                        BlisSession_1.BlisSession.EndSession(context, function (text) {
                            cb([Menu_1.Menu.Home("Dialog Abandoned")]);
                        });
                        return [3 /*break*/, 7];
                    case 4:
                        if (!(command == Command_1.IntCommands.DONETEACH)) return [3 /*break*/, 6];
                        return [4 /*yield*/, BlisSession_1.BlisSession.TrainStepText(context)];
                    case 5:
                        steps = _b.sent();
                        card = Utils_1.Utils.MakeHero("", "", "Does this look good?", {
                            "Save": Command_1.IntCommands.SAVETEACH,
                            "Abandon": Command_1.IntCommands.FORGETTEACH
                        });
                        cb([steps, card]);
                        return [3 /*break*/, 7];
                    case 6:
                        cb([command + " isn't a valid Int command or can only be performed while teaching."]);
                        _b.label = 7;
                    case 7: return [3 /*break*/, 17];
                    case 8:
                        if (!(command == Command_1.IntCommands.DELETEAPP)) return [3 /*break*/, 9];
                        BlisApp_1.BlisApp.Delete(context, arg, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 17];
                    case 9:
                        if (!(command == Command_1.IntCommands.DELETEDIALOG)) return [3 /*break*/, 10];
                        // Delete
                        TrainDialog_1.TrainDialog.Delete(context, arg, function (dreponses) {
                            // Continue displaying remaining dialogs
                            TrainDialog_1.TrainDialog.Get(context, true, function (responses) {
                                responses = dreponses.concat(responses);
                                cb(responses);
                            });
                        });
                        return [3 /*break*/, 17];
                    case 10:
                        if (!(command == Command_1.IntCommands.EDITDIALOG)) return [3 /*break*/, 11];
                        TrainDialog_1.TrainDialog.Edit(context, arg, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 17];
                    case 11:
                        if (!(command == Command_1.IntCommands.EDITAPP)) return [3 /*break*/, 12];
                        cb(Menu_1.Menu.EditCards());
                        return [3 /*break*/, 17];
                    case 12:
                        if (!(command == Command_1.IntCommands.TRAINDIALOG_NEXT)) return [3 /*break*/, 14];
                        // Next page
                        return [4 /*yield*/, Pager_1.Pager.Next(context)];
                    case 13:
                        // Next page
                        _b.sent();
                        TrainDialog_1.TrainDialog.Get(context, false, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 17];
                    case 14:
                        if (!(command == Command_1.IntCommands.TRAINDIALOG_PREV)) return [3 /*break*/, 16];
                        // Next page
                        return [4 /*yield*/, Pager_1.Pager.Prev(context)];
                    case 15:
                        // Next page
                        _b.sent();
                        TrainDialog_1.TrainDialog.Get(context, false, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 17];
                    case 16:
                        if (command == Command_1.IntCommands.CANCEL) {
                            cb(Menu_1.Menu.EditCards(true));
                        }
                        else {
                            cb([command + " is not a valid Int command or only available in Teach mode."]);
                        }
                        _b.label = 17;
                    case 17: return [2 /*return*/];
                }
            });
        });
    };
    CommandHandler.HandleLineCommand = function (context, input, cb) {
        var command = input.split(' ')[0];
        var args = this.RemoveCommandWord(input);
        this.ProcessCommand(context, command, args, cb);
    };
    CommandHandler.ProcessCommand = function (context, command, args, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, inTeach, _a, content, type, inDebug, memory_1, msg, card, _b, appname, luiskey, actionId, appid, entityId, actionId, content, actionId, content, _c, entityId, content, appId, appId, responses, memory_2, search, text;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        memory = context.Memory();
                        return [4 /*yield*/, memory.BotState().InTeach()];
                    case 1:
                        inTeach = _d.sent();
                        if (!(command == Command_1.LineCommands.ACTIONS)) return [3 /*break*/, 2];
                        Action_1.Action_v1.GetAll(context, null, args, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 45];
                    case 2:
                        if (!(command == Command_1.LineCommands.ADDAPICALL)) return [3 /*break*/, 3];
                        Action_1.Action_v1.Add_v1(context, null, Consts_1.ActionTypes_v1.API, null, args, function (responses, actionId) {
                            cb(responses, Consts_1.TeachAction.PICKACTION, actionId);
                        });
                        return [3 /*break*/, 45];
                    case 3:
                        if (!(command == Command_1.LineCommands.ADDAPIAZURE)) return [3 /*break*/, 4];
                        Action_1.Action_v1.Add_v1(context, null, Consts_1.ActionTypes_v1.API, Consts_1.APITypes_v1.AZURE, args, function (responses, actionId) {
                            cb(responses, Consts_1.TeachAction.PICKACTION, actionId);
                        });
                        return [3 /*break*/, 45];
                    case 4:
                        if (!(command == Command_1.LineCommands.ADDAPILOCAL)) return [3 /*break*/, 5];
                        Action_1.Action_v1.Add_v1(context, null, Consts_1.ActionTypes_v1.API, Consts_1.APITypes_v1.LOCAL, args, function (responses, actionId) {
                            cb(responses, Consts_1.TeachAction.PICKACTION, actionId);
                        });
                        return [3 /*break*/, 45];
                    case 5:
                        if (!(command == Command_1.LineCommands.ADDRESPONSE)) return [3 /*break*/, 6];
                        Action_1.Action_v1.Add_v1(context, null, Consts_1.ActionTypes_v1.TEXT, null, args, function (responses, actionId) {
                            cb(responses, Consts_1.TeachAction.PICKACTION, actionId);
                        });
                        return [3 /*break*/, 45];
                    case 6:
                        if (!(command == Command_1.LineCommands.ADDRESPONSETEXT)) return [3 /*break*/, 7];
                        Action_1.Action_v1.Add_v1(context, null, Consts_1.ActionTypes_v1.TEXT, null, args, function (responses, actionId) {
                            cb(responses, Consts_1.TeachAction.PICKACTION, actionId);
                        });
                        return [3 /*break*/, 45];
                    case 7:
                        if (!(command == Command_1.LineCommands.ADDRESPONSEINTENT)) return [3 /*break*/, 8];
                        // NOTE: Response Type INTENT are actuall API calls
                        Action_1.Action_v1.Add_v1(context, null, Consts_1.ActionTypes_v1.API, Consts_1.APITypes_v1.INTENT, args, function (responses, actionId) {
                            cb(responses, Consts_1.TeachAction.PICKACTION, actionId);
                        });
                        return [3 /*break*/, 45];
                    case 8:
                        if (!(command == Command_1.LineCommands.ADDENTITY)) return [3 /*break*/, 9];
                        _a = args.split(' '), content = _a[0], type = _a[1];
                        Entity_1.Entity_v1.Add_v1(context, null, type, content, function (responses) {
                            cb(responses, Consts_1.TeachAction.RETRAIN);
                        });
                        return [3 /*break*/, 45];
                    case 9:
                        if (!(command == Command_1.LineCommands.CUEAPICALLS)) return [3 /*break*/, 10];
                        Action_1.Action_v1.GetAll(context, Consts_1.ActionTypes_v1.API, args, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 45];
                    case 10:
                        if (!(command == Command_1.LineCommands.DEBUG)) return [3 /*break*/, 13];
                        return [4 /*yield*/, memory.BotState().InDebug()];
                    case 11:
                        inDebug = _d.sent();
                        return [4 /*yield*/, memory.BotState().SetInDebug(!inDebug)];
                    case 12:
                        _d.sent();
                        BlisDebug_1.BlisDebug.enabled = !inDebug;
                        cb(["Debug " + (BlisDebug_1.BlisDebug.enabled ? "Enabled" : "Disabled")]);
                        return [3 /*break*/, 45];
                    case 13:
                        if (!(command == Command_1.LineCommands.DEBUGHELP)) return [3 /*break*/, 14];
                        cb([this.DebugHelp()]);
                        return [3 /*break*/, 45];
                    case 14:
                        if (!(command == Command_1.LineCommands.DUMP)) return [3 /*break*/, 16];
                        memory_1 = context.Memory();
                        return [4 /*yield*/, memory_1.Dump()];
                    case 15:
                        msg = _d.sent();
                        cb([msg]);
                        return [3 /*break*/, 45];
                    case 16:
                        if (!(command == Command_1.LineCommands.ENTITIES)) return [3 /*break*/, 17];
                        Entity_1.Entity_v1.Get_v1(context, args, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 45];
                    case 17:
                        if (!(command == Command_1.LineCommands.HELP)) return [3 /*break*/, 18];
                        cb([this.Help(args)]);
                        return [3 /*break*/, 45];
                    case 18:
                        if (!(command == Command_1.LineCommands.RESPONSES)) return [3 /*break*/, 19];
                        Action_1.Action_v1.GetAll(context, Consts_1.ActionTypes_v1.TEXT, args, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 45];
                    case 19:
                        if (!inTeach) return [3 /*break*/, 23];
                        if (!(command == Command_1.LineCommands.ABANDON)) return [3 /*break*/, 21];
                        return [4 /*yield*/, this.HandleIntCommand(context, Command_1.IntCommands.FORGETTEACH, cb)];
                    case 20:
                        _d.sent();
                        return [3 /*break*/, 22];
                    case 21:
                        card = Utils_1.Utils.MakeHero("Not allowed while teaching", null, "Complete teaching first or Abandon teaching session.", {
                            "Abandon": Command_1.IntCommands.FORGETTEACH
                        });
                        cb([card]);
                        _d.label = 22;
                    case 22: return [3 /*break*/, 45];
                    case 23:
                        if (!(command == Command_1.LineCommands.ADDALTTEXT)) return [3 /*break*/, 24];
                        TrainDialog_1.TrainDialog.Edit(context, args, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 45];
                    case 24:
                        if (!(command == Command_1.LineCommands.APPS)) return [3 /*break*/, 25];
                        BlisApp_1.BlisApp.GetAll(context, args, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 45];
                    case 25:
                        if (!(command == Command_1.LineCommands.CREATEAPP)) return [3 /*break*/, 26];
                        _b = args.split(' '), appname = _b[0], luiskey = _b[1];
                        BlisApp_1.BlisApp.Create(context, appname, luiskey, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 45];
                    case 26:
                        if (!(command == Command_1.LineCommands.DELETEALLAPPS)) return [3 /*break*/, 27];
                        BlisApp_1.BlisApp.DeleteAll(context, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 45];
                    case 27:
                        if (!(command == Command_1.LineCommands.DELETEACTION)) return [3 /*break*/, 28];
                        actionId = args.split(' ')[0];
                        Action_1.Action_v1.Delete_v1(context, actionId, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 45];
                    case 28:
                        if (!(command == Command_1.LineCommands.DELETEAPP)) return [3 /*break*/, 29];
                        Utils_1.Utils.SendMessage(context, "Deleting app...");
                        appid = args.split(' ')[0];
                        BlisApp_1.BlisApp.Delete(context, appid, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 45];
                    case 29:
                        if (!(command == Command_1.LineCommands.DELETEENTITY)) return [3 /*break*/, 30];
                        entityId = args.split(' ')[0];
                        Entity_1.Entity_v1.Delete_v1(context, entityId, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 45];
                    case 30:
                        if (!(command == Command_1.LineCommands.DONE)) return [3 /*break*/, 31];
                        // End any open session
                        BlisSession_1.BlisSession.EndSession(context, function (responses) {
                            cb([Menu_1.Menu.Home()]);
                        });
                        return [3 /*break*/, 45];
                    case 31:
                        if (!(command == Command_1.LineCommands.EDIT)) return [3 /*break*/, 32];
                        cb(Menu_1.Menu.EditCards());
                        return [3 /*break*/, 45];
                    case 32:
                        if (!(command == Command_1.LineCommands.EDITAPICALL)) return [3 /*break*/, 33];
                        actionId = args.split(' ')[0];
                        content = Utils_1.Utils.RemoveWords(args, 1);
                        Action_1.Action_v1.Add_v1(context, actionId, Consts_1.ActionTypes_v1.API, null, content, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 45];
                    case 33:
                        if (!(command == Command_1.LineCommands.EDITRESPONSE)) return [3 /*break*/, 34];
                        actionId = args.split(' ')[0];
                        content = Utils_1.Utils.RemoveWords(args, 1);
                        Action_1.Action_v1.Add_v1(context, actionId, Consts_1.ActionTypes_v1.TEXT, null, content, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 45];
                    case 34:
                        if (!(command == Command_1.LineCommands.EDITENTITY)) return [3 /*break*/, 35];
                        _c = args.split(' '), entityId = _c[0], content = _c[1];
                        Entity_1.Entity_v1.Add_v1(context, entityId, null, content, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 45];
                    case 35:
                        if (!(command == Command_1.LineCommands.EXPORTAPP)) return [3 /*break*/, 36];
                        BlisAppContent_1.BlisAppContent.Export(context, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 45];
                    case 36:
                        if (!(command == Command_1.LineCommands.IMPORTAPP)) return [3 /*break*/, 37];
                        Utils_1.Utils.SendMessage(context, "Importing app...");
                        appId = args.split(' ')[0];
                        BlisAppContent_1.BlisAppContent.Import(context, appId, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 45];
                    case 37:
                        if (!(command == Command_1.LineCommands.LOADAPP)) return [3 /*break*/, 39];
                        Utils_1.Utils.SendMessage(context, "Loading app...");
                        appId = args.split(' ')[0];
                        return [4 /*yield*/, BlisAppContent_1.BlisAppContent.Load(context, appId)];
                    case 38:
                        responses = _d.sent();
                        cb(responses);
                        return [3 /*break*/, 45];
                    case 39:
                        if (!(command == Command_1.LineCommands.START)) return [3 /*break*/, 40];
                        BlisSession_1.BlisSession.NewSession(context, false, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 45];
                    case 40:
                        if (!(command == Command_1.LineCommands.TEACH)) return [3 /*break*/, 42];
                        memory_2 = context.Memory();
                        return [4 /*yield*/, memory_2.TrainHistory().Clear()];
                    case 41:
                        _d.sent();
                        BlisSession_1.BlisSession.NewSession(context, true, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 45];
                    case 42:
                        if (!(command == Command_1.LineCommands.TRAINDIALOGS)) return [3 /*break*/, 44];
                        search = args.split(' ')[0];
                        // Set up pager
                        return [4 /*yield*/, memory.Pager().Init(search)];
                    case 43:
                        // Set up pager
                        _d.sent();
                        TrainDialog_1.TrainDialog.Get(context, true, function (responses) {
                            cb(responses);
                        });
                        return [3 /*break*/, 45];
                    case 44:
                        text = "_Command unrecognized or not valid in Teach mode_\n\n\n\n" + this.Help(null);
                        cb([text]);
                        _d.label = 45;
                    case 45: return [2 /*return*/];
                }
            });
        });
    };
    // Response to cued text
    CommandHandler.ProcessCueCommand = function (context, input, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, responses, cueCommand, args, error_2, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        memory = context.Memory();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        // Check for cancel action
                        if (input == Command_1.IntCommands.CANCEL) {
                            responses = [];
                            responses.push("Cancelled...");
                            cb(Menu_1.Menu.EditCards(true));
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, memory.CueCommand().Get()];
                    case 2:
                        cueCommand = _a.sent();
                        // Clear cue command
                        return [4 /*yield*/, memory.CueCommand().Clear()];
                    case 3:
                        // Clear cue command
                        _a.sent();
                        args = cueCommand.args ? cueCommand.args + " " : "";
                        this.ProcessCommand(context, cueCommand.commandName, "" + args + input, cb);
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_2);
                        cb([errMsg]);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
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