"use strict";
var tslib_1 = require("tslib");
var client_1 = require("./client");
var BlisDebug_1 = require("./BlisDebug");
var TakeTurnResponse_1 = require("../client/Model/TakeTurnResponse");
var BlisRecognizer = (function () {
    function BlisRecognizer(options) {
        this.options = options;
        this.init(options);
    }
    BlisRecognizer.prototype.init = function (options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, _i, _b, entityName, entityId, _c, _d, prebuiltName, prebuiltId, _e, err_1;
            return tslib_1.__generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _f.trys.push([0, 13, , 14]);
                        BlisDebug_1.BlisDebug.Log("Creating client...");
                        this.blisClient = new client_1.BlisClient(options.serviceUri, options.user, options.secret);
                        // Create App
                        this.appId = options.appId;
                        if (!(this.appId && (options.appName || options.luisKey))) return [3 /*break*/, 1];
                        BlisDebug_1.BlisDebug.Log("No need for appName or listKey when providing appId");
                        return [3 /*break*/, 3];
                    case 1:
                        BlisDebug_1.BlisDebug.Log("Creating app...");
                        _a = this;
                        return [4 /*yield*/, this.blisClient.CreateApp(options.appName, options.luisKey)];
                    case 2:
                        _a.appId = _f.sent(); // TODO parameter validation
                        _f.label = 3;
                    case 3:
                        BlisDebug_1.BlisDebug.Log("Using AppId " + this.appId);
                        if (!options.entityList) return [3 /*break*/, 7];
                        _i = 0, _b = options.entityList;
                        _f.label = 4;
                    case 4:
                        if (!(_i < _b.length)) return [3 /*break*/, 7];
                        entityName = _b[_i];
                        BlisDebug_1.BlisDebug.Log("Adding new LUIS entity: " + entityName);
                        return [4 /*yield*/, this.blisClient.AddEntity(this.appId, entityName, "LOCAL", null)];
                    case 5:
                        entityId = _f.sent();
                        BlisDebug_1.BlisDebug.Log("Added entity: " + entityId);
                        _f.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 4];
                    case 7:
                        if (!options.prebuiltList) return [3 /*break*/, 11];
                        _c = 0, _d = options.prebuiltList;
                        _f.label = 8;
                    case 8:
                        if (!(_c < _d.length)) return [3 /*break*/, 11];
                        prebuiltName = _d[_c];
                        BlisDebug_1.BlisDebug.Log("Adding new LUIS pre-build entity: " + prebuiltName);
                        return [4 /*yield*/, this.blisClient.AddEntity(this.appId, prebuiltName, "LUIS", prebuiltName)];
                    case 9:
                        prebuiltId = _f.sent();
                        BlisDebug_1.BlisDebug.Log("Added prebuilt: " + prebuiltId);
                        _f.label = 10;
                    case 10:
                        _c++;
                        return [3 /*break*/, 8];
                    case 11:
                        // Create location, datetime and forecast entities
                        //   var locationEntityId = await this.blisClient.AddEntity(this.appId, "location", "LUIS", "geography");
                        //    var datetimeEntityId = await this.blisClient.AddEntity(this.appId, "date", "LUIS", "datetime");
                        //    var forecastEntityId = await this.blisClient.AddEntity(this.appId, "forecast", "LOCAL", null);
                        // Create actions
                        //      var whichDayActionId = await this.blisClient.AddAction(this.appId, "Which day?", new Array(), new Array(datetimeEntityId), null);
                        //      var whichCityActionId = await this.blisClient.AddAction(this.appId, "Which city?", new Array(), new Array(locationEntityId), null);
                        //      var forecastActionId = await this.blisClient.AddAction(this.appId, "$forecast", new Array(forecastEntityId), new Array(), null);
                        // Train model
                        //TEMP         this.modelId = await this.blisClient.TrainModel(this.appId);
                        // Create session
                        BlisDebug_1.BlisDebug.Log("Creating session...");
                        _e = this;
                        return [4 /*yield*/, this.blisClient.StartSession(this.appId, this.modelId)];
                    case 12:
                        _e.sessionId = _f.sent();
                        BlisDebug_1.BlisDebug.Log("Created Session: " + this.sessionId);
                        return [3 /*break*/, 14];
                    case 13:
                        err_1 = _f.sent();
                        BlisDebug_1.BlisDebug.Log(err_1);
                        return [3 /*break*/, 14];
                    case 14: return [2 /*return*/];
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
        text += "!next => Start new dialog\n\n";
        text += "!next teach => Start new teaching dialog\n\n";
        text += "!createApp {appName} => Create new application with current luisKey\n\n";
        text += "!createApp {appName} {luisKey} => Create new application\n\n";
        text += "!deleteApp => Delete existing application\n\n";
        text += "!deleteApp {appId} => Delete specified application\n\n";
        text += "!whichApp => Return current appId\n\n";
        text += "!deleteAction {actionId} => Delete an action on current app\n\n";
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
                else if (command == "!help") {
                    result.answer = this.Help();
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
                    this.blisClient.TakeTurn(this.appId, this.sessionId, text, this.LUCallback, null, function (response) {
                        if (response.mode == TakeTurnResponse_1.TakeTurnModes.Teach) {
                            // Markdown requires double carraige returns
                            var output = response.action.content.replace(/\n/g, ":\n\n");
                            result.answer = output;
                        }
                        else if (response.mode == TakeTurnResponse_1.TakeTurnModes.Action) {
                            var outText = _this.InsertEntities(response.actions[0].content);
                            result.answer = outText;
                        }
                        else if (response.mode == TakeTurnResponse_1.TakeTurnModes.Error) {
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
    BlisRecognizer.prototype.InsertEntities = function (text) {
        var words = [];
        var tokens = text.split(' ').forEach(function (item) {
            if (item.startsWith('$')) {
                var name_1 = item; // LARS TODO WAS: ent_name = item[1:] - why the 1:?
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