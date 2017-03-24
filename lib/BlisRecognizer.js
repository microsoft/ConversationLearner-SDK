"use strict";
var tslib_1 = require("tslib");
var builder = require("botbuilder");
var request = require("request");
var util = require("util");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var TakeTurnRequest_1 = require("./Model/TakeTurnRequest");
var BlisApp_1 = require("./Model/BlisApp");
var BlisClient_1 = require("./BlisClient");
var BlisMemory_1 = require("./BlisMemory");
var BlisDebug_1 = require("./BlisDebug");
var BlisUserState_1 = require("./BlisUserState");
var Action_1 = require("./Model/Action");
var Consts_1 = require("./Model/Consts");
var Help_1 = require("./Model/Help");
var TakeTurnResponse_1 = require("./Model/TakeTurnResponse");
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
                    this.blisClient = new BlisClient_1.BlisClient(options.serviceUri, options.user, options.secret);
                    this.luisCallback = options.luisCallback;
                    this.apiCallbacks = options.apiCallbacks;
                    this.intApiCallbacks[Consts_1.APICalls.SAVEENTITY] = this.SaveEntityCB;
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
    BlisRecognizer.prototype.ReadFromFile = function (url) {
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: url,
                json: true,
                encoding: 'utf8'
            };
            request.get(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body.message);
                }
                else {
                    var model = String.fromCharCode.apply(null, body.data);
                    resolve(model);
                }
            });
        });
    };
    BlisRecognizer.prototype.AddAction = function (userState, content, actionType, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var error, msg, firstNeg, firstPos, cut, actionText, memory, negIds, posIds, negNames, posNames, saveName, saveId, words, _i, words_1, word, posName, posID, negName, negID, posName, posID, saveAPI, apiCall, apiActionId, actionId, substr, card, error_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("AddAction");
                        error = null;
                        if (content.split(' ').length < 2) {
                            error = "You must provide content for the action.";
                        }
                        if (!actionType) {
                            error = "You must provide the actionType.";
                        }
                        if (error) {
                            msg = null;
                            if (actionType == Consts_1.ActionTypes.API) {
                                msg = Help_1.BlisHelp.CommandHelpString(Consts_1.Commands.ADDAPIACTION, error);
                            }
                            else {
                                msg = Help_1.BlisHelp.CommandHelpString(Consts_1.Commands.ADDTEXTACTION, error);
                            }
                            cb([msg]);
                            return [2 /*return*/];
                        }
                        firstNeg = content.indexOf('--');
                        firstPos = content.indexOf('++');
                        cut = 0;
                        if (firstNeg > 0 && firstPos > 0) {
                            cut = Math.min(firstNeg, firstPos);
                        }
                        else {
                            cut = Math.max(firstNeg, firstPos);
                        }
                        actionText = (cut > 0) ? content.slice(0, cut - 1) : content;
                        memory = new BlisMemory_1.BlisMemory(userState);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        negIds = [];
                        posIds = [];
                        negNames = [];
                        posNames = [];
                        saveName = null;
                        saveId = null;
                        words = Action_1.Action.Split(actionText);
                        for (_i = 0, words_1 = words; _i < words_1.length; _i++) {
                            word = words_1[_i];
                            // Add requirement for entity when used for substitution
                            if (word.startsWith('$')) {
                                posName = word.slice(1);
                                if (posNames.indexOf(posName) < 0) {
                                    posID = memory.EntityName2Id(posName);
                                    if (posID) {
                                        posIds.push(posID);
                                        posNames.push(posName);
                                    }
                                    else {
                                        cb(["Entity $" + posName + " not found."]);
                                        return [2 /*return*/];
                                    }
                                }
                            }
                            else if (word.startsWith('!')) {
                                // Only allow one suggested entity
                                if (saveName) {
                                    cb(["Only one entity suggestion (denoted by \"!_ENTITY_\") allowed per Action"]);
                                    return [2 /*return*/];
                                }
                                if (actionType == Consts_1.ActionTypes.API) {
                                    cb(["Suggested entities can't be added to API Actions"]);
                                    return [2 /*return*/];
                                }
                                saveName = word.slice(1);
                                saveId = memory.EntityName2Id(saveName);
                                if (!saveId) {
                                    cb(["Entity $" + saveName + " not found."]);
                                    return [2 /*return*/];
                                }
                                // Add to negative entities
                                if (negNames.indexOf(saveName) < 0) {
                                    negIds.push(saveId);
                                    negNames.push(saveName);
                                }
                            }
                            else if (word.startsWith('--')) {
                                negName = word.slice(2);
                                negID = memory.EntityName2Id(negName);
                                if (negID) {
                                    negIds.push(negID);
                                    negNames.push(negName);
                                }
                                else {
                                    cb(["Entity $" + negName + " not found."]);
                                    return [2 /*return*/];
                                }
                            }
                            else if (word.startsWith('++')) {
                                posName = word.slice(2);
                                if (posNames.indexOf(posName) < 0) {
                                    posID = memory.EntityName2Id(posName);
                                    if (posID) {
                                        posIds.push(posID);
                                        posNames.push(posName);
                                    }
                                    else {
                                        cb(["Entity $" + posName + " not found."]);
                                        return [2 /*return*/];
                                    }
                                }
                            }
                        }
                        if (!saveId) return [3 /*break*/, 3];
                        saveAPI = memory.APILookup(saveName);
                        if (!!saveAPI) return [3 /*break*/, 3];
                        apiCall = Consts_1.APICalls.SAVEENTITY + " " + saveName;
                        return [4 /*yield*/, this.blisClient.AddAction(userState[Consts_1.UserStates.APP], apiCall, Consts_1.ActionTypes.API, [], [saveId])];
                    case 2:
                        apiActionId = _a.sent();
                        memory.AddAPILookup(saveName, apiActionId);
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.blisClient.AddAction(userState[Consts_1.UserStates.APP], actionText, actionType, posIds, negIds)];
                    case 4:
                        actionId = _a.sent();
                        substr = "";
                        if (posIds.length > 0) {
                            substr += "++[" + posNames.toLocaleString() + "]\n\n";
                        }
                        if (negIds.length > 0) {
                            substr += "--[" + negNames.toLocaleString() + "]";
                        }
                        card = this.MakeHero("Created Action", /* actionId + "\n\n" +*/ substr + "\n\n", actionText, null);
                        cb([card]);
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_1);
                        cb(error_1);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.AddEntity = function (userState, entityName, entityType, prebuiltName, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var error, msg, msg, msg, entityId, memory, card, error_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Add Entity " + entityName);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        error = null;
                        if (!entityName) {
                            error = "You must provide an entity name for the entity to create.";
                        }
                        if (!entityType) {
                            error = "You must provide an entity type for the entity to create.";
                        }
                        if (error) {
                            msg = Help_1.BlisHelp.CommandHelpString(Consts_1.Commands.ADDENTITY, error);
                            cb([msg]);
                            return [2 /*return*/];
                        }
                        entityType = entityType.toUpperCase();
                        if (entityType != Consts_1.EntityTypes.LOCAL && entityType != Consts_1.EntityTypes.LUIS) {
                            msg = "Entity type must be 'LOCAL' or 'LUIS'\n\n     " + Consts_1.Commands.ADDENTITY + " {entitiyName} {LUIS | LOCAL} {prebuiltName?}";
                            cb([msg]);
                            return [2 /*return*/];
                        }
                        if (entityType == Consts_1.EntityTypes.LOCAL && prebuiltName != null) {
                            msg = "LOCAL entities shouldn't include a prebuilt name\n\n     " + Consts_1.Commands.ADDENTITY + " {entitiyName} {LUIS | LOCAL} {prebuiltName?}";
                            cb([msg]);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.blisClient.AddEntity(userState[Consts_1.UserStates.APP], entityName, entityType, prebuiltName)];
                    case 2:
                        entityId = _a.sent();
                        memory = new BlisMemory_1.BlisMemory(userState);
                        memory.AddEntityLookup(entityName, entityId);
                        card = this.MakeHero("Created Entity", entityId, entityName, null);
                        cb([card]);
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_2);
                        cb([error_2]);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.CreateApp = function (userState, appName, luisKey, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg, msg, appId, card, error_3;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Create Application");
                        // TODO - temp debug
                        if (luisKey == '*') {
                            luisKey = '5bb9d31334f14bc5a6bd0d7c3d06094d'; // SRAL
                        }
                        if (luisKey == '**') {
                            luisKey = '8d7dadb7520044c59518b5203b75e802';
                        }
                        if (!appName) {
                            msg = "You must provide a name for your application.\n\n     " + Consts_1.Commands.CREATEAPP + " {app Name} {luis key}";
                            cb([msg]);
                            return [2 /*return*/];
                        }
                        if (!luisKey) {
                            msg = "You must provide a luisKey for your application.\n\n     " + Consts_1.Commands.CREATEAPP + " {app Name} {luis key}";
                            cb([msg]);
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.blisClient.CreateApp(appName, luisKey)];
                    case 2:
                        appId = _a.sent();
                        // Initialize
                        Object.assign(userState, new BlisUserState_1.BlisUserState(appId));
                        card = this.MakeHero("Created App", appId, null, { "Help": Help_1.Help.NEWAPP });
                        cb([card]);
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_3);
                        cb([error_3]);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
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
    /** Delete Action with the given actionId */
    BlisRecognizer.prototype.DeleteAction = function (userState, actionId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg, error_4;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Action");
                        if (!actionId) {
                            msg = "You must provide the ID of the action to delete.\n\n     " + Consts_1.Commands.DELETEACTION + " {app ID}";
                            cb(msg);
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        // TODO clear savelookup
                        return [4 /*yield*/, this.blisClient.DeleteAction(userState[Consts_1.UserStates.APP], actionId)];
                    case 2:
                        // TODO clear savelookup
                        _a.sent();
                        cb("Deleted Action " + actionId);
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_4);
                        cb(error_4);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.DeleteAllApps = function (userState, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var appIds, json, _i, appIds_1, appId, text, error_5;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete All Applications");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        appIds = [];
                        return [4 /*yield*/, this.blisClient.GetApps()];
                    case 2:
                        json = _a.sent();
                        appIds = JSON.parse(json)['ids'];
                        BlisDebug_1.BlisDebug.Log("Found " + appIds.length + " apps");
                        _i = 0, appIds_1 = appIds;
                        _a.label = 3;
                    case 3:
                        if (!(_i < appIds_1.length)) return [3 /*break*/, 6];
                        appId = appIds_1[_i];
                        return [4 /*yield*/, this.blisClient.DeleteApp(userState, appId)];
                    case 4:
                        text = _a.sent();
                        BlisDebug_1.BlisDebug.Log("Deleted " + appId + " apps");
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        cb("Done");
                        return [3 /*break*/, 8];
                    case 7:
                        error_5 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_5);
                        cb([error_5]);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.DeleteApp = function (userState, appId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg, error_6;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Application");
                        if (!appId) {
                            msg = Help_1.BlisHelp.Get(Help_1.Help.DELETEAPP);
                            cb(msg);
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.blisClient.DeleteApp(userState, appId)];
                    case 2:
                        _a.sent();
                        cb("Deleted App " + appId);
                        return [3 /*break*/, 4];
                    case 3:
                        error_6 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_6);
                        cb(error_6);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.DeleteTrainDialog = function (userState, dialogId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg, error_7;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Training Dialog");
                        if (!dialogId) {
                            msg = "You must provide the ID of the dialog to delete.\n\n     " + Consts_1.IntCommands.DELETEDIALOG + " {dialogId}";
                            cb(msg);
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        // TODO clear savelookup
                        return [4 /*yield*/, this.blisClient.DeleteTrainDialog(userState[Consts_1.UserStates.APP], dialogId)];
                    case 2:
                        // TODO clear savelookup
                        _a.sent();
                        cb("Deleted TrainDialog " + dialogId);
                        return [3 /*break*/, 4];
                    case 3:
                        error_7 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_7);
                        cb(error_7);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.EndSession = function (userState, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var sessionId, modelId, error_8;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.blisClient.EndSession(userState)];
                    case 1:
                        sessionId = _a.sent();
                        return [4 /*yield*/, this.blisClient.GetModel(userState)];
                    case 2:
                        modelId = _a.sent();
                        cb(sessionId);
                        return [3 /*break*/, 4];
                    case 3:
                        error_8 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_8);
                        cb(error_8);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.ExportApp = function (userState, address, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var dialogIds, blisapp, msg, error_9;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Exporting App");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        dialogIds = [];
                        return [4 /*yield*/, this.blisClient.ExportApp(userState[Consts_1.UserStates.APP])];
                    case 2:
                        blisapp = _a.sent();
                        msg = JSON.stringify(blisapp);
                        if (address.channelId == "emulator") {
                            cb(msg);
                        }
                        else {
                            this.SendAsAttachment(address, msg);
                            cb("");
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_9 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_9);
                        cb(error_9);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.GetActions = function (userState, detail, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var actionIds, json, textactions, apiactions, _i, actionIds_1, actionId, action, memory, posstring, negstring, atext, name_1, msg, error_10;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting actions");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        actionIds = [];
                        return [4 /*yield*/, this.blisClient.GetActions(userState[Consts_1.UserStates.APP])];
                    case 2:
                        json = _a.sent();
                        actionIds = JSON.parse(json)['ids'];
                        BlisDebug_1.BlisDebug.Log("Found " + actionIds.length + " actions");
                        textactions = "";
                        apiactions = "";
                        _i = 0, actionIds_1 = actionIds;
                        _a.label = 3;
                    case 3:
                        if (!(_i < actionIds_1.length)) return [3 /*break*/, 6];
                        actionId = actionIds_1[_i];
                        return [4 /*yield*/, this.blisClient.GetAction(userState[Consts_1.UserStates.APP], actionId)];
                    case 4:
                        action = _a.sent();
                        memory = new BlisMemory_1.BlisMemory(userState);
                        posstring = memory.EntityNames(action.requiredEntities);
                        negstring = memory.EntityNames(action.negativeEntities);
                        atext = "" + action.content;
                        if (posstring.length > 0) {
                            atext += "  ++[" + posstring + "]";
                        }
                        if (negstring.length > 0) {
                            atext += "  --[" + negstring + "]";
                        }
                        // Show detail if requested
                        atext += detail ? ": _" + actionId + "_\n\n" : "\n\n";
                        if (action.actionType == Consts_1.ActionTypes.API) {
                            apiactions += atext;
                            // Create lookup for saveEntity actions
                            if (action.content.startsWith(Consts_1.APICalls.SAVEENTITY)) {
                                name_1 = Action_1.Action.Split(action.content)[1];
                                memory.AddAPILookup(name_1, actionId);
                            }
                        }
                        else if (action.actionType == Consts_1.ActionTypes.TEXT) {
                            textactions += atext;
                        }
                        BlisDebug_1.BlisDebug.Log("Action lookup: " + action.content + " : " + action.actionType);
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        msg = "";
                        if (apiactions) {
                            msg += "**API Actions**\n\n" + apiactions;
                        }
                        if (textactions) {
                            msg += "**TEXT Actions**\n\n" + textactions;
                        }
                        if (!msg) {
                            msg = "This application contains no actions.";
                        }
                        cb(msg);
                        return [3 /*break*/, 8];
                    case 7:
                        error_10 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_10);
                        cb(error_10);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.GetApps = function (cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var appIds, json, msg, _i, appIds_2, appId, ajson, name_2, id, error_11;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting apps");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        appIds = [];
                        return [4 /*yield*/, this.blisClient.GetApps()];
                    case 2:
                        json = _a.sent();
                        appIds = JSON.parse(json)['ids'];
                        BlisDebug_1.BlisDebug.Log("Found " + appIds.length + " apps");
                        msg = "";
                        _i = 0, appIds_2 = appIds;
                        _a.label = 3;
                    case 3:
                        if (!(_i < appIds_2.length)) return [3 /*break*/, 6];
                        appId = appIds_2[_i];
                        return [4 /*yield*/, this.blisClient.GetApp(appId)];
                    case 4:
                        ajson = _a.sent();
                        name_2 = ajson['app-name'];
                        id = ajson['model-id'];
                        msg += name_2 + " : " + id + "\n\n";
                        BlisDebug_1.BlisDebug.Log("App lookup: " + name_2 + " : " + id);
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        if (!msg) {
                            msg = "This account contains no apps.";
                        }
                        cb(msg);
                        return [3 /*break*/, 8];
                    case 7:
                        error_11 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_11);
                        cb(error_11);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.GetEntities = function (userState, detail, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityIds, json, memory, msg, _i, entityIds_1, entityId, entity, error_12;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting entities");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        entityIds = [];
                        return [4 /*yield*/, this.blisClient.GetEntities(userState[Consts_1.UserStates.APP])];
                    case 2:
                        json = _a.sent();
                        entityIds = JSON.parse(json)['ids'];
                        BlisDebug_1.BlisDebug.Log("Found " + entityIds.length + " entities");
                        memory = new BlisMemory_1.BlisMemory(userState);
                        msg = "**Entities**\n\n";
                        _i = 0, entityIds_1 = entityIds;
                        _a.label = 3;
                    case 3:
                        if (!(_i < entityIds_1.length)) return [3 /*break*/, 6];
                        entityId = entityIds_1[_i];
                        return [4 /*yield*/, this.blisClient.GetEntity(userState[Consts_1.UserStates.APP], entityId)];
                    case 4:
                        entity = _a.sent();
                        // Add to entity lookup table
                        memory.AddEntityLookup(entity.name, entityId);
                        BlisDebug_1.BlisDebug.Log("Entity lookup: " + entityId + " : " + entity.name);
                        if (detail == 'Y') {
                            msg += "$" + entity.name + " : " + entityId + "\n\n";
                        }
                        else {
                            msg += "$" + entity.name + "\n\n";
                        }
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        if (!msg) {
                            msg = "This application contains no entities.";
                        }
                        cb(msg);
                        return [3 /*break*/, 8];
                    case 7:
                        error_12 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_12);
                        cb(error_12);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.GetTrainDialogs = function (userState, address, searchTerm, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var blisApp, dialogs, responses, _i, dialogs_1, dialog, error_13;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.blisClient.ExportApp(userState[Consts_1.UserStates.APP])];
                    case 1:
                        blisApp = _a.sent();
                        return [4 /*yield*/, blisApp.findTrainDialogs(this.blisClient, userState[Consts_1.UserStates.APP], searchTerm)];
                    case 2:
                        dialogs = _a.sent();
                        if (dialogs.length == 0) {
                            cb(["No maching dialogs found."]);
                            return [2 /*return*/];
                        }
                        responses = [];
                        for (_i = 0, dialogs_1 = dialogs; _i < dialogs_1.length; _i++) {
                            dialog = dialogs_1[_i];
                            responses.push(dialog.text);
                            responses.push(this.MakeHero(null, dialog.dialogId, null, { "Delete": Consts_1.IntCommands.DELETEDIALOG + " " + dialog.dialogId }));
                        }
                        cb(responses);
                        return [3 /*break*/, 4];
                    case 3:
                        error_13 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_13);
                        cb(error_13.message);
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
    BlisRecognizer.prototype.LoadApp = function (userState, appId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg, loadedId, modelId, text, sessionId, error_14;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to load Application " + appId);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 10]);
                        // TODO - temp debug
                        if (appId == '*') {
                            appId = '0241bae4-ebba-45ca-88b2-2543339c4e6d';
                        }
                        if (!appId) {
                            msg = "You must provide the ID of the application to load.\n\n     !loadapp {app ID}";
                            cb(msg);
                            return [2 /*return*/];
                        }
                        // Initialize
                        Object.assign(userState, new BlisUserState_1.BlisUserState(appId));
                        return [4 /*yield*/, this.blisClient.GetApp(appId)];
                    case 2:
                        loadedId = _a.sent();
                        BlisDebug_1.BlisDebug.Log("Found App: " + loadedId);
                        return [4 /*yield*/, this.blisClient.GetModel(userState)];
                    case 3:
                        modelId = _a.sent();
                        BlisDebug_1.BlisDebug.Log("Found Model: " + appId);
                        if (!!userState[Consts_1.UserStates.MODEL]) return [3 /*break*/, 5];
                        BlisDebug_1.BlisDebug.Log("Training the model...");
                        return [4 /*yield*/, this.blisClient.TrainModel(userState)];
                    case 4:
                        text = _a.sent();
                        BlisDebug_1.BlisDebug.Log("Model trained: " + text);
                        _a.label = 5;
                    case 5: 
                    // Load entities to generate lookup table
                    return [4 /*yield*/, this.GetEntities(userState, null, function (text) {
                            BlisDebug_1.BlisDebug.Log("Entity lookup generated");
                        })];
                    case 6:
                        // Load entities to generate lookup table
                        _a.sent();
                        // Load actions to generate lookup table
                        return [4 /*yield*/, this.GetActions(userState, null, function (text) {
                                BlisDebug_1.BlisDebug.Log("Action lookup generated");
                            })];
                    case 7:
                        // Load actions to generate lookup table
                        _a.sent();
                        // Create session
                        BlisDebug_1.BlisDebug.Log("Creating session...");
                        return [4 /*yield*/, this.blisClient.StartSession(userState[Consts_1.UserStates.APP])];
                    case 8:
                        sessionId = _a.sent();
                        BlisDebug_1.BlisDebug.Log("Stared Session: " + appId);
                        new BlisMemory_1.BlisMemory(userState).StartSession(sessionId, false);
                        cb("Application loaded and Session started.");
                        return [3 /*break*/, 10];
                    case 9:
                        error_14 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_14);
                        cb(error_14);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /** Import (and merge) application with given appId */
    BlisRecognizer.prototype.ImportApp = function (userState, appId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var importApp, mergedApp, memory, error_15;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.blisClient.ExportApp(userState[Consts_1.UserStates.APP])];
                    case 1:
                        importApp = _a.sent();
                        return [4 /*yield*/, this.blisClient.ImportApp(userState[Consts_1.UserStates.APP], importApp)];
                    case 2:
                        mergedApp = _a.sent();
                        memory = new BlisMemory_1.BlisMemory(userState);
                        this.LoadApp(userState, memory.AppId(), function (text) {
                            cb(text);
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        error_15 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_15);
                        cb(error_15.message);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /** Import application from sent attachment */
    BlisRecognizer.prototype.ImportAppAttachment = function (userState, attachment, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var text, json, blisApp, newApp, memory, error_16;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (attachment.contentType != "text/plain") {
                            cb("Expected a text file for import.");
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.ReadFromFile(attachment.contentUrl)];
                    case 2:
                        text = _a.sent();
                        json = JSON.parse(text);
                        blisApp = json_typescript_mapper_1.deserialize(BlisApp_1.BlisApp, json);
                        return [4 /*yield*/, this.blisClient.ImportApp(userState[Consts_1.UserStates.APP], json)];
                    case 3:
                        newApp = _a.sent();
                        memory = new BlisMemory_1.BlisMemory(userState);
                        this.LoadApp(userState, memory.AppId(), function (text) {
                            cb(text);
                        });
                        return [3 /*break*/, 5];
                    case 4:
                        error_16 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_16);
                        cb(text);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.NewSession = function (userState, teach, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var endId, sessionId, body, subtext, card, error_17;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to create new session, Teach = " + teach);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.blisClient.EndSession(userState)];
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
                            subtext = "At any point type _" + Consts_1.Commands.ABANDON + "_ to abort";
                            card = this.MakeHero("Teach mode started", subtext, body, null);
                            cb([card]);
                        }
                        else {
                            cb(["_Bot started..._"]);
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_17 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_17);
                        userState[Consts_1.UserStates.SESSION] = null; // Clear the bad session
                        cb([error_17]);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.SendTyping = function (address) {
        var msg = { type: 'typing' };
        msg.address = address;
        this.bot.send(msg);
    };
    /** Send an out of band message */
    BlisRecognizer.prototype.SendMessage = function (address, content) {
        var message = new builder.Message()
            .address(address);
        if (typeof content == 'string') {
            message.text(content);
        }
        else {
            message.addAttachment(content);
        }
        this.bot.send(message);
    };
    /** Send a group of out of band message */
    BlisRecognizer.prototype.SendResponses = function (address, responses) {
        for (var _i = 0, responses_1 = responses; _i < responses_1.length; _i++) {
            var response = responses_1[_i];
            this.SendMessage(address, response);
        }
    };
    BlisRecognizer.prototype.SendAsAttachment = function (address, content) {
        var base64 = Buffer.from(content).toString('base64');
        var msg = new builder.Message();
        msg.data.address = address;
        var contentType = "text/plain";
        var attachment = {
            contentUrl: util.format('data:%s;base64,%s', contentType, base64),
            contentType: contentType,
            content: content
        };
        msg.addAttachment(attachment);
        this.bot.send(msg);
    };
    BlisRecognizer.prototype.LoadUser = function (address, cb) {
        var _this = this;
        // TODO handle errors
        BlisUserState_1.BlisUserState.Get(this.bot, address, this.defaultApp, function (error, userState, isNew) {
            if (isNew) {
                // Attempt to load the application
                _this.LoadApp(userState, _this.defaultApp, function (text) {
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
        BlisDebug_1.BlisDebug.Verbose("SendResult: " + responses[0]);
        // Save user state
        BlisUserState_1.BlisUserState.Save(this.bot, address, userState);
        // Assume BLIS always wins for now 
        var result = { score: 1.0, responses: responses, intent: null };
        // Send callback
        cb(null, result);
    };
    BlisRecognizer.prototype.HandleHelp = function (input, address, userState, cb) {
        var help = Help_1.BlisHelp.Get(input);
        this.SendResult(address, userState, cb, [help]);
    };
    BlisRecognizer.prototype.HandleCommand = function (input, address, userState, cb) {
        var _a = input.split(' '), command = _a[0], arg = _a[1], arg2 = _a[2], arg3 = _a[3];
        command = command.toLowerCase();
        //---------------------------------------------------
        // Commands allowed at any time
        if (command == Consts_1.Commands.ACTIONS) {
            this.GetActions(userState, arg, function (text) {
                cb([text]);
            });
        }
        else if (command == Consts_1.Commands.ADDENTITY) {
            this.AddEntity(userState, arg, arg2, arg3, function (responses) {
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
            this.GetEntities(userState, arg, function (text) {
                cb([text]);
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
                cb(["_Command only valid while in Teach mode_"]);
            }
        }
        else {
            if (command == Consts_1.Commands.ADDAPIACTION) {
                var firstSpace = input.indexOf(' ');
                var start = input.slice(firstSpace + 1);
                this.AddAction(userState, start, Consts_1.ActionTypes.API, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.ADDTEXTACTION) {
                var firstSpace = input.indexOf(' ');
                var start = input.slice(firstSpace + 1);
                this.AddAction(userState, start, Consts_1.ActionTypes.TEXT, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.APPS) {
                this.GetApps(function (text) {
                    cb([text]);
                });
            }
            else if (command == Consts_1.Commands.CREATEAPP) {
                this.CreateApp(userState, arg, arg2, function (responses) {
                    cb(responses);
                });
            }
            else if (command == Consts_1.Commands.DELETEALLAPPS) {
                this.DeleteAllApps(userState, function (text) {
                    cb([text]);
                });
            }
            else if (command == Consts_1.Commands.DELETEACTION) {
                this.DeleteAction(userState, arg, function (text) {
                    cb([text]);
                });
            }
            else if (command == Consts_1.Commands.DELETEAPP) {
                this.DeleteApp(userState, arg, function (text) {
                    cb([text]);
                });
            }
            else if (command == Consts_1.Commands.EXPORTAPP) {
                this.ExportApp(userState[Consts_1.UserStates.APP], address, function (text) {
                    cb([text]);
                });
            }
            else if (command == Consts_1.Commands.IMPORTAPP) {
                this.ImportApp(userState[Consts_1.UserStates.APP], arg, function (text) {
                    cb([text]);
                });
            }
            else if (command == Consts_1.Commands.LOADAPP) {
                this.LoadApp(userState, arg, function (text) {
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
                if (memory.HasEntities()) {
                    memory.ClearTrainSteps();
                    this.NewSession(userState, true, function (results) {
                        cb(results);
                    });
                }
                else {
                    var card = this.MakeHero("", "", "First define some Entities", { "Help": Help_1.Help.NEWAPP });
                    cb([card]);
                }
            }
            else if (command == Consts_1.Commands.TRAINDIALOGS) {
                this.GetTrainDialogs(userState, address, arg, function (text) {
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
                var card_1 = this.MakeHero("Dialog Trained", null, null, { "Start Bot": Consts_1.Commands.START, "Teach Bot": Consts_1.Commands.TEACH, "Add Entities & Actions": Help_1.Help.NEWAPP });
                this.EndSession(userState, function (text) {
                    cb([card_1]);
                });
            }
            else if (command == Consts_1.IntCommands.FORGETTEACH) {
                // TODO: flag to not save training
                var card_2 = this.MakeHero("Dialog Abandoned", null, null, { "Start Bot": Consts_1.Commands.START, "Teach Bot": Consts_1.Commands.TEACH, "Add Entities & Actions": Help_1.Help.NEWAPP });
                this.EndSession(userState, function (text) {
                    cb([card_2]);
                });
            }
            else if (command == Consts_1.IntCommands.DONETEACH) {
                var steps = this.TrainStepText(userState);
                var card = this.MakeHero("", "", "Does this look good?", { "Save": Consts_1.IntCommands.SAVETEACH, "Abandon": Consts_1.IntCommands.FORGETTEACH });
                cb([steps, card]);
            }
            else {
                cb(["_In teaching mode. The only valid command is_ " + Consts_1.IntCommands.DONETEACH]);
            }
        }
        else if (command == Consts_1.IntCommands.DELETEDIALOG) {
            this.DeleteTrainDialog(userState, arg, function (text) {
                cb([text]);
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
                    _this.SendMessage(address_1, "Importing application...");
                    _this.ImportAppAttachment(userState, context.message.attachments[0], function (text) {
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
                        // Clear memory of last entities that were detected
                        memory_1.RememberLastStep(Consts_1.SaveStep.ENTITY, null);
                        if (ttResponse.teachError) {
                            var title = "**ERROR**\n\n";
                            var body = "Input did not match original text. Let's try again.\n\n";
                            responses.push(that_1.MakeHero(title, body, null, null));
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
                                responses.push("[" + suggestedEntity + " *]");
                                var body = "Click Correct if suggested entity is valid or indicate entities in input string";
                                responses.push(that_1.MakeHero(cardtitle, null, body, { "Correct": "1", "Help": Help_1.Help.PICKENTITY }));
                            }
                            else {
                                var cardsub = "No new entities found.\n\n";
                                var cardtext = "Click None if correct or indicate entities in input string";
                                responses.push(that_1.MakeHero(cardtitle, cardsub, cardtext, { "None": "1", "Help": Help_1.Help.PICKENTITY }));
                            }
                        }
                        else {
                            var entities = "";
                            for (var i in ttResponse.teachLabelEntities) {
                                var labelEntity = ttResponse.teachLabelEntities[i];
                                var entityName = memory_1.EntityId2Name(labelEntity.entityId);
                                entities += "[$" + entityName + ": " + labelEntity.entityValue + "]    _Score: " + labelEntity.score.toFixed(3) + "_\n\n";
                            }
                            responses.push(entities);
                            memory_1.RememberLastStep(Consts_1.SaveStep.ENTITY, entities);
                            var body = "Click Correct if entities are valid or indicate entities in input string";
                            responses.push(that_1.MakeHero(cardtitle, null, body, { "Correct": "1", "Help": Help_1.Help.PICKENTITY }));
                        }
                    };
                    /** Process Label Entity Step */
                    var ProcessLabelAction_1 = function (ttResponse, responses) {
                        BlisDebug_1.BlisDebug.Verbose("ProcessLabelEntity");
                        // If a SuggestedEntity (i.e. !entity) was in previous bot response, the entity wasn't already assigned
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
                        responses.push(that_1.MakeHero(title, null, body, null));
                        if (ttResponse.teachLabelActions.length == 0) {
                            responses.push('No actions matched.\n\n');
                            body = 'Enter a new Action\n\n';
                        }
                        else {
                            var msg = "";
                            for (var i in ttResponse.teachLabelActions) {
                                var labelAction = ttResponse.teachLabelActions[i];
                                if (labelAction.available) {
                                    msg += "(" + (1 + Number(i)) + ") " + labelAction.content + " _(" + labelAction.actionType.toUpperCase() + ")_ Score: " + labelAction.score.toFixed(3) + "\n\n";
                                }
                                else {
                                    msg += "_(" + (1 + Number(i)) + ") " + labelAction.content + "_ _(" + labelAction.actionType.toUpperCase() + ")_ DISQUALIFIED\n\n";
                                }
                            }
                            responses.push(msg);
                            responses.push(that_1.MakeHero(" ", null, 'Select Action by number or enter a new one', { "Help": Help_1.Help.ADDACTION }));
                        }
                    };
                    var TakeTurnCallback_1 = function (ttResponse) {
                        BlisDebug_1.BlisDebug.Verbose("TakeTurnCallback");
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
                            var outText = that_1.blisCallback(output, memory_1);
                            if (inTeach_1) {
                                memory_1.RememberTrainStep(Consts_1.SaveStep.RESPONSE, outText);
                                responses.push(that_1.MakeHero('Trained Response:', outText + "\n\n", "Type next user input for this Dialog or", { "Dialog Complete": Consts_1.IntCommands.DONETEACH }));
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
                    _this.SendTyping(address_1);
                    BlisDebug_1.BlisDebug.SetAddress(address_1);
                    var userInput_1 = context.message.text.trim();
                    // Handle admin commands
                    if (userInput_1.startsWith('!')) {
                        _this.HandleCommand(userInput_1, address_1, userState, function (responses, retrain) {
                            // Some commands require retraining if user is in teach mode
                            if (inTeach_1 && retrain) {
                                // Send command response out of band
                                responses.push("Retraining...");
                                _this.SendResponses(address_1, responses);
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
            BlisDebug_1.BlisDebug.Error(error);
            cb(error, null);
        }
    };
    BlisRecognizer.prototype.TakeTurn = function (userState, payload, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var response_1, response_2, response_3, expectedNextModes, requestBody, takeTurnResponse, response, takeTurnRequest, memory, action, apiString, _a, apiName, arg, api, memory, takeTurnRequest, response_4, error_18;
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
                            requestBody = payload.ToJSON();
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
                        if (this.luisCallback) {
                            takeTurnRequest = this.luisCallback(takeTurnResponse.originalText, takeTurnResponse.entities, memory);
                        }
                        else {
                            takeTurnRequest = this.DefaultLUCallback(takeTurnResponse.originalText, takeTurnResponse.entities);
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
                        memory.RememberTrainStep(Consts_1.SaveStep.API, apiName + " " + arg);
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
                        error_18 = _b.sent();
                        BlisDebug_1.BlisDebug.Error(error_18);
                        cb(error_18);
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    //====================================================
    // Built in API GetActions
    //====================================================
    BlisRecognizer.prototype.SaveEntityCB = function (memory, arg) {
        var lastInput = memory.LastStep(Consts_1.SaveStep.INPUT);
        var entityId = memory.EntityName2Id(arg);
        memory.RememberEntity(entityId, lastInput);
        var entityIds = memory.EntityIds();
        return new TakeTurnRequest_1.TakeTurnRequest({ entities: entityIds });
    };
    //====================================================
    BlisRecognizer.prototype.ErrorResponse = function (text) {
        return new TakeTurnResponse_1.TakeTurnResponse({ mode: Consts_1.TakeTurnModes.ERROR, error: text });
    };
    BlisRecognizer.prototype.MakeHero = function (title, subtitle, text, buttons) {
        var buttonList = [];
        for (var message in buttons) {
            var postback = buttons[message];
            buttonList.push(builder.CardAction.postBack(null, postback, message));
        }
        var card = new builder.HeroCard()
            .title(title)
            .subtitle(subtitle)
            .text(text)
            .buttons(buttonList);
        return card;
    };
    BlisRecognizer.prototype.DefaultLUCallback = function (text, entities) {
        return new TakeTurnRequest_1.TakeTurnRequest(); // TODO
    };
    // TODO is this used anywhere?
    BlisRecognizer.prototype.DefaultBlisCallback = function (text) {
        return text;
        /*
        let words = [];
        let tokens = text.split(' ').forEach((item) =>
        {
            if (item.startsWith('$'))
            {
                if (this.entity_name2id[item])
                {
                    let entityId = this.entity_name2id[item];
                    let entityValue = this.entityValues[item];
                    words.push(entityValue);
                }
                else if (this.entityValues[item])
                {
                    let entityValue = this.entityValues[item];
                    words.push(entityValue);
                }
                else
                {
                    BlisDebug.Log(`Found entity reference ${item} but no value for that entity observed`);
                }
            }
            else
            {
                words.push(item);
            }
        });
        return words.join(' ');
        */
    };
    return BlisRecognizer;
}());
exports.BlisRecognizer = BlisRecognizer;
//# sourceMappingURL=BlisRecognizer.js.map