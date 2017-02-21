"use strict";
var tslib_1 = require("tslib");
var request = require("request");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var SnippetList_1 = require("./Model/SnippetList");
var TrainDialog_1 = require("./Model/TrainDialog");
var client_1 = require("./client");
var BlisDebug_1 = require("./BlisDebug");
var Consts_1 = require("../client/Model/Consts");
var BlisRecognizer = (function () {
    function BlisRecognizer(options) {
        this.options = options;
        this.entityValues = {};
        this.init(options);
    }
    BlisRecognizer.prototype.init = function (options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            var _a, _i, _b, entityName, _c, _d, prebuiltName, entityIds_1, entity_id2name_1, _loop_1, this_1, _e, entityIds_2, entityId, actionIds_1, action_id2name_1, action_name2id_1, _loop_2, this_2, _f, actionIds_2, actionId, _g, error_1;
            return tslib_1.__generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        _h.trys.push([0, 27, , 28]);
                        BlisDebug_1.BlisDebug.Log("Creating client...");
                        this.blisClient = new client_1.BlisClient(options.serviceUri, options.user, options.secret);
                        this.luisCallback = options.luisCallback;
                        this.apiCallbacks = options.apiCallbacks;
                        this.blisCallback = options.blisCallback ? options.blisCallback : this.DefaultBlisCallback;
                        // Create App
                        this.appId = options.appId;
                        if (!this.appId) return [3 /*break*/, 1];
                        if (options.appName || options.luisKey) {
                            BlisDebug_1.BlisDebug.Log("No need for appName or listKey when providing appId");
                        }
                        return [3 /*break*/, 3];
                    case 1:
                        if (!options.appName || !options.luisKey) {
                            BlisDebug_1.BlisDebug.Log("ERROR: Must provide either appId or appName and luisKey");
                            return [2 /*return*/];
                        }
                        BlisDebug_1.BlisDebug.Log("Creating app...");
                        _a = this;
                        return [4 /*yield*/, this.blisClient.CreateApp(options.appName, options.luisKey)];
                    case 2:
                        _a.appId = _h.sent(); // TODO parameter validation
                        _h.label = 3;
                    case 3:
                        BlisDebug_1.BlisDebug.Log("Using AppId " + this.appId);
                        if (!options.entityList) return [3 /*break*/, 7];
                        _i = 0, _b = options.entityList;
                        _h.label = 4;
                    case 4:
                        if (!(_i < _b.length)) return [3 /*break*/, 7];
                        entityName = _b[_i];
                        BlisDebug_1.BlisDebug.Log("Adding new LUIS entity: " + entityName);
                        return [4 /*yield*/, this.blisClient.AddEntity(this.appId, entityName, "LOCAL", null)
                                .then(function (entityId) {
                                BlisDebug_1.BlisDebug.Log("Added entity: " + entityId);
                            })
                                .catch(function (error) {
                                BlisDebug_1.BlisDebug.Log("ERROR: " + error);
                            })];
                    case 5:
                        _h.sent();
                        _h.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 4];
                    case 7:
                        if (!options.prebuiltList) return [3 /*break*/, 11];
                        _c = 0, _d = options.prebuiltList;
                        _h.label = 8;
                    case 8:
                        if (!(_c < _d.length)) return [3 /*break*/, 11];
                        prebuiltName = _d[_c];
                        BlisDebug_1.BlisDebug.Log("Adding new LUIS pre-build entity: " + prebuiltName);
                        return [4 /*yield*/, this.blisClient.AddEntity(this.appId, prebuiltName, "LUIS", prebuiltName) // TODO support diff luis and internal name
                                .then(function (prebuiltId) {
                                BlisDebug_1.BlisDebug.Log("Added entity: " + prebuiltId);
                            })
                                .catch(function (error) {
                                BlisDebug_1.BlisDebug.Log("ERROR: " + error);
                            })];
                    case 9:
                        _h.sent();
                        _h.label = 10;
                    case 10:
                        _c++;
                        return [3 /*break*/, 8];
                    case 11:
                        entityIds_1 = [];
                        return [4 /*yield*/, this.blisClient.GetEntities(this.appId)
                                .then(function (json) {
                                entityIds_1 = JSON.parse(json)['ids'];
                                BlisDebug_1.BlisDebug.Log("Found " + entityIds_1.length + " entities");
                            })
                                .catch(function (error) {
                                BlisDebug_1.BlisDebug.Log("ERROR: " + error);
                            })];
                    case 12:
                        _h.sent();
                        entity_id2name_1 = {};
                        _loop_1 = function (entityId) {
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this_1.blisClient.GetEntity(this_1.appId, entityId)
                                            .then(function (json) {
                                            var entityName = JSON.parse(json)['name'];
                                            entity_id2name_1[entityId] = entityName;
                                            _this.entity_name2id[entityName] = entityId;
                                            BlisDebug_1.BlisDebug.Log("Entity lookup: " + entityId + " : " + entityName);
                                        })
                                            .catch(function (error) {
                                            BlisDebug_1.BlisDebug.Log("ERROR: " + error);
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _e = 0, entityIds_2 = entityIds_1;
                        _h.label = 13;
                    case 13:
                        if (!(_e < entityIds_2.length)) return [3 /*break*/, 16];
                        entityId = entityIds_2[_e];
                        return [5 /*yield**/, _loop_1(entityId)];
                    case 14:
                        _h.sent();
                        _h.label = 15;
                    case 15:
                        _e++;
                        return [3 /*break*/, 13];
                    case 16:
                        actionIds_1 = [];
                        return [4 /*yield*/, this.blisClient.GetActions(this.appId)
                                .then(function (json) {
                                actionIds_1 = JSON.parse(json)['ids'];
                                BlisDebug_1.BlisDebug.Log("Found " + actionIds_1.length + " actions");
                            })
                                .catch(function (error) {
                                BlisDebug_1.BlisDebug.Log("ERROR: " + error);
                            })];
                    case 17:
                        _h.sent();
                        action_id2name_1 = {};
                        action_name2id_1 = {};
                        _loop_2 = function (actionId) {
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this_2.blisClient.GetEntity(this_2.appId, actionId)
                                            .then(function (json) {
                                            var actionName = JSON.parse(json)['name'];
                                            action_id2name_1[actionId] = json;
                                            action_name2id_1[actionName] = actionId;
                                            BlisDebug_1.BlisDebug.Log("Action lookup: " + actionId + " : " + actionName);
                                        })
                                            .catch(function (error) {
                                            BlisDebug_1.BlisDebug.Log("ERROR: " + error);
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_2 = this;
                        _f = 0, actionIds_2 = actionIds_1;
                        _h.label = 18;
                    case 18:
                        if (!(_f < actionIds_2.length)) return [3 /*break*/, 21];
                        actionId = actionIds_2[_f];
                        return [5 /*yield**/, _loop_2(actionId)];
                    case 19:
                        _h.sent();
                        _h.label = 20;
                    case 20:
                        _f++;
                        return [3 /*break*/, 18];
                    case 21:
                        if (!(actionIds_1.length > 0)) return [3 /*break*/, 23];
                        return [4 /*yield*/, this.blisClient.TrainModel(this.appId)
                                .then(function (modelId) {
                                _this.modelId = modelId;
                                BlisDebug_1.BlisDebug.Log("Trained model: " + _this.modelId);
                            })
                                .catch(function (error) {
                                BlisDebug_1.BlisDebug.Log("ERROR: " + error);
                            })];
                    case 22:
                        _h.sent();
                        _h.label = 23;
                    case 23:
                        if (!this.modelId) return [3 /*break*/, 25];
                        BlisDebug_1.BlisDebug.Log("Creating session...");
                        _g = this;
                        return [4 /*yield*/, this.blisClient.StartSession(this.appId, this.modelId)];
                    case 24:
                        _g.sessionId = _h.sent();
                        BlisDebug_1.BlisDebug.Log("Created Session: " + this.sessionId);
                        return [3 /*break*/, 26];
                    case 25:
                        BlisDebug_1.BlisDebug.Log("No model.  Try training with \"!next teach\"");
                        _h.label = 26;
                    case 26: return [3 /*break*/, 28];
                    case 27:
                        error_1 = _h.sent();
                        BlisDebug_1.BlisDebug.Log("ERROR: " + error_1);
                        return [3 /*break*/, 28];
                    case 28: return [2 /*return*/];
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
    BlisRecognizer.prototype.TrainFromFile = function (recognizer, url, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            var text;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "https://onedrive.live.com/download?cid=55DCA1313254B6CB&resid=55DCA1313254B6CB%213634&authkey=AIyjQoawD2vlHmc";
                        return [4 /*yield*/, this.ReadFromFile(url)
                                .then(function (text) {
                                var json = JSON.parse(text);
                                var snipObj = json_typescript_mapper_1.deserialize(SnippetList_1.SnippetList, json);
                                _this.TrainOnSnippetList(recognizer, snipObj.snippets);
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
            var actionList, actiontext2id, _i, sniplist_1, snippet, _loop_3, this_3, _a, _b, turn, _c, sniplist_2, snippet, dialog, _d, _e, turn, altTexts, userText, i, actionId, input, newturn, _f;
            return tslib_1.__generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        actionList = [];
                        actiontext2id = {};
                        _i = 0, sniplist_1 = sniplist;
                        _g.label = 1;
                    case 1:
                        if (!(_i < sniplist_1.length)) return [3 /*break*/, 6];
                        snippet = sniplist_1[_i];
                        _loop_3 = function (turn) {
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(actionList.indexOf(turn.action) == -1)) return [3 /*break*/, 2];
                                        BlisDebug_1.BlisDebug.Log("Add Action: " + turn.action);
                                        return [4 /*yield*/, this_3.blisClient.AddAction(this_3.appId, turn.action, new Array(), new Array(), null)
                                                .then(function (actionId) {
                                                actionList.push(turn.action);
                                                actiontext2id[turn.action] = actionId;
                                            })
                                                .catch(function (text) { return BlisDebug_1.BlisDebug.Log("!!" + text); })];
                                    case 1:
                                        _a.sent();
                                        _a.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        };
                        this_3 = this;
                        _a = 0, _b = snippet.turns;
                        _g.label = 2;
                    case 2:
                        if (!(_a < _b.length)) return [3 /*break*/, 5];
                        turn = _b[_a];
                        return [5 /*yield**/, _loop_3(turn)];
                    case 3:
                        _g.sent();
                        _g.label = 4;
                    case 4:
                        _a++;
                        return [3 /*break*/, 2];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        BlisDebug_1.BlisDebug.Log("Found " + actionList.length + " actions. ");
                        _c = 0, sniplist_2 = sniplist;
                        _g.label = 7;
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
                        return [4 /*yield*/, this.blisClient.TrainDialog(this.appId, dialog)
                                .then(function (text) {
                                BlisDebug_1.BlisDebug.Log("Added: " + text);
                            })
                                .catch(function (text) { return BlisDebug_1.BlisDebug.Log("" + text); })];
                    case 8:
                        _g.sent();
                        _g.label = 9;
                    case 9:
                        _c++;
                        return [3 /*break*/, 7];
                    case 10:
                        // Finally train the model
                        BlisDebug_1.BlisDebug.Log("Training the model...");
                        _f = this;
                        return [4 /*yield*/, this.blisClient.TrainModel(this.appId)];
                    case 11:
                        _f.modelId = _g.sent();
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
                        if (!this.sessionId) return [3 /*break*/, 2];
                        BlisDebug_1.BlisDebug.Log("Trying to delete existing session");
                        return [4 /*yield*/, this.blisClient.EndSession(this.appId, this.sessionId)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.blisClient.StartSession(this.appId, this.modelId, teach)
                            .then(function (text) {
                            recognizer.sessionId = text;
                            cb("New session, Teach = " + teach);
                        })
                            .catch(function (text) { return cb(text); })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.CreateApp = function (recognizer, appName, luisKey, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Create Application");
                        // Using existing LUIS key if not provided
                        if (!luisKey) {
                            luisKey = recognizer.luisKey;
                        }
                        return [4 /*yield*/, this.blisClient.CreateApp(appName, luisKey)
                                .then(function (text) {
                                recognizer.appId = text;
                                recognizer.luisKey = luisKey;
                                cb("Created App " + text);
                            })
                                .catch(function (text) { return cb(text); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.DeleteApp = function (recognizer, appId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Application");
                        // Delete current app if no appId provided
                        if (!appId) {
                            appId = recognizer.appId;
                        }
                        return [4 /*yield*/, this.blisClient.DeleteApp(appId)
                                .then(function (text) {
                                // Did I delete my active app?
                                if (appId == recognizer.appId) {
                                    recognizer.appId = null;
                                }
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
    BlisRecognizer.prototype.DeleteAction = function (recognizer, actionId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Action");
                        return [4 /*yield*/, this.blisClient.DeleteAction(this.appId, actionId)
                                .then(function (text) { return cb("Deleted Action " + actionId); })
                                .catch(function (text) { return cb(text); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.Help = function () {
        var text = "";
        text += "!next\n\n       Start new dialog\n\n";
        text += "!next teach\n\n       Start new teaching dialog\n\n";
        text += "!createApp {appName}\n\n       Create new application with current luisKey\n\n";
        text += "!createApp {appName} {luisKey}\n\n       Create new application\n\n";
        text += "!deleteApp\n\n       Delete existing application\n\n";
        text += "!deleteApp {appId}\n\n       Delete specified application\n\n";
        text += "!startApp\n\n       Switch to appId\n\n";
        text += "!whichApp\n\n       Return current appId\n\n";
        text += "!trainDialogs {file url}\n\n       Train in dialogs at given url\n\n";
        text += "!deleteAction {actionId}\n\n       Delete an action on current app\n\n";
        text += "!help\n\n       This list";
        return text;
    };
    BlisRecognizer.prototype.recognize = function (context, cb) {
        var _this = this;
        var result = { score: 1.0, answer: null, intent: null };
        if (context && context.message && context.message.text) {
            var text = context.message.text.trim();
            var _a = text.split(' '), command = _a[0], arg = _a[1], arg2 = _a[2];
            command = command.toLowerCase();
            // Handle admin commands
            if (command.startsWith('!')) {
                if (command == "!reset") {
                }
                else if (command == "!next") {
                    var teach = (arg == 'teach');
                    this.NewSession(this, teach, function (text) {
                        result.answer = text;
                        cb(null, result);
                    });
                }
                else if (command == "!createapp") {
                    //    let that = this;
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
                else if (command == "!startapp") {
                    this.appId = arg;
                    this.sessionId = null;
                    result.answer = "Starting app " + arg;
                    cb(null, result);
                }
                else if (command == "!whichapp") {
                    result.answer = this.appId;
                    cb(null, result);
                }
                else if (command == "!deleteaction") {
                    this.DeleteAction(this, arg, function (text) {
                        result.answer = text;
                        cb(null, result);
                    });
                }
                else if (command == "!traindialogs") {
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
                    var text_1 = "Not a valid command.\n\n\n\n" + this.Help();
                    result.answer = text_1;
                    cb(null, result);
                }
            }
            else {
                if (this.appId == null) {
                    result.answer = "No Application has been loaded.  Type !help for more info.";
                    cb(null, result);
                }
                else if (!this.sessionId) {
                    result.answer = "Create a sesion first with !next or !next teach";
                    cb(null, result);
                }
                else {
                    this.blisClient.TakeTurn(this.appId, this.sessionId, text, this.luisCallback, this.apiCallbacks, function (response) {
                        if (response.mode == Consts_1.TakeTurnModes.Teach) {
                            // Markdown requires double carraige returns
                            var output = response.action.content.replace(/\n/g, ":\n\n");
                            result.answer = output;
                        }
                        else if (response.mode == Consts_1.TakeTurnModes.Action) {
                            var outText = _this.blisCallback(response.actions[0].content);
                            result.answer = outText;
                        }
                        else if (response.mode == Consts_1.TakeTurnModes.Error) {
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
    };
    BlisRecognizer.prototype.DefaultBlisCallback = function (text) {
        var _this = this;
        var words = [];
        var tokens = text.split(' ').forEach(function (item) {
            if (item.startsWith('$')) {
                if (_this.entity_name2id[item]) {
                    var entityId = _this.entity_name2id[item];
                    var entityValue = _this.entityValues[item];
                    words.push(entityValue);
                }
                else if (_this.entityValues[item]) {
                    var entityValue = _this.entityValues[item];
                    words.push(entityValue);
                }
                else {
                    BlisDebug_1.BlisDebug.Log("Found entity reference " + item + " but no value for that entity observed");
                }
            }
            else {
                words.push(item);
            }
        });
        return words.join(' ');
    };
    return BlisRecognizer;
}());
exports.BlisRecognizer = BlisRecognizer;
//# sourceMappingURL=BlisRecognizer.js.map