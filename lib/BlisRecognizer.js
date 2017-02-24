"use strict";
var tslib_1 = require("tslib");
var request = require("request");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var SnippetList_1 = require("./Model/SnippetList");
var TrainDialog_1 = require("./Model/TrainDialog");
var BlisClient_1 = require("./BlisClient");
var BlisDebug_1 = require("./BlisDebug");
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
            var fail, coptions, error_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        fail = "";
                        BlisDebug_1.BlisDebug.Log("Creating client...");
                        this.blisClient = new BlisClient_1.BlisClient(options.serviceUri, options.user, options.secret);
                        coptions = {
                            luisCallback: options.luisCallback,
                            apiCallbacks: options.apiCallbacks,
                            appId: options.appId
                        };
                        this.blisClient.SetOptions(coptions);
                        this.blisCallback = options.blisCallback ? options.blisCallback : this.DefaultBlisCallback;
                        // Attempt to load the application
                        return [4 /*yield*/, this.LoadApp(this, options.appId, function (text) { return BlisDebug_1.BlisDebug.Log(text); })];
                    case 1:
                        // Attempt to load the application
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        BlisDebug_1.BlisDebug.Log("ERROR: " + error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
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
    BlisRecognizer.prototype.AddEntity = function (recognizer, entityName, entityType, prebuiltName, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg, msg, msg, msg, msg;
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
                        if (entityType == Consts_1.EntityTypes.LUIS && !prebuiltName) {
                            msg = "LUIS entities require a prebuilt name\n\n     !createApp {entitiyName} {LUIS | LOCAL} {prebuiltName?}";
                            cb(msg);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.blisClient.AddEntity(entityName, entityType, prebuiltName)
                                .then(function (entityId) { return cb("Created Entity " + entityId); })
                                .catch(function (text) { return cb(text); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.CreateApp = function (recognizer, appName, luisKey, cb) {
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
                        return [4 /*yield*/, this.blisClient.CreateApp(appName, luisKey)
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
        text += "!help\n\n       General help";
        return text;
    };
    BlisRecognizer.prototype.DeleteAction = function (recognizer, actionId, cb) {
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
                        return [4 /*yield*/, this.blisClient.DeleteAction(actionId)
                                .then(function (text) { return cb("Deleted Action " + actionId); })
                                .catch(function (text) { return cb(text); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.DeleteAllApps = function (recognizer, cb) {
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
                                    case 0: return [4 /*yield*/, this_1.blisClient.DeleteApp(appId)
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
    BlisRecognizer.prototype.DeleteApp = function (recognizer, appId, cb) {
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
                        return [4 /*yield*/, this.blisClient.DeleteApp(appId)
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
    BlisRecognizer.prototype.Dump = function () {
        var text = "";
        text += "App: " + this.blisClient.GetOption("appId") + "\n\n";
        text += "Model: " + this.blisClient.GetOption("modelId") + "\n\n";
        text += "Session: " + this.blisClient.GetOption("sessionId") + "\n\n";
        text += "InTeach: " + this.blisClient.GetOption("inTeach") + "\n\n";
        return text;
    };
    BlisRecognizer.prototype.EndSession = function (recognizer, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Ending teaching session
                    return [4 /*yield*/, this.blisClient.EndSession()
                            .then(function (sessionId) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: 
                                    // Update the model
                                    return [4 /*yield*/, this.blisClient.GetModel()
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
    BlisRecognizer.prototype.GetActions = function (recognizer, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var actionIds, fail, msg, _loop_2, this_2, _i, actionIds_1, actionId;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting actions");
                        actionIds = [];
                        fail = null;
                        return [4 /*yield*/, this.blisClient.GetActions()
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
                                    case 0: return [4 /*yield*/, this_2.blisClient.GetAction(actionId)
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
    BlisRecognizer.prototype.GetEntities = function (recognizer, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entityIds, fail, msg, _loop_3, this_3, _i, entityIds_1, entityId;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting entities");
                        entityIds = [];
                        fail = null;
                        return [4 /*yield*/, this.blisClient.GetEntities()
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
                                    case 0: return [4 /*yield*/, this_3.blisClient.GetEntity(entityId)
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
    BlisRecognizer.prototype.LoadApp = function (recognizer, appId, cb) {
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
                        this.blisClient.SetOptions({ appId: appId, sessionId: null });
                        fail = null;
                        // Validate appId
                        return [4 /*yield*/, this.blisClient.GetApp()
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
                        return [4 /*yield*/, this.blisClient.GetModel()
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
                        return [4 /*yield*/, this.blisClient.StartSession()
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
    BlisRecognizer.prototype.NewSession = function (recognizer, teach, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to create new session, Teach = " + teach);
                        // Close any existing session
                        return [4 /*yield*/, this.blisClient.EndSession()
                                .then(function (sessionId) { return BlisDebug_1.BlisDebug.Log("Ended session " + sessionId); })
                                .catch(function (error) { return BlisDebug_1.BlisDebug.Log("" + error); })];
                    case 1:
                        // Close any existing session
                        _a.sent();
                        return [4 /*yield*/, this.blisClient.StartSession(teach)
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
    BlisRecognizer.prototype.TrainFromFile = function (recognizer, url, cb) {
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
                                _this.TrainOnSnippetList(recognizer, snipObj.snippets)
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
    BlisRecognizer.prototype.TrainOnSnippetList = function (recognizer, sniplist) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var fail, actionList, actiontext2id, _i, sniplist_1, snippet, _loop_4, this_4, _a, _b, turn, _c, sniplist_2, snippet, dialog, _d, _e, turn, altTexts, userText, i, actionId, input, newturn;
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
                        _loop_4 = function (turn) {
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(actionList.indexOf(turn.action) == -1)) return [3 /*break*/, 2];
                                        if (!!fail) return [3 /*break*/, 2];
                                        BlisDebug_1.BlisDebug.Log("Add Action: " + turn.action);
                                        return [4 /*yield*/, this_4.blisClient.AddAction(turn.action, new Array(), new Array(), null)
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
                        this_4 = this;
                        _a = 0, _b = snippet.turns;
                        _f.label = 2;
                    case 2:
                        if (!(_a < _b.length)) return [3 /*break*/, 5];
                        turn = _b[_a];
                        return [5 /*yield**/, _loop_4(turn)];
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
                        return [4 /*yield*/, this.blisClient.TrainDialog(dialog)
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
                        return [4 /*yield*/, this.blisClient.TrainModel()
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
                        return [4 /*yield*/, this.blisClient.StartSession()
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
    BlisRecognizer.prototype.recognize = function (context, cb) {
        var _this = this;
        try {
            var result = { score: 1.0, answer: null, intent: null };
            if (context && context.message && context.message.text) {
                this.SendTyping(context.message.address);
                BlisDebug_1.BlisDebug.SetAddress(context.message.address);
                var text = context.message.text.trim();
                var _a = text.split(' '), command = _a[0], arg = _a[1], arg2 = _a[2], arg3 = _a[3];
                command = command.toLowerCase();
                // Handle admin commands
                if (command.startsWith('!')) {
                    if (this.blisClient.GetOption('inTeach') && (command != "!dump") && (command != "!debug")) {
                        if (command == "!done") {
                            this.EndSession(this, function (text) {
                                result.answer = "_Completed teach dialog..._";
                                cb(null, result);
                            });
                        }
                        else {
                            result.answer = "_In teaching mode. The only valid command is_ !done";
                            cb(null, result);
                        }
                    }
                    else {
                        if (command == "!addentity") {
                            this.AddEntity(this, arg, arg2, arg3, function (text) {
                                result.answer = text;
                                cb(null, result);
                            });
                        }
                        else if (command == "!apps") {
                            this.GetApps(this, function (text) {
                                result.answer = text;
                                cb(null, result);
                            });
                        }
                        else if (command == "!start") {
                            this.NewSession(this, false, function (text) {
                                result.answer = text;
                                cb(null, result);
                            });
                        }
                        else if (command == "!teach") {
                            this.NewSession(this, true, function (text) {
                                result.answer = text;
                                cb(null, result);
                            });
                        }
                        else if (command == "!actions") {
                            this.GetActions(this, function (text) {
                                result.answer = text;
                                cb(null, result);
                            });
                        }
                        else if (command == "!deleteallapps") {
                            this.DeleteAllApps(this, function (text) {
                                result.answer = text;
                                cb(null, result);
                            });
                        }
                        else if (command == "!done") {
                            result.answer = "_I wasn't in teach mode. Type _!teach_ to begin teaching_";
                            cb(null, result);
                        }
                        else if (command == "!dump") {
                            result.answer = this.Dump();
                            cb(null, result);
                        }
                        else if (command == "!createapp") {
                            this.CreateApp(this, arg, arg2, function (text) {
                                result.answer = text;
                                cb(null, result);
                            });
                        }
                        else if (command == "!deleteapp") {
                            this.DeleteApp(this, arg, function (text) {
                                result.answer = text;
                                cb(null, result);
                            });
                        }
                        else if (command == "!debug") {
                            var active = BlisDebug_1.BlisDebug.Toggle();
                            result.answer = "Debug " + (active ? "Enabled" : "Disabled");
                            cb(null, result);
                        }
                        else if (command == "!debughelp") {
                            result.answer = this.DebugHelp();
                            cb(null, result);
                        }
                        else if (command == "!entities") {
                            this.GetEntities(this, function (text) {
                                result.answer = text;
                                cb(null, result);
                            });
                        }
                        else if (command == "!loadapp") {
                            this.LoadApp(this, arg, function (text) {
                                result.answer = text;
                                cb(null, result);
                            });
                        }
                        else if (command == "!whichapp") {
                            result.answer = this.blisClient.GetOption('appId');
                            if (!result.answer)
                                result.answer = "No app has been loaded.";
                            cb(null, result);
                        }
                        else if (command == "!deleteaction") {
                            this.DeleteAction(this, arg, function (text) {
                                result.answer = text;
                                cb(null, result);
                            });
                        }
                        else if (command == "!trainfromurl") {
                            this.TrainFromFile(this, arg, function (text) {
                                result.answer = text;
                                cb(null, result);
                            });
                        }
                        else if (command == "!help") {
                            result.answer = this.Help();
                            cb(null, result);
                        }
                        else {
                            var text_1 = "_Not a valid command._\n\n\n\n" + this.Help();
                            result.answer = text_1;
                            cb(null, result);
                        }
                    }
                }
                else {
                    var inTeach_1 = this.blisClient.GetOption('inTeach');
                    this.blisClient.TakeTurn(text, function (response) {
                        if (response.mode == Consts_1.TakeTurnModes.TEACH) {
                            // Markdown requires double carraige returns
                            result.answer = response.action.content.replace(/\n/g, ":\n\n");
                            if (inTeach_1) {
                                result.answer = "_Pick desired response or type a new one_\n\n" + result.answer;
                            }
                        }
                        else if (response.mode == Consts_1.TakeTurnModes.ACTION) {
                            var outText = _this.blisCallback(response.actions[0].content);
                            result.answer = outText;
                            if (inTeach_1) {
                                result.answer = "_Trained Response:_ " + result.answer + "\n\n_Provide next input or _!done_ if training dialog is complete_";
                            }
                        }
                        else if (response.mode == Consts_1.TakeTurnModes.ERROR) {
                            result.answer = response.error;
                        }
                        else {
                            result.answer = "Don't know mode: " + response.mode;
                        }
                        cb(null, result);
                    });
                }
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