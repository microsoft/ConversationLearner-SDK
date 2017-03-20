"use strict";
var tslib_1 = require("tslib");
var request = require('request');
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Credentials_1 = require("./Http/Credentials");
var Action_1 = require("./Model/Action");
var Consts_1 = require("./Model/Consts");
var TakeTurnResponse_1 = require("./Model/TakeTurnResponse");
var TakeTurnRequest_1 = require("./Model/TakeTurnRequest");
var BlisMemory_1 = require("./BlisMemory");
var BlisDebug_1 = require("./BlisDebug");
var BlisClient = (function () {
    function BlisClient(serviceUri, user, secret, luisCallback, apiCallbacks) {
        // Mappting between prebuild API names and functions
        this.intApiCallbacks = {};
        if (!serviceUri) {
            BlisDebug_1.BlisDebug.Log("service URI is required");
        }
        this.serviceUri = serviceUri;
        this.credentials = new Credentials_1.Credentials(user, secret);
        this.luisCallback = luisCallback;
        this.apiCallbacks = apiCallbacks;
        this.intApiCallbacks["saveLast"] = this.SaveLastCB;
    }
    BlisClient.prototype.AddAction = function (userState, content, actionType, requiredEntityList, negativeEntityList, prebuiltEntityName) {
        var _this = this;
        if (requiredEntityList === void 0) { requiredEntityList = []; }
        if (negativeEntityList === void 0) { negativeEntityList = []; }
        if (prebuiltEntityName === void 0) { prebuiltEntityName = null; }
        var apiPath = "app/" + userState[Consts_1.UserStates.APP] + "/action";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: {
                    content: content,
                    RequiredEntities: requiredEntityList,
                    NegativeEntities: negativeEntityList,
                    action_type: actionType
                },
                json: true
            };
            request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body.message);
                }
                else {
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient.prototype.AddEntity = function (userState, entityName, entityType, prebuiltEntityName) {
        var _this = this;
        var apiPath = "app/" + userState[Consts_1.UserStates.APP] + "/entity";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: {
                    name: entityName,
                    EntityType: entityType,
                    LUISPreName: prebuiltEntityName
                },
                json: true
            };
            request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body.message);
                }
                else {
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient.prototype.AddTrainDialog = function (userState, traindialog) {
        var _this = this;
        var apiPath = "app/" + userState[Consts_1.UserStates.APP] + "/traindialog";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                json: true
            };
            requestData['body'] = traindialog;
            request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(JSON.parse(body).message);
                }
                else {
                    var modelId = body.id;
                    userState[Consts_1.UserStates.MODEL] = modelId;
                    resolve(modelId);
                }
            });
        });
    };
    BlisClient.prototype.CreateApp = function (userState, name, luisKey) {
        var _this = this;
        var apiPath = "app";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring(),
                },
                body: {
                    name: name,
                    LuisAuthKey: luisKey
                },
                json: true
            };
            request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body.message);
                }
                else {
                    var appId = body.id;
                    _this.InitUserState(userState, appId);
                    resolve(appId);
                }
            });
        });
    };
    BlisClient.prototype.InitUserState = function (userState, appId) {
        userState[Consts_1.UserStates.APP] = appId;
        userState[Consts_1.UserStates.SESSION] = null;
        userState[Consts_1.UserStates.MODEL] = null;
        userState[Consts_1.UserStates.MEMORY] = {};
        userState[Consts_1.UserStates.ENTITYLOOKUP] = {};
    };
    BlisClient.prototype.DeleteAction = function (userState, actionId) {
        var _this = this;
        var apiPath = "app/" + userState[Consts_1.UserStates.APP] + "/action/" + actionId;
        return new Promise(function (resolve, reject) {
            var url = _this.serviceUri + apiPath;
            var requestData = {
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                }
            };
            request.delete(url, requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(JSON.parse(body).message);
                }
                else {
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient.prototype.DeleteApp = function (userState, appId) {
        var _this = this;
        // If not appId sent use active app
        var activeApp = false;
        if (appId == userState[Consts_1.UserStates.APP]) {
            activeApp = true;
        }
        var apiPath = "app/" + appId;
        return new Promise(function (resolve, reject) {
            var url = _this.serviceUri + apiPath;
            var requestData = {
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                }
            };
            request.delete(url, requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body);
                }
                else {
                    // Did I delete my active app?
                    if (activeApp) {
                        userState[Consts_1.UserStates.APP] = null;
                        userState[Consts_1.UserStates.MODEL] = null;
                        userState[Consts_1.UserStates.SESSION] = null;
                    }
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient.prototype.EndSession = function (userState) {
        var _this = this;
        BlisDebug_1.BlisDebug.Log("Deleting existing session " + userState[Consts_1.UserStates.SESSION]);
        var apiPath = "app/" + userState[Consts_1.UserStates.APP] + "/session2/" + userState[Consts_1.UserStates.SESSION];
        return new Promise(function (resolve, reject) {
            if (!userState[Consts_1.UserStates.SESSION]) {
                resolve("No Session");
                return;
            }
            var url = _this.serviceUri + apiPath;
            var requestData = {
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                }
            };
            request.delete(url, requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(JSON.parse(body).message);
                }
                else {
                    userState[Consts_1.UserStates.SESSION] = null;
                    userState[Consts_1.UserStates.TEACH] = false;
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient.prototype.ExportApp = function (userState) {
        var _this = this;
        var apiPath = "app/" + userState[Consts_1.UserStates.APP] + "/source";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                json: true
            };
            request.get(requestData, function (error, response, body) {
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
    BlisClient.prototype.GetApp = function (appId) {
        var _this = this;
        var apiPath = "app/" + appId;
        return new Promise(function (resolve, reject) {
            var url = _this.serviceUri + apiPath;
            var requestData = {
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                }
            };
            request.get(url, requestData, function (error, response, body) {
                var payload = JSON.parse(body);
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(payload.message);
                }
                else {
                    resolve(payload);
                }
            });
        });
    };
    BlisClient.prototype.GetAction = function (userState, actionId) {
        var _this = this;
        var apiPath = "app/" + userState[Consts_1.UserStates.APP] + "/action/" + actionId;
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                json: true
            };
            request.get(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(JSON.parse(body).message);
                }
                else {
                    var action = json_typescript_mapper_1.deserialize(Action_1.Action, body);
                    resolve(action);
                }
            });
        });
    };
    BlisClient.prototype.GetActions = function (userState) {
        var _this = this;
        var apiPath = "app/" + userState[Consts_1.UserStates.APP] + "/action";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                }
            };
            request.get(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(JSON.parse(body).message);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    BlisClient.prototype.GetApps = function () {
        var _this = this;
        var apiPath = "app";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                }
            };
            request.get(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(JSON.parse(body).message);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    // TODO return entity object
    BlisClient.prototype.GetEntity = function (userState, entityId) {
        var _this = this;
        var apiPath = "app/" + userState[Consts_1.UserStates.APP] + "/entity/" + entityId;
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                }
            };
            request.get(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(JSON.parse(body).message);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    BlisClient.prototype.GetEntities = function (userState) {
        var _this = this;
        var apiPath = "app/" + userState[Consts_1.UserStates.APP] + "/entity";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                }
            };
            request.get(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(JSON.parse(body).message);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    BlisClient.prototype.GetModel = function (userState) {
        var _this = this;
        // Clear existing modelId
        userState[Consts_1.UserStates.MODEL] = null;
        var apiPath = "app/" + userState[Consts_1.UserStates.APP] + "/model";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                json: true
            };
            request.get(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body.message);
                }
                else {
                    var modelId = body.ids[0];
                    userState[Consts_1.UserStates.MODEL] = modelId;
                    resolve(modelId);
                }
            });
        });
    };
    BlisClient.prototype.GetTrainDialog = function (userState, dialogId) {
        var _this = this;
        var apiPath = "app/" + userState[Consts_1.UserStates.APP] + "/traindialog/" + dialogId;
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                }
            };
            request.get(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(JSON.parse(body).message);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    // TODO obsolete
    BlisClient.prototype.GetTrainDialogs = function (userState) {
        var _this = this;
        var apiPath = "app/" + userState[Consts_1.UserStates.APP] + "/traindialog";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                }
            };
            request.get(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(JSON.parse(body).message);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    BlisClient.prototype.StartSession = function (userState, inTeach, saveDialog) {
        var _this = this;
        if (inTeach === void 0) { inTeach = false; }
        if (saveDialog === void 0) { saveDialog = false; }
        var apiPath = "app/" + userState[Consts_1.UserStates.APP] + "/session2";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: {
                    Teach: inTeach,
                    Save_To_Log: saveDialog
                },
                json: true
            };
            request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body.message);
                }
                else {
                    var sessionId = body.id;
                    userState[Consts_1.UserStates.SESSION] = sessionId;
                    userState[Consts_1.UserStates.TEACH] = inTeach;
                    userState[Consts_1.UserStates.MEMORY] = {};
                    resolve(sessionId);
                }
            });
        });
    };
    // TODO:  decice what to do with fromScratch
    BlisClient.prototype.TrainModel = function (userState, fromScratch) {
        var _this = this;
        if (fromScratch === void 0) { fromScratch = false; }
        // Clear existing modelId TODO - depends on if fromScratch
        userState[Consts_1.UserStates.MODEL] = null;
        var apiPath = "app/" + userState[Consts_1.UserStates.APP] + "/model";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: {
                    from_scratch: fromScratch
                },
                json: true
            };
            request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(JSON.parse(body).message);
                }
                else {
                    var modelId = body.id;
                    userState[Consts_1.UserStates.MODEL] = modelId;
                    resolve(modelId);
                }
            });
        });
    };
    BlisClient.prototype.DefaultLUCallback = function (text, entities) {
        return new TakeTurnRequest_1.TakeTurnRequest(); // TODO
    };
    BlisClient.prototype.TakeTurn = function (userState, payload, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            var response, response, response, expectedNextModes, requestBody;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Error checking
                        if (userState[Consts_1.UserStates.APP] == null) {
                            response = this.ErrorResponse("No Application has been loaded.\n\nTry _!createapp_, _!loadapp_ or _!help_ for more info.");
                            cb(response);
                            return [2 /*return*/];
                        }
                        else if (!userState[Consts_1.UserStates.MODEL] && !userState[Consts_1.UserStates.TEACH]) {
                            response = this.ErrorResponse("This application needs to be trained first.\n\nTry _!teach, _!traindialogs_ or _!help_ for more info.");
                            cb(response);
                            return [2 /*return*/];
                        }
                        else if (!userState[Consts_1.UserStates.SESSION]) {
                            response = this.ErrorResponse("Start the bot first with _!start_ or train more with _!teach_.");
                            cb(response);
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
                        return [4 /*yield*/, this.SendTurnRequest(userState, requestBody)
                                .then(function (takeTurnResponse) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                var response, takeTurnRequest, memory, action, apiString, _a, apiName, arg, api, memory, takeTurnRequest, response_1;
                                return tslib_1.__generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            BlisDebug_1.BlisDebug.LogObject(takeTurnResponse);
                                            // Check that expected mode matches
                                            if (!takeTurnResponse.mode || expectedNextModes.indexOf(takeTurnResponse.mode) < 0) {
                                                response = new TakeTurnResponse_1.TakeTurnResponse({ mode: Consts_1.TakeTurnModes.ERROR, error: "Unexpected mode " + takeTurnResponse.mode });
                                                cb(response);
                                            }
                                            if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.CALLBACK)) return [3 /*break*/, 2];
                                            takeTurnRequest = void 0;
                                            memory = new BlisMemory_1.BlisMemory(userState);
                                            if (this.luisCallback) {
                                                takeTurnRequest = this.luisCallback(takeTurnResponse.originalText, takeTurnResponse.entities, memory);
                                            }
                                            else {
                                                takeTurnRequest = this.DefaultLUCallback(takeTurnResponse.originalText, takeTurnResponse.entities);
                                            }
                                            return [4 /*yield*/, this.TakeTurn(userState, takeTurnRequest, cb)];
                                        case 1:
                                            _b.sent();
                                            return [3 /*break*/, 7];
                                        case 2:
                                            if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.TEACH)) return [3 /*break*/, 3];
                                            cb(takeTurnResponse);
                                            return [3 /*break*/, 7];
                                        case 3:
                                            if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.ACTION)) return [3 /*break*/, 7];
                                            action = takeTurnResponse.actions[0];
                                            if (!(action.actionType == Consts_1.ActionTypes.TEXT)) return [3 /*break*/, 4];
                                            cb(takeTurnResponse);
                                            return [3 /*break*/, 7];
                                        case 4:
                                            if (!(action.actionType == Consts_1.ActionTypes.API)) return [3 /*break*/, 7];
                                            apiString = action.content;
                                            _a = apiString.split(' '), apiName = _a[0], arg = _a[1];
                                            api = this.intApiCallbacks[apiName];
                                            // Then check user defined APIs
                                            if (!api && this.apiCallbacks) {
                                                api = this.apiCallbacks[apiName];
                                            }
                                            if (!api) return [3 /*break*/, 6];
                                            memory = new BlisMemory_1.BlisMemory(userState);
                                            takeTurnRequest = api(memory, arg);
                                            expectedNextModes = [Consts_1.TakeTurnModes.ACTION, Consts_1.TakeTurnModes.TEACH];
                                            return [4 /*yield*/, this.TakeTurn(userState, takeTurnRequest, cb)];
                                        case 5:
                                            _b.sent();
                                            return [3 /*break*/, 7];
                                        case 6:
                                            response_1 = this.ErrorResponse("API " + apiName + " not defined");
                                            cb(response_1);
                                            _b.label = 7;
                                        case 7: return [2 /*return*/];
                                    }
                                });
                            }); })
                                .catch(function (text) {
                                var response = _this.ErrorResponse(text);
                                cb(response);
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisClient.prototype.SendTurnRequest = function (userState, body) {
        var _this = this;
        var apiPath = "app/" + userState[Consts_1.UserStates.APP] + "/session2/" + userState[Consts_1.UserStates.SESSION];
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                json: true
            };
            requestData['body'] = body;
            request.put(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body.message);
                }
                else {
                    if (typeof body === "string") {
                        body = JSON.parse(body);
                    }
                    var ttresponse = json_typescript_mapper_1.deserialize(TakeTurnResponse_1.TakeTurnResponse, body);
                    resolve(ttresponse);
                }
            });
        });
    };
    BlisClient.prototype.ErrorResponse = function (text) {
        return new TakeTurnResponse_1.TakeTurnResponse({ mode: Consts_1.TakeTurnModes.ERROR, error: text });
    };
    //====================================================
    // Built in API GetActions
    //====================================================
    BlisClient.prototype.SaveLastCB = function (memory, arg) {
        var lastInput = memory.GetLastInput();
        arg = arg.replace('$', '');
        memory.Remember(arg, lastInput);
        var entityIds = memory.RememberedIds();
        return new TakeTurnRequest_1.TakeTurnRequest({ entities: entityIds });
    };
    return BlisClient;
}());
exports.BlisClient = BlisClient;
//# sourceMappingURL=BlisClient.js.map