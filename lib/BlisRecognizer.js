"use strict";
var tslib_1 = require("tslib");
var builder = require("botbuilder");
var request = require("request");
var util = require("util");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var SnippetList_1 = require("./Model/SnippetList");
var TrainDialogSNP_1 = require("./Model/TrainDialogSNP");
var BlisClient_1 = require("./BlisClient");
var BlisMemory_1 = require("./BlisMemory");
var BlisDebug_1 = require("./BlisDebug");
var BlisUserState_1 = require("./BlisUserState");
var Consts_1 = require("./Model/Consts");
var Help_1 = require("./Model/Help");
var BlisRecognizer = (function () {
    function BlisRecognizer(bot, options) {
        this.bot = bot;
        this.entityValues = {};
        this.init(options);
        BlisDebug_1.BlisDebug.InitLogger(bot);
    }
    BlisRecognizer.prototype.init = function (options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                try {
                    BlisDebug_1.BlisDebug.Log("Creating client...");
                    this.blisClient = new BlisClient_1.BlisClient(options.serviceUri, options.user, options.secret, options.luisCallback, options.apiCallbacks);
                    this.connector = options.connector;
                    this.defaultApp = options.appId;
                    this.blisCallback = options.blisCallback ? options.blisCallback : this.DefaultBlisCallback;
                }
                catch (error) {
                    BlisDebug_1.BlisDebug.Log("ERROR: " + error);
                }
                return [2 /*return*/];
            });
        });
    };
    BlisRecognizer.prototype.ReadFromFile = function (url) {
        return new Promise(function (resolve, reject) {
            request.get(url, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body.message);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    BlisRecognizer.prototype.AddAction = function (userState, content, actionType, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            var memory, msg, msg, firstNeg, firstPos, cut, actionText, negIds, posIds, negNames, posNames, words, _i, words_1, word, negName, negID, posName, posID;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Action");
                        memory = new BlisMemory_1.BlisMemory(userState);
                        if (!content) {
                            msg = "You must provide the ID of the action to delete.\n\n     " + Consts_1.Commands.DELETEACTION + " {app ID}";
                            cb(msg, null);
                            return [2 /*return*/];
                        }
                        if (!actionType) {
                            msg = "You must provide the ID of the action to delete.\n\n     " + Consts_1.Commands.DELETEACTION + " {app ID}";
                            cb(msg, null);
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
                        negIds = [];
                        posIds = [];
                        negNames = [];
                        posNames = [];
                        words = content.split(' ');
                        for (_i = 0, words_1 = words; _i < words_1.length; _i++) {
                            word = words_1[_i];
                            if (word.startsWith('--')) {
                                negName = word.slice(2);
                                negID = memory.EntityId(negName);
                                if (negID) {
                                    negIds.push(negID);
                                    negNames.push(negName);
                                }
                                else {
                                    cb("Entity $" + negName + " not found.", null);
                                    return [2 /*return*/];
                                }
                            }
                            else if (word.startsWith('++')) {
                                posName = word.slice(2);
                                posID = memory.EntityId(posName);
                                if (posID) {
                                    posIds.push(posID);
                                    posNames.push(posName);
                                }
                                else {
                                    cb("Entity $" + posName + " not found.", null);
                                    return [2 /*return*/];
                                }
                            }
                        }
                        return [4 /*yield*/, this.blisClient.AddAction(userState, actionText, actionType, posIds, negIds)
                                .then(function (actionId) {
                                var substr = "";
                                if (posIds.length > 0) {
                                    substr += "++[" + posNames.toLocaleString() + "]\n\n";
                                }
                                if (negIds.length > 0) {
                                    substr += "--[" + negNames.toLocaleString() + "]";
                                }
                                var card = _this.MakeHero("Created Action", actionId + "\n\n" + substr, actionText, null);
                                cb(null, card);
                            })
                                .catch(function (text) { return cb(text, null); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.AddEntity = function (userState, entityName, entityType, prebuiltName, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            var msg, msg, msg, msg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Add Entity " + entityName);
                        if (!entityName) {
                            msg = "You must provide an entity name for the entity to create.\n\n     " + Consts_1.Commands.ADDENTITY + " {entitiyName} {LUIS | LOCAL} {prebuiltName?}";
                            cb(msg, null);
                            return [2 /*return*/];
                        }
                        if (!entityType) {
                            msg = "You must provide an entity type for the entity to create.\n\n     " + Consts_1.Commands.ADDENTITY + " {entitiyName} {LUIS | LOCAL} {prebuiltName?}";
                            cb(msg, null);
                            return [2 /*return*/];
                        }
                        entityType = entityType.toUpperCase();
                        if (entityType != Consts_1.EntityTypes.LOCAL && entityType != Consts_1.EntityTypes.LUIS) {
                            msg = "Entity type must be 'LOCAL' or 'LUIS'\n\n     " + Consts_1.Commands.ADDENTITY + " {entitiyName} {LUIS | LOCAL} {prebuiltName?}";
                            cb(msg, null);
                            return [2 /*return*/];
                        }
                        if (entityType == Consts_1.EntityTypes.LOCAL && prebuiltName != null) {
                            msg = "LOCAL entities shouldn't include a prebuilt name\n\n     " + Consts_1.Commands.ADDENTITY + " {entitiyName} {LUIS | LOCAL} {prebuiltName?}";
                            cb(msg, null);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.blisClient.AddEntity(userState, entityName, entityType, prebuiltName)
                                .then(function (entityId) {
                                var memory = new BlisMemory_1.BlisMemory(userState);
                                memory.AddEntityLookup(entityName, entityId);
                                var card = _this.MakeHero("Created Entity", entityId, entityName, null);
                                cb(null, card);
                            })
                                .catch(function (text) { return cb(text, null); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.CreateApp = function (userState, appName, luisKey, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            var msg, msg;
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
                            cb(msg, null);
                            return [2 /*return*/];
                        }
                        if (!luisKey) {
                            msg = "You must provide a luisKey for your application.\n\n     " + Consts_1.Commands.CREATEAPP + " {app Name} {luis key}";
                            cb(msg, null);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.blisClient.CreateApp(userState, appName, luisKey)
                                .then(function (appId) {
                                var card = _this.MakeHero("Created App", appId, null, { "Help": Help_1.Help.NEWAPP });
                                cb(null, card);
                            })
                                .catch(function (text) { return cb(text, null); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
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
    BlisRecognizer.prototype.DeleteAction = function (userState, actionId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Action");
                        if (!actionId) {
                            msg = "You must provide the ID of the action to delete.\n\n     " + Consts_1.Commands.DELETEACTION + " {app ID}";
                            cb(msg);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.blisClient.DeleteAction(userState, actionId)
                                .then(function (text) { return cb("Deleted Action " + actionId); })
                                .catch(function (text) { return cb(text); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.DeleteAllApps = function (userState, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var appIds, fail, _loop_1, this_1, _i, appIds_1, appId;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete All Applications");
                        appIds = [];
                        fail = null;
                        return [4 /*yield*/, this.blisClient.GetApps()
                                .then(function (json) {
                                appIds = JSON.parse(json)['ids'];
                                BlisDebug_1.BlisDebug.Log("Found " + appIds.length + " apps");
                            })
                                .catch(function (error) { return fail = error; })];
                    case 1:
                        _a.sent();
                        if (fail) {
                            BlisDebug_1.BlisDebug.Log(fail);
                            return [2 /*return*/, fail];
                        }
                        _loop_1 = function (appId) {
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this_1.blisClient.DeleteApp(userState, appId)
                                            .then(function (text) { return BlisDebug_1.BlisDebug.Log("Deleted " + appId + " apps"); })
                                            .catch(function (text) { return BlisDebug_1.BlisDebug.Log("Failed to delete " + appId); })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, appIds_1 = appIds;
                        _a.label = 2;
                    case 2:
                        if (!(_i < appIds_1.length)) return [3 /*break*/, 5];
                        appId = appIds_1[_i];
                        return [5 /*yield**/, _loop_1(appId)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        cb("Done");
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.DeleteApp = function (userState, appId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Application");
                        if (!appId) {
                            msg = Help_1.BlisHelp.Get(Help_1.Help.DELETEAPP);
                            cb(msg);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.blisClient.DeleteApp(userState, appId)
                                .then(function (text) {
                                cb("Deleted App " + appId);
                            })
                                .catch(function (text) { return cb(text); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.EndSession = function (userState, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Ending teaching session
                    return [4 /*yield*/, this.blisClient.EndSession(userState)
                            .then(function (sessionId) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: 
                                    // Update the model
                                    return [4 /*yield*/, this.blisClient.GetModel(userState)
                                            .then(function (text) {
                                            cb(sessionId);
                                        })
                                            .catch(function (error) {
                                            BlisDebug_1.BlisDebug.Log(error);
                                            cb(error);
                                        })];
                                    case 1:
                                        // Update the model
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })
                            .catch(function (error) {
                            BlisDebug_1.BlisDebug.Log(error);
                            cb(error);
                        })];
                    case 1:
                        // Ending teaching session
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.GetActions = function (userState, detail, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var actionIds, fail, textactions, apiactions, _loop_2, this_2, _i, actionIds_1, actionId, msg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting actions");
                        actionIds = [];
                        fail = null;
                        return [4 /*yield*/, this.blisClient.GetActions(userState)
                                .then(function (json) {
                                actionIds = JSON.parse(json)['ids'];
                                BlisDebug_1.BlisDebug.Log("Found " + actionIds.length + " actions");
                            })
                                .catch(function (error) { return fail = error; })];
                    case 1:
                        _a.sent();
                        if (fail) {
                            BlisDebug_1.BlisDebug.Log(fail);
                            return [2 /*return*/, fail];
                        }
                        textactions = "";
                        apiactions = "";
                        _loop_2 = function (actionId) {
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this_2.blisClient.GetAction(userState, actionId)
                                            .then(function (action) {
                                            var memory = new BlisMemory_1.BlisMemory(userState);
                                            var posstring = memory.EntityNames(action.requiredEntities);
                                            var negstring = memory.EntityNames(action.negativeEntities);
                                            var atext = "" + action.content;
                                            if (posstring.length > 0) {
                                                atext += "  ++[" + posstring + "]";
                                            }
                                            if (negstring.length > 0) {
                                                atext += "  --[" + negstring + "]";
                                            }
                                            // Show detail if requested
                                            atext += detail == 'Y' ? ": _" + actionId + "_\n\n" : "\n\n";
                                            if (action.actionType == Consts_1.ActionTypes.API) {
                                                apiactions += atext;
                                            }
                                            else if (action.actionType == Consts_1.ActionTypes.TEXT) {
                                                textactions += atext;
                                            }
                                            BlisDebug_1.BlisDebug.Log("Action lookup: " + action.content + " : " + action.actionType);
                                        })
                                            .catch(function (error) { return fail = error; })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_2 = this;
                        _i = 0, actionIds_1 = actionIds;
                        _a.label = 2;
                    case 2:
                        if (!(_i < actionIds_1.length)) return [3 /*break*/, 5];
                        actionId = actionIds_1[_i];
                        return [5 /*yield**/, _loop_2(actionId)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        if (fail) {
                            BlisDebug_1.BlisDebug.Log(fail);
                            return [2 /*return*/, fail];
                        }
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
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.GetApps = function (cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var appIds, fail, msg, _i, appIds_2, appId;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting apps");
                        appIds = [];
                        fail = null;
                        return [4 /*yield*/, this.blisClient.GetApps()
                                .then(function (json) {
                                appIds = JSON.parse(json)['ids'];
                                BlisDebug_1.BlisDebug.Log("Found " + appIds.length + " apps");
                            })
                                .catch(function (error) { return fail = error; })];
                    case 1:
                        _a.sent();
                        if (fail) {
                            BlisDebug_1.BlisDebug.Log(fail);
                            return [2 /*return*/, fail];
                        }
                        msg = "";
                        _i = 0, appIds_2 = appIds;
                        _a.label = 2;
                    case 2:
                        if (!(_i < appIds_2.length)) return [3 /*break*/, 5];
                        appId = appIds_2[_i];
                        return [4 /*yield*/, this.blisClient.GetApp(appId)
                                .then(function (json) {
                                var name = json['app-name'];
                                var id = json['model-id'];
                                msg += name + " : " + id + "\n\n";
                                BlisDebug_1.BlisDebug.Log("App lookup: " + name + " : " + id);
                            })
                                .catch(function (error) { return fail = error; })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        if (fail) {
                            BlisDebug_1.BlisDebug.Log(fail);
                            return [2 /*return*/, fail];
                        }
                        if (!msg) {
                            msg = "This account contains no apps.";
                        }
                        cb(msg);
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.GetEntities = function (userState, detail, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityIds, fail, memory, msg, _loop_3, this_3, _i, entityIds_1, entityId;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting entities");
                        entityIds = [];
                        fail = null;
                        return [4 /*yield*/, this.blisClient.GetEntities(userState)
                                .then(function (json) {
                                entityIds = JSON.parse(json)['ids'];
                                BlisDebug_1.BlisDebug.Log("Found " + entityIds.length + " entities");
                            })
                                .catch(function (error) { return fail = error; })];
                    case 1:
                        _a.sent();
                        if (fail) {
                            BlisDebug_1.BlisDebug.Log(fail);
                            return [2 /*return*/, fail];
                        }
                        memory = new BlisMemory_1.BlisMemory(userState);
                        msg = "**Entities**\n\n";
                        _loop_3 = function (entityId) {
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this_3.blisClient.GetEntity(userState, entityId)
                                            .then(function (json) {
                                            var entityName = JSON.parse(json)['name'];
                                            // Add to entity lookup table
                                            memory.AddEntityLookup(entityName, entityId);
                                            BlisDebug_1.BlisDebug.Log("Entity lookup: " + entityId + " : " + entityName);
                                            if (detail == 'Y') {
                                                msg += "$" + entityName + " : " + entityId + "\n\n";
                                            }
                                            else {
                                                msg += "$" + entityName + "\n\n";
                                            }
                                        })
                                            .catch(function (error) { return fail = error; })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_3 = this;
                        _i = 0, entityIds_1 = entityIds;
                        _a.label = 2;
                    case 2:
                        if (!(_i < entityIds_1.length)) return [3 /*break*/, 5];
                        entityId = entityIds_1[_i];
                        return [5 /*yield**/, _loop_3(entityId)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        if (fail) {
                            BlisDebug_1.BlisDebug.Log(fail);
                            return [2 /*return*/, cb(fail)];
                        }
                        if (!msg) {
                            msg = "This application contains no entities.";
                        }
                        cb(msg);
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.GetTrainDialogs = function (userState, address, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var dialogIds, fail, msg, _loop_4, this_4, _i, dialogIds_1, dialogId;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting actions");
                        dialogIds = [];
                        fail = null;
                        return [4 /*yield*/, this.blisClient.GetTrainDialogs(userState)
                                .then(function (json) {
                                dialogIds = JSON.parse(json)['ids'];
                                BlisDebug_1.BlisDebug.Log("Found " + dialogIds.length + " actions");
                            })
                                .catch(function (error) { return fail = error; })];
                    case 1:
                        _a.sent();
                        if (fail) {
                            BlisDebug_1.BlisDebug.Log(fail);
                            return [2 /*return*/, fail];
                        }
                        msg = "[";
                        _loop_4 = function (dialogId) {
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this_4.blisClient.GetTrainDialog(userState, dialogId)
                                            .then(function (json) {
                                            if (msg.length > 1)
                                                msg += ",";
                                            msg += json + "\n\n";
                                            BlisDebug_1.BlisDebug.Log("Action lookup: " + dialogId);
                                        })
                                            .catch(function (error) { return fail = error; })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_4 = this;
                        _i = 0, dialogIds_1 = dialogIds;
                        _a.label = 2;
                    case 2:
                        if (!(_i < dialogIds_1.length)) return [3 /*break*/, 5];
                        dialogId = dialogIds_1[_i];
                        return [5 /*yield**/, _loop_4(dialogId)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        msg += "]";
                        if (fail) {
                            BlisDebug_1.BlisDebug.Log(fail);
                            return [2 /*return*/, fail];
                        }
                        if (!msg) {
                            msg = "This application contains no training dialogs.";
                        }
                        /*      if (this.connector)
                              {
                                  BlisUploader.SendAsFile(this.bot, msg, this.connector, address);
                              }*/
                        this.SendAsAttachment(address, msg);
                        cb("");
                        return [2 /*return*/];
                }
            });
        });
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
            var msg, fail, sessionId;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to load Application " + appId);
                        // TODO - temp debug
                        if (appId == '*') {
                            appId = '0241bae4-ebba-45ca-88b2-2543339c4e6d';
                        }
                        if (!appId) {
                            msg = "You must provide the ID of the application to load.\n\n     !loadapp {app ID}";
                            cb(msg);
                            return [2 /*return*/];
                        }
                        userState[Consts_1.UserStates.APP] = appId;
                        userState[Consts_1.UserStates.SESSION] = null;
                        userState[Consts_1.UserStates.MODEL] = null;
                        userState[Consts_1.UserStates.TEACH] = false;
                        userState[Consts_1.UserStates.MEMORY] = {};
                        userState[Consts_1.UserStates.ENTITYLOOKUP] = {};
                        fail = null;
                        // Validate appId
                        return [4 /*yield*/, this.blisClient.GetApp(appId)
                                .then(function (appId) {
                                BlisDebug_1.BlisDebug.Log("Found App: " + appId);
                            })
                                .catch(function (error) { return fail = error; })];
                    case 1:
                        // Validate appId
                        _a.sent();
                        if (fail) {
                            BlisDebug_1.BlisDebug.Log(fail);
                            cb(fail);
                            return [2 /*return*/];
                        }
                        // Validate modelId
                        return [4 /*yield*/, this.blisClient.GetModel(userState)
                                .then(function (appId) {
                                BlisDebug_1.BlisDebug.Log("Found Model: " + appId);
                            })
                                .catch(function (error) { return fail = error; })];
                    case 2:
                        // Validate modelId
                        _a.sent();
                        if (fail) {
                            BlisDebug_1.BlisDebug.Log(fail);
                            cb(fail);
                            return [2 /*return*/];
                        }
                        // Load entities to generate lookup table
                        return [4 /*yield*/, this.GetEntities(userState, null, function (text) {
                                BlisDebug_1.BlisDebug.Log("Entity lookup generated");
                            })];
                    case 3:
                        // Load entities to generate lookup table
                        _a.sent();
                        if (fail) {
                            BlisDebug_1.BlisDebug.Log(fail);
                            cb(fail);
                            return [2 /*return*/];
                        }
                        // Create session
                        BlisDebug_1.BlisDebug.Log("Creating session...");
                        return [4 /*yield*/, this.blisClient.StartSession(userState)
                                .then(function (sessionId) {
                                BlisDebug_1.BlisDebug.Log("Stared Session: " + appId);
                                cb("Application loaded and Session started.");
                            })
                                .catch(function (error) { return cb(error); })];
                    case 4:
                        sessionId = _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.NewSession = function (userState, teach, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to create new session, Teach = " + teach);
                        // Close any existing session
                        return [4 /*yield*/, this.blisClient.EndSession(userState)
                                .then(function (sessionId) { return BlisDebug_1.BlisDebug.Log("Ended session " + sessionId); })
                                .catch(function (error) { return BlisDebug_1.BlisDebug.Log("" + error); })];
                    case 1:
                        // Close any existing session
                        _a.sent();
                        return [4 /*yield*/, this.blisClient.StartSession(userState, teach)
                                .then(function (sessionId) {
                                BlisDebug_1.BlisDebug.Log("Started session " + sessionId);
                                if (teach) {
                                    cb("_Teach mode started. Provide your first input_");
                                }
                                else {
                                    cb("_Bot started..._");
                                }
                            })
                                .catch(function (text) { return cb(text); })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.TrainFromFile = function (userState, url, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            var msg, text;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (url == "*") {
                            url = "https://onedrive.live.com/download?cid=55DCA1313254B6CB&resid=55DCA1313254B6CB%213634&authkey=AIyjQoawD2vlHmc";
                        }
                        if (!url) {
                            msg = "You must provide url location of training file.\n\n     !trainfromurl {url}";
                            cb(msg);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.ReadFromFile(url)
                                .then(function (text) {
                                var json = JSON.parse(text);
                                var snipObj = json_typescript_mapper_1.deserialize(SnippetList_1.SnippetList, json);
                                _this.TrainOnSnippetList(userState, snipObj.snippets)
                                    .then(function (status) { return cb(status); })
                                    .catch(function (error) { return cb("Failed to Train"); });
                            })
                                .catch(function (text) { return cb(text); })];
                    case 1:
                        text = _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.TrainOnSnippetList = function (userState, sniplist) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var fail, actionList, actiontext2id, _i, sniplist_1, snippet, _loop_5, this_5, _a, _b, turn, _c, sniplist_2, snippet, dialog, _d, _e, turn, altTexts, userText, i, actionId, input, newturn;
            return tslib_1.__generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        fail = null;
                        actionList = [];
                        actiontext2id = {};
                        _i = 0, sniplist_1 = sniplist;
                        _f.label = 1;
                    case 1:
                        if (!(_i < sniplist_1.length)) return [3 /*break*/, 6];
                        snippet = sniplist_1[_i];
                        _loop_5 = function (turn) {
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(actionList.indexOf(turn.action) == -1)) return [3 /*break*/, 2];
                                        if (!!fail) return [3 /*break*/, 2];
                                        BlisDebug_1.BlisDebug.Log("Add Action: " + turn.action);
                                        return [4 /*yield*/, this_5.blisClient.AddAction(userState, turn.action, null, new Array(), new Array(), null)
                                                .then(function (actionId) {
                                                actionList.push(turn.action);
                                                actiontext2id[turn.action] = actionId;
                                            })
                                                .catch(function (text) {
                                                BlisDebug_1.BlisDebug.Log("!!" + text);
                                                fail = text;
                                            })];
                                    case 1:
                                        _a.sent();
                                        _a.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        };
                        this_5 = this;
                        _a = 0, _b = snippet.turns;
                        _f.label = 2;
                    case 2:
                        if (!(_a < _b.length)) return [3 /*break*/, 5];
                        turn = _b[_a];
                        return [5 /*yield**/, _loop_5(turn)];
                    case 3:
                        _f.sent();
                        _f.label = 4;
                    case 4:
                        _a++;
                        return [3 /*break*/, 2];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        BlisDebug_1.BlisDebug.Log("Found " + actionList.length + " actions. ");
                        if (fail)
                            return [2 /*return*/, fail];
                        _c = 0, sniplist_2 = sniplist;
                        _f.label = 7;
                    case 7:
                        if (!(_c < sniplist_2.length)) return [3 /*break*/, 10];
                        snippet = sniplist_2[_c];
                        dialog = new TrainDialogSNP_1.TrainDialogSNP();
                        for (_d = 0, _e = snippet.turns; _d < _e.length; _d++) {
                            turn = _e[_d];
                            altTexts = [];
                            userText = turn.userText[0];
                            if (turn.userText.length > 1) {
                                for (i = 1; i < turn.userText.length; i++) {
                                    altTexts.push(new TrainDialogSNP_1.AltTextSNP({ text: turn.userText[i] }));
                                }
                            }
                            actionId = actiontext2id[turn.action];
                            input = new TrainDialogSNP_1.InputSNP({ 'text': userText, 'textAlts': altTexts });
                            newturn = new TrainDialogSNP_1.TurnSNP({ 'input': input, 'output': actionId });
                            dialog.turns.push(newturn);
                        }
                        if (!!fail) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.blisClient.AddTrainDialog(userState, dialog)
                                .then(function (text) {
                                BlisDebug_1.BlisDebug.Log("Added: " + text);
                            })
                                .catch(function (text) {
                                BlisDebug_1.BlisDebug.Log("" + text);
                                fail = text;
                            })];
                    case 8:
                        _f.sent();
                        _f.label = 9;
                    case 9:
                        _c++;
                        return [3 /*break*/, 7];
                    case 10:
                        if (fail)
                            return [2 /*return*/, fail];
                        // Train the model
                        BlisDebug_1.BlisDebug.Log("Training the model...");
                        return [4 /*yield*/, this.blisClient.TrainModel(userState)
                                .then(function (text) { return BlisDebug_1.BlisDebug.Log("Model trained: " + text); })
                                .catch(function (text) {
                                BlisDebug_1.BlisDebug.Log("" + text);
                                fail = text;
                            })];
                    case 11:
                        _f.sent();
                        if (fail)
                            return [2 /*return*/, fail];
                        // Start a session
                        BlisDebug_1.BlisDebug.Log("Starting session...");
                        return [4 /*yield*/, this.blisClient.StartSession(userState)
                                .then(function (text) { return BlisDebug_1.BlisDebug.Log("Session started: " + text); })
                                .catch(function (text) {
                                BlisDebug_1.BlisDebug.Log("" + text);
                                fail = text;
                            })];
                    case 12:
                        _f.sent();
                        if (fail)
                            return [2 /*return*/, fail];
                        return [2 /*return*/, "App has been trained and bot started."];
                }
            });
        });
    };
    BlisRecognizer.prototype.SendTyping = function (address) {
        var msg = { type: 'typing' };
        msg.address = address;
        this.bot.send(msg);
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
        /*
                var base64 = Buffer.from(data).toString('base64');
        
                var msg = new builder.Message(session)
                    .addAttachment({
                        contentUrl: util.format('data:%s;base64,%s', contentType, base64),
                        contentType: contentType,
                        name: attachmentFileName
                    });
        
                session.send(msg);
        */
        /*
        let msg =  new builder.Message();
                (<any>msg).data.address = address;
        
                let attachment : builder.IAttachment =
                {
                    contentType: "text/plain",
                    content: content
                }
                msg.addAttachment(attachment);
                this.bot.send(msg);*/
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
    BlisRecognizer.prototype.SendResult = function (address, userState, cb, text, card) {
        // Save user state
        BlisUserState_1.BlisUserState.Save(this.bot, address, userState);
        // Assume BLIS always wins for now 
        var result = { score: 1.0, answer: text, intent: null, card: card };
        // Send callback
        cb(null, result);
    };
    BlisRecognizer.prototype.HandleHelp = function (input, address, userState, cb) {
        var help = Help_1.BlisHelp.Get(input);
        this.SendResult(address, userState, cb, help, null);
    };
    BlisRecognizer.prototype.HandleCommand = function (input, address, userState, cb) {
        var _this = this;
        var _a = input.split(' '), command = _a[0], arg = _a[1], arg2 = _a[2], arg3 = _a[3];
        command = command.toLowerCase();
        if (userState[Consts_1.UserStates.TEACH] && (command != Consts_1.Commands.DUMP) && (command != "!debug") && (command != Consts_1.Commands.TEACH)) {
            if (command == Consts_1.Commands.DONE) {
                this.EndSession(userState, function (text) {
                    _this.SendResult(address, userState, cb, "_Completed teach dialog..._", null);
                });
            }
            else {
                this.SendResult(address, userState, cb, "_In teaching mode. The only valid command is_ " + Consts_1.Commands.DONE, null);
            }
        }
        else {
            if (command == Consts_1.Commands.ACTIONS) {
                this.GetActions(userState, arg, function (text) {
                    _this.SendResult(address, userState, cb, text, null);
                });
            }
            else if (command == Consts_1.Commands.ADDAPIACTION) {
                var firstSpace = input.indexOf(' ');
                var start = input.slice(firstSpace + 1);
                this.AddAction(userState, start, Consts_1.ActionTypes.API, function (text, card) {
                    _this.SendResult(address, userState, cb, text, card);
                });
            }
            else if (command == Consts_1.Commands.ADDTEXTACTION) {
                var firstSpace = input.indexOf(' ');
                var start = input.slice(firstSpace + 1);
                this.AddAction(userState, start, Consts_1.ActionTypes.TEXT, function (text, card) {
                    _this.SendResult(address, userState, cb, text, card);
                });
            }
            else if (command == Consts_1.Commands.ADDENTITY) {
                this.AddEntity(userState, arg, arg2, arg3, function (text, card) {
                    _this.SendResult(address, userState, cb, text, card);
                });
            }
            else if (command == Consts_1.Commands.APPS) {
                this.GetApps(function (text) {
                    _this.SendResult(address, userState, cb, text, null);
                });
            }
            else if (command == Consts_1.Commands.CREATEAPP) {
                this.CreateApp(userState, arg, arg2, function (text, card) {
                    _this.SendResult(address, userState, cb, text, card);
                });
            }
            else if (command == Consts_1.Commands.DELETEALLAPPS) {
                this.DeleteAllApps(userState, function (text) {
                    _this.SendResult(address, userState, cb, text, null);
                });
            }
            else if (command == Consts_1.Commands.DELETEACTION) {
                this.DeleteAction(userState, arg, function (text) {
                    _this.SendResult(address, userState, cb, text, null);
                });
            }
            else if (command == Consts_1.Commands.DONE) {
                this.SendResult(address, userState, cb, "_I wasn't in teach mode. Type _" + Consts_1.Commands.TEACH + "_ to begin teaching_", null);
            }
            else if (command == Consts_1.Commands.DELETEAPP) {
                this.DeleteApp(userState, arg, function (text) {
                    _this.SendResult(address, userState, cb, text, null);
                });
            }
            else if (command == Consts_1.Commands.DEBUG) {
                userState[Consts_1.UserStates.DEBUG] = !userState[Consts_1.UserStates.DEBUG];
                BlisDebug_1.BlisDebug.enabled = userState[Consts_1.UserStates.DEBUG];
                this.SendResult(address, userState, cb, "Debug " + (BlisDebug_1.BlisDebug.enabled ? "Enabled" : "Disabled"), null);
            }
            else if (command == Consts_1.Commands.DEBUGHELP) {
                this.SendResult(address, userState, cb, this.DebugHelp(), null);
            }
            else if (command == Consts_1.Commands.DUMP) {
                var memory = new BlisMemory_1.BlisMemory(userState);
                this.SendResult(address, userState, cb, memory.Dump(), null);
            }
            else if (command == Consts_1.Commands.ENTITIES) {
                this.GetEntities(userState, arg, function (text) {
                    _this.SendResult(address, userState, cb, text, null);
                });
            }
            else if (command == Consts_1.Commands.HELP) {
                this.SendResult(address, userState, cb, this.Help(arg), null);
            }
            else if (command == Consts_1.Commands.LOADAPP) {
                this.LoadApp(userState, arg, function (text) {
                    _this.SendResult(address, userState, cb, text, null);
                });
            }
            else if (command == Consts_1.Commands.START) {
                this.NewSession(userState, false, function (text) {
                    _this.SendResult(address, userState, cb, text, null);
                });
            }
            else if (command == Consts_1.Commands.TEACH) {
                this.NewSession(userState, true, function (text) {
                    _this.SendResult(address, userState, cb, text, null);
                });
            }
            else if (command == Consts_1.Commands.TRAINFROMURL) {
                this.TrainFromFile(userState, arg, function (text) {
                    _this.SendResult(address, userState, cb, text, null);
                });
            }
            else if (command == Consts_1.Commands.TRAINDIALOGS) {
                this.GetTrainDialogs(userState, address, function (text) {
                    _this.SendResult(address, userState, cb, text, null);
                });
            }
            else {
                var text = "_Not a valid command._\n\n\n\n" + this.Help(null);
                this.SendResult(address, userState, cb, text, null);
            }
        }
    };
    BlisRecognizer.prototype.recognize = function (context, cb) {
        var _this = this;
        try {
            if (context && context.message && context.message.text) {
                var address_1 = context.message.address;
                this.LoadUser(address_1, function (error, userState) {
                    // TODO = handle error 
                    _this.SendTyping(address_1);
                    BlisDebug_1.BlisDebug.SetAddress(address_1);
                    var userInput = context.message.text.trim();
                    // Handle admin commands
                    if (userInput.startsWith('!')) {
                        _this.HandleCommand(userInput, address_1, userState, cb);
                    }
                    else if (userInput.startsWith('#')) {
                        _this.HandleHelp(userInput, address_1, userState, cb);
                    }
                    else {
                        var inTeach_1 = userState[Consts_1.UserStates.TEACH];
                        var memory_1 = new BlisMemory_1.BlisMemory(userState);
                        _this.blisClient.TakeTurn(userState, userInput, function (response) {
                            var msg = null;
                            var card = null;
                            if (response.mode == Consts_1.TakeTurnModes.TEACH) {
                                if (response.teachStep == Consts_1.TeachStep.LABELENTITY) {
                                    msg = "**Teach Step: Detected Entities**\n\n";
                                    msg += "-----------------------------\n\n";
                                    if (response.teachLabelEntities.length == 0) {
                                        msg += "No entities found.\n\n";
                                        var cardtext = "Indicate entities or press Correct if indeed there are none";
                                        card = _this.MakeHero(null, null, cardtext, { "None": "1", "Help": Help_1.Help.PICKENTITY });
                                    }
                                    else {
                                        for (var i_1 in response.teachLabelEntities) {
                                            var labelEntity = response.teachLabelEntities[i_1];
                                            var entityType = memory_1.EntityName(labelEntity.entityId);
                                            msg += "[$" + entityType + ": " + labelEntity.entityValue + "]    _Score: " + labelEntity.score.toFixed(3) + "_\n\n";
                                        }
                                        var cardtext = "Indicate entities or press Correct if entities are valid";
                                        card = _this.MakeHero(null, null, cardtext, { "Correct": "1", "Help": Help_1.Help.PICKENTITY });
                                    }
                                }
                                else if (response.teachStep == Consts_1.TeachStep.LABELACTION) {
                                    var memory_2 = new BlisMemory_1.BlisMemory(userState);
                                    msg = "**Teach Step: Select Action**\n\n";
                                    msg += memory_2.DumpEntities() + "\n\n";
                                    msg += "-----------------------------\n\n";
                                    if (response.teachLabelActions.length == 0) {
                                        msg += 'No actions matched.\n\n';
                                        msg += 'Enter a new Action\n\n';
                                    }
                                    else {
                                        for (var i in response.teachLabelActions) {
                                            var labelAction = response.teachLabelActions[i];
                                            if (labelAction.available) {
                                                msg += "(" + (1 + Number(i)) + ") " + labelAction.content + " _(" + labelAction.actionType.toUpperCase() + ")_ Score: " + labelAction.score.toFixed(3) + "\n\n";
                                            }
                                            else {
                                                msg += "_(" + (1 + Number(i)) + ") " + labelAction.content + "_ _(" + labelAction.actionType.toUpperCase() + ")_ DISQUALIFIED\n\n";
                                            }
                                        }
                                        msg += "-----------------------------\n\n";
                                        msg += '_Select matched action number or enter a new action_\n\n';
                                    }
                                }
                                else {
                                    msg = "Unrecognized TeachStep " + response.teachStep;
                                }
                            }
                            else if (response.mode == Consts_1.TakeTurnModes.ACTION) {
                                var outText = _this.blisCallback(response.actions[0].content, memory_1);
                                if (inTeach_1) {
                                    card = _this.MakeHero('Trained Response:', outText, "Type next user input for this Dialog or", { "Done Training": Consts_1.Commands.DONE, "New Dialog": Consts_1.Commands.TEACH });
                                }
                                else {
                                    msg = outText;
                                    memory_1.SetLastInput(userInput);
                                }
                            }
                            else if (response.mode == Consts_1.TakeTurnModes.ERROR) {
                                msg = response.error;
                            }
                            else {
                                msg = "Don't know mode: " + response.mode;
                            }
                            _this.SendResult(address_1, userState, cb, msg, card);
                        });
                    }
                });
            }
        }
        catch (Error) {
            cb(Error, null);
        }
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