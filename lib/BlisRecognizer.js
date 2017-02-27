"use strict";
var tslib_1 = require("tslib");
var request = require("request");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var SnippetList_1 = require("./Model/SnippetList");
var TrainDialog_1 = require("./Model/TrainDialog");
var BlisClient_1 = require("./BlisClient");
var BlisDebug_1 = require("./BlisDebug");
var BlisUserState_1 = require("./BlisUserState");
var Consts_1 = require("./Model/Consts");
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
    // TODO why pass recognizer everywhere??
    BlisRecognizer.prototype.AddEntity = function (recognizer, userState, entityName, entityType, prebuiltName, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg, msg, msg, msg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Action");
                        if (!entityName) {
                            msg = "You must provide an entity name for the entity to create.\n\n     !createApp {entitiyName} {LUIS | LOCAL} {prebuiltName?}";
                            cb(msg);
                            return [2 /*return*/];
                        }
                        if (!entityType) {
                            msg = "You must provide an entity type for the entity to create.\n\n     !createApp {entitiyName} {LUIS | LOCAL} {prebuiltName?}";
                            cb(msg);
                            return [2 /*return*/];
                        }
                        entityType = entityType.toUpperCase();
                        if (entityType != Consts_1.EntityTypes.LOCAL && entityType != Consts_1.EntityTypes.LUIS) {
                            msg = "Entity type must be 'LOCAL' or 'LUIS'\n\n     !createApp {entitiyName} {LUIS | LOCAL} {prebuiltName?}";
                            cb(msg);
                            return [2 /*return*/];
                        }
                        if (entityType == Consts_1.EntityTypes.LOCAL && prebuiltName != null) {
                            msg = "LOCAL entities shouldn't include a prebuilt name\n\n     !createApp {entitiyName} {LUIS | LOCAL} {prebuiltName?}";
                            cb(msg);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.blisClient.AddEntity(userState, entityName, entityType, prebuiltName)
                                .then(function (entityId) { return cb("Created Entity " + entityId); })
                                .catch(function (text) { return cb(text); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.CreateApp = function (recognizer, userState, appName, luisKey, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg, msg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Create Application");
                        // TODO - temp debug
                        if (luisKey == '*') {
                            luisKey = 'e740e5ecf4c3429eadb1a595d57c14c5';
                        }
                        if (!appName) {
                            msg = "You must provide a name for your application.\n\n     !createapp {app Name} {luis key}";
                            cb(msg);
                            return [2 /*return*/];
                        }
                        if (!luisKey) {
                            msg = "You must provide a luisKey for your application.\n\n     !createapp {app Name} {luis key}";
                            cb(msg);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.blisClient.CreateApp(userState, appName, luisKey)
                                .then(function (text) {
                                cb("Created App " + text + ".\n\nTo train try _!teach_, _!trainfromurl_ or type _!help_ for more info. ");
                            })
                                .catch(function (text) { return cb(text); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.DebugHelp = function () {
        var text = "";
        text += "!debug\n\n       Toggle debug mode\n\n";
        text += "!deleteApp {appId}\n\n       Delete specified application\n\n";
        text += "!dump\n\n       Show client state\n\n";
        text += "!whichApp\n\n       Return current appId\n\n";
        text += "!entities\n\n       Return list of entities\n\n";
        text += "!actions\n\n       Return list of actions\n\n";
        text += "!traindialogs\n\n       Return list of training dialogs\n\n";
        text += "!help\n\n       General help";
        return text;
    };
    BlisRecognizer.prototype.DeleteAction = function (recognizer, userState, actionId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Action");
                        if (!actionId) {
                            msg = "You must provide the ID of the action to delete.\n\n     !deleteaction {app ID}";
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
    BlisRecognizer.prototype.DeleteAllApps = function (recognizer, userState, cb) {
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
    BlisRecognizer.prototype.DeleteApp = function (recognizer, userState, appId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Application");
                        if (!appId) {
                            msg = "You must provide the ID of the application to delete.\n\n     !deleteapp {app ID}";
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
    BlisRecognizer.prototype.Dump = function (userState) {
        var text = "";
        text += "App: " + userState[Consts_1.UserStates.APP] + "\n\n";
        text += "Model: " + userState[Consts_1.UserStates.MODEL] + "\n\n";
        text += "Session: " + userState[Consts_1.UserStates.SESSION] + "\n\n";
        text += "InTeach: " + userState[Consts_1.UserStates.TEACH] + "\n\n";
        return text;
    };
    BlisRecognizer.prototype.EndSession = function (recognizer, userState, cb) {
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
                                            // Update the model (as we may not have had one before teaching)
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
    BlisRecognizer.prototype.GetActions = function (recognizer, userState, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var actionIds, fail, msg, _loop_2, this_2, _i, actionIds_1, actionId;
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
                        msg = "";
                        _loop_2 = function (actionId) {
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this_2.blisClient.GetAction(userState, actionId)
                                            .then(function (json) {
                                            var content = JSON.parse(json)['content'];
                                            msg += actionId + " : " + content + "\n\n";
                                            BlisDebug_1.BlisDebug.Log("Action lookup: " + actionId + " : " + content);
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
                        if (!msg) {
                            msg = "This application contains no actions.";
                        }
                        cb(msg);
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.GetApps = function (recognizer, cb) {
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
    BlisRecognizer.prototype.GetEntities = function (recognizer, userState, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityIds, fail, msg, _loop_3, this_3, _i, entityIds_1, entityId;
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
                        msg = "";
                        _loop_3 = function (entityId) {
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this_3.blisClient.GetEntity(userState, entityId)
                                            .then(function (json) {
                                            var entityName = JSON.parse(json)['name'];
                                            BlisDebug_1.BlisDebug.Log("Entity lookup: " + entityId + " : " + entityName);
                                            msg += entityId + " : " + entityName + "\n\n";
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
    BlisRecognizer.prototype.GetTrainDialogs = function (recognizer, userState, cb) {
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
                        msg = "";
                        _loop_4 = function (dialogId) {
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this_4.blisClient.GetTrainDialog(userState, dialogId)
                                            .then(function (json) {
                                            var content = JSON.parse(json)['content'];
                                            msg += dialogId + " : " + content + "\n\n";
                                            BlisDebug_1.BlisDebug.Log("Action lookup: " + dialogId + " : " + content);
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
                        if (fail) {
                            BlisDebug_1.BlisDebug.Log(fail);
                            return [2 /*return*/, fail];
                        }
                        if (!msg) {
                            msg = "This application contains no training dialogs.";
                        }
                        cb(msg);
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.Help = function () {
        var text = "";
        text += "!start\n\n       Start the bot\n\n";
        text += "!addEntity {entitiyName} {LUIS | LOCAL} {prebuildName?}\n\n       Create new application\n\n";
        text += "!teach\n\n       Start new teaching session\n\n";
        text += "!createApp {appName} {luisKey}\n\n       Create new application\n\n";
        text += "!deleteApp {appId}\n\n       Delete specified application\n\n";
        text += "!done\n\n       End a teaching session\n\n";
        text += "!loadApp {appId}\n\n       Switch to appId\n\n";
        text += "!trainfromurl {file url}\n\n       Train in dialogs at given url\n\n";
        text += "!deleteAction {actionId}\n\n       Delete an action on current app\n\n";
        text += "!help\n\n       This list\n\n";
        text += "!debughelp\n\n       Show debugging commands";
        return text;
    };
    BlisRecognizer.prototype.LoadApp = function (recognizer, userState, appId, cb) {
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
                        fail = null;
                        // Validate appId
                        return [4 /*yield*/, this.blisClient.GetApp(userState)
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
                        // Create session
                        BlisDebug_1.BlisDebug.Log("Creating session...");
                        return [4 /*yield*/, this.blisClient.StartSession(userState)
                                .then(function (sessionId) {
                                BlisDebug_1.BlisDebug.Log("Stared Session: " + appId);
                                cb("Application loaded and Session started.");
                            })
                                .catch(function (error) { return cb(error); })];
                    case 3:
                        sessionId = _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.NewSession = function (recognizer, userState, teach, cb) {
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
    BlisRecognizer.prototype.TrainFromFile = function (recognizer, userState, url, cb) {
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
                                _this.TrainOnSnippetList(recognizer, userState, snipObj.snippets)
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
    BlisRecognizer.prototype.TrainOnSnippetList = function (recognizer, userState, sniplist) {
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
                                        return [4 /*yield*/, this_5.blisClient.AddAction(userState, turn.action, new Array(), new Array(), null)
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
                        dialog = new TrainDialog_1.TrainDialog();
                        for (_d = 0, _e = snippet.turns; _d < _e.length; _d++) {
                            turn = _e[_d];
                            altTexts = [];
                            userText = turn.userText[0];
                            if (turn.userText.length > 1) {
                                for (i = 1; i < turn.userText.length; i++) {
                                    altTexts.push(new TrainDialog_1.AltText({ text: turn.userText[i] }));
                                }
                            }
                            actionId = actiontext2id[turn.action];
                            input = new TrainDialog_1.Input({ 'text': userText, 'textAlts': altTexts });
                            newturn = new TrainDialog_1.Turn({ 'input': input, 'output': actionId });
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
    BlisRecognizer.prototype.LoadUser = function (address, cb) {
        var _this = this;
        // TODO handle errors
        BlisUserState_1.BlisUserState.Get(this.bot, address, this.defaultApp, function (error, userState, isNew) {
            if (isNew) {
                // Attempt to load the application
                _this.LoadApp(_this, userState, _this.defaultApp, function (text) {
                    BlisDebug_1.BlisDebug.Log(text);
                    cb(null, userState);
                });
            }
            else {
                cb(null, userState);
            }
        });
    };
    BlisRecognizer.prototype.SendResult = function (address, userState, cb, text) {
        // Save user state
        BlisUserState_1.BlisUserState.Save(this.bot, address, userState);
        // Assume BLIS always wins for now 
        var result = { score: 1.0, answer: null, intent: null };
        result.answer = text;
        // Send callback
        cb(null, result);
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
                    var text = context.message.text.trim();
                    var _a = text.split(' '), command = _a[0], arg = _a[1], arg2 = _a[2], arg3 = _a[3];
                    command = command.toLowerCase();
                    // Handle admin commands
                    if (command.startsWith('!')) {
                        if (userState[Consts_1.UserStates.TEACH] && (command != "!dump") && (command != "!debug")) {
                            if (command == "!done") {
                                _this.EndSession(_this, userState, function (text) {
                                    _this.SendResult(address_1, userState, cb, "_Completed teach dialog..._");
                                });
                            }
                            else {
                                _this.SendResult(address_1, userState, cb, "_In teaching mode. The only valid command is_ !done");
                            }
                        }
                        else {
                            if (command == "!addentity") {
                                _this.AddEntity(_this, userState, arg, arg2, arg3, function (text) {
                                    _this.SendResult(address_1, userState, cb, text);
                                });
                            }
                            else if (command == "!apps") {
                                _this.GetApps(_this, function (text) {
                                    _this.SendResult(address_1, userState, cb, text);
                                });
                            }
                            else if (command == "!start") {
                                _this.NewSession(_this, userState, false, function (text) {
                                    _this.SendResult(address_1, userState, cb, text);
                                });
                            }
                            else if (command == "!teach") {
                                _this.NewSession(_this, userState, true, function (text) {
                                    _this.SendResult(address_1, userState, cb, text);
                                });
                            }
                            else if (command == "!actions") {
                                _this.GetActions(_this, userState, function (text) {
                                    _this.SendResult(address_1, userState, cb, text);
                                });
                            }
                            else if (command == "!deleteallapps") {
                                _this.DeleteAllApps(_this, userState, function (text) {
                                    _this.SendResult(address_1, userState, cb, text);
                                });
                            }
                            else if (command == "!done") {
                                _this.SendResult(address_1, userState, cb, "_I wasn't in teach mode. Type _!teach_ to begin teaching_");
                            }
                            else if (command == "!createapp") {
                                _this.CreateApp(_this, userState, arg, arg2, function (text) {
                                    _this.SendResult(address_1, userState, cb, text);
                                });
                            }
                            else if (command == "!deleteapp") {
                                _this.DeleteApp(_this, userState, arg, function (text) {
                                    _this.SendResult(address_1, userState, cb, text);
                                });
                            }
                            else if (command == "!debug") {
                                var active = BlisDebug_1.BlisDebug.Toggle();
                                _this.SendResult(address_1, userState, cb, "Debug " + (active ? "Enabled" : "Disabled"));
                            }
                            else if (command == "!debughelp") {
                                _this.SendResult(address_1, userState, cb, _this.DebugHelp());
                            }
                            else if (command == "!dump") {
                                _this.SendResult(address_1, userState, cb, _this.Dump(userState));
                            }
                            else if (command == "!entities") {
                                _this.GetEntities(_this, userState, function (text) {
                                    _this.SendResult(address_1, userState, cb, text);
                                });
                            }
                            else if (command == "!loadapp") {
                                _this.LoadApp(_this, userState, arg, function (text) {
                                    _this.SendResult(address_1, userState, cb, text);
                                });
                            }
                            else if (command == "!whichapp") {
                                var msg = userState[Consts_1.UserStates.APP];
                                if (!msg)
                                    msg = "No app has been loaded.";
                                _this.SendResult(address_1, userState, cb, msg);
                            }
                            else if (command == "!deleteaction") {
                                _this.DeleteAction(_this, userState, arg, function (text) {
                                    _this.SendResult(address_1, userState, cb, text);
                                });
                            }
                            else if (command == "!trainfromurl") {
                                _this.TrainFromFile(_this, userState, arg, function (text) {
                                    _this.SendResult(address_1, userState, cb, text);
                                });
                            }
                            else if (command == "!help") {
                                _this.SendResult(address_1, userState, cb, _this.Help());
                            }
                            else {
                                var text_1 = "_Not a valid command._\n\n\n\n" + _this.Help();
                                _this.SendResult(address_1, userState, cb, text_1);
                            }
                        }
                    }
                    else {
                        var inTeach_1 = userState[Consts_1.UserStates.TEACH];
                        _this.blisClient.TakeTurn(userState, text, function (response) {
                            var msg = "";
                            if (response.mode == Consts_1.TakeTurnModes.TEACH) {
                                // Markdown requires double carraige returns
                                msg = response.action.content.replace(/\n/g, ":\n\n");
                                if (inTeach_1) {
                                    msg = "_Pick desired response or type a new one_\n\n" + msg;
                                }
                            }
                            else if (response.mode == Consts_1.TakeTurnModes.ACTION) {
                                var outText = _this.blisCallback(response.actions[0].content);
                                msg = outText;
                                if (inTeach_1) {
                                    msg = "_Trained Response:_ " + msg + "\n\n_Provide next input or _!done_ if training dialog is complete_";
                                }
                            }
                            else if (response.mode == Consts_1.TakeTurnModes.ERROR) {
                                msg = response.error;
                            }
                            else {
                                msg = "Don't know mode: " + response.mode;
                            }
                            _this.SendResult(address_1, userState, cb, msg);
                        });
                    }
                });
            }
        }
        catch (Error) {
            cb(Error, null);
        }
    };
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