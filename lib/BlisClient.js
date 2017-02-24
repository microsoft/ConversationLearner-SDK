"use strict";
var tslib_1 = require("tslib");
var request = require('request');
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Credentials_1 = require("./Http/Credentials");
var Consts_1 = require("./Model/Consts");
var TakeTurnResponse_1 = require("./Model/TakeTurnResponse");
var TakeTurnRequest_1 = require("./Model/TakeTurnRequest");
var BlisDebug_1 = require("./BlisDebug");
var BlisClientOptions = (function () {
    function BlisClientOptions(init) {
        Object.assign(this, init);
    }
    return BlisClientOptions;
}());
exports.BlisClientOptions = BlisClientOptions;
var BlisClient = (function () {
    function BlisClient(serviceUri, user, secret) {
        this.options = new BlisClientOptions();
        if (!serviceUri) {
            BlisDebug_1.BlisDebug.Log("service URI is required");
        }
        this.serviceUri = serviceUri;
        this.credentials = new Credentials_1.Credentials(user, secret);
    }
    BlisClient.prototype.SetOptions = function (init) {
        Object.assign(this.options, init);
    };
    BlisClient.prototype.GetOption = function (key) {
        return this.options[key];
    };
    BlisClient.prototype.CreateApp = function (name, luisKey) {
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
                    reject(JSON.parse(body).message);
                }
                else {
                    var appId = body.id;
                    _this.options.appId = appId;
                    _this.options.sessionId = null;
                    _this.options.modelId = null;
                    resolve(appId);
                }
            });
        });
    };
    BlisClient.prototype.GetApp = function () {
        var _this = this;
        var apiPath = "app/" + this.options.appId;
        return new Promise(function (resolve, reject) {
            var url = _this.serviceUri + apiPath;
            var requestData = {
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                }
            };
            request.get(url, requestData, function (error, response, body) {
                if (error) {
                    _this.options.appId = null;
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    _this.options.appId = null;
                    reject(JSON.parse(body).message);
                }
                else {
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient.prototype.DeleteApp = function (appId) {
        var _this = this;
        // Delete current app if no appId provided
        if (!appId) {
            appId = this.options.appId;
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
                    reject(JSON.parse(body).message);
                }
                else {
                    var appId_1 = body.id;
                    // Did I delete my active app?
                    if (appId_1 == _this.options.appId) {
                        _this.options.appId = null;
                        _this.options.modelId = null;
                        _this.options.sessionId = null;
                    }
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient.prototype.StartSession = function (inTeach, saveDialog) {
        var _this = this;
        if (inTeach === void 0) { inTeach = false; }
        if (saveDialog === void 0) { saveDialog = false; }
        var apiPath = "app/" + this.options.appId + "/session2";
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
                    _this.options.sessionId = sessionId;
                    _this.options.inTeach = inTeach;
                    resolve(sessionId);
                }
            });
        });
    };
    BlisClient.prototype.EndSession = function () {
        var _this = this;
        BlisDebug_1.BlisDebug.Log("Deleting existing session " + this.options.sessionId);
        var apiPath = "app/" + this.options.appId + "/session2/" + this.options.sessionId;
        return new Promise(function (resolve, reject) {
            if (!_this.options.sessionId) {
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
                    _this.options.sessionId = null;
                    _this.options.inTeach = false;
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient.prototype.AddEntity = function (entityName, entityType, prebuiltEntityName) {
        var _this = this;
        var apiPath = "app/" + this.options.appId + "/entity";
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
                    reject(JSON.parse(body).message);
                }
                else {
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient.prototype.GetEntity = function (entityId) {
        var _this = this;
        var apiPath = "app/" + this.options.appId + "/entity/" + entityId;
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
    BlisClient.prototype.GetEntities = function () {
        var _this = this;
        var apiPath = "app/" + this.options.appId + "/entity";
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
    BlisClient.prototype.AddAction = function (content, requiredEntityList, negativeEntityList, prebuiltEntityName) {
        var _this = this;
        if (requiredEntityList === void 0) { requiredEntityList = null; }
        if (negativeEntityList === void 0) { negativeEntityList = null; }
        if (prebuiltEntityName === void 0) { prebuiltEntityName = null; }
        var apiPath = "app/" + this.options.appId + "/action";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: {
                    content: content,
                    RequiredEntities: requiredEntityList,
                    NegativeEntities: negativeEntityList
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
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient.prototype.GetAction = function (actionId) {
        var _this = this;
        var apiPath = "app/" + this.options.appId + "/entity/" + actionId;
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
    BlisClient.prototype.GetActions = function () {
        var _this = this;
        var apiPath = "app/" + this.options.appId + "/action";
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
    BlisClient.prototype.DeleteAction = function (actionId) {
        var _this = this;
        var apiPath = "app/" + this.options.appId + "/action/" + actionId;
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
    BlisClient.prototype.TrainDialog = function (traindialog) {
        var _this = this;
        var apiPath = "app/" + this.options.appId + "/traindialog";
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
                    _this.options.modelId = modelId;
                    resolve(modelId);
                }
            });
        });
    };
    // TODO:  decice what to do with fromScratch
    BlisClient.prototype.TrainModel = function (fromScratch) {
        var _this = this;
        if (fromScratch === void 0) { fromScratch = false; }
        // Clear existing modelId TODO - depends on if fromScratch
        this.options.modelId = null;
        var apiPath = "app/" + this.options.appId + "/model";
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
                    _this.options.modelId = modelId;
                    resolve(modelId);
                }
            });
        });
    };
    BlisClient.prototype.GetModel = function () {
        var _this = this;
        // Clear existing modelId
        this.options.modelId = null;
        var apiPath = "app/" + this.options.appId + "/model";
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
                    var modelId = body.ids[0];
                    _this.options.modelId = modelId;
                    resolve(modelId);
                }
            });
        });
    };
    BlisClient.prototype.DefaultLUCallback = function (text, entities) {
        return new TakeTurnRequest_1.TakeTurnRequest(); // TODO
    };
    BlisClient.prototype.TakeTurn = function (payload, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            var response, response, response, expectedNextModes, requestBody;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Error checking
                        if (this.options.appId == null) {
                            response = this.ErrorResponse("No Application has been loaded.\n\nTry _!createapp_, _!loadapp_ or _!help_ for more info.");
                            cb(response);
                            return [2 /*return*/];
                        }
                        else if (!this.options.modelId && !this.options.inTeach) {
                            response = this.ErrorResponse("This application needs to be trained first.\n\nTry _!train_, _!traindialogs_ or _!help_ for more info.");
                            cb(response);
                            return [2 /*return*/];
                        }
                        else if (!this.options.sessionId) {
                            response = this.ErrorResponse("Create a session first with _!next_ or _!next_ teach.");
                            cb(response);
                            return [2 /*return*/];
                        }
                        if (typeof payload == 'string') {
                            expectedNextModes = [Consts_1.TakeTurnModes.Callback, Consts_1.TakeTurnModes.Action, Consts_1.TakeTurnModes.Teach];
                            requestBody = { text: payload };
                        }
                        else {
                            expectedNextModes = [Consts_1.TakeTurnModes.Action, Consts_1.TakeTurnModes.Teach];
                            requestBody = payload.ToJSON();
                        }
                        return [4 /*yield*/, this.SendTurnRequest(requestBody)
                                .then(function (takeTurnResponse) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                var response, takeTurnRequest, apiName, takeTurnRequest, response_1;
                                return tslib_1.__generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            BlisDebug_1.BlisDebug.Log(takeTurnResponse);
                                            // Check that expected mode matches
                                            if (!takeTurnResponse.mode || expectedNextModes.indexOf(takeTurnResponse.mode) < 0) {
                                                response = new TakeTurnResponse_1.TakeTurnResponse({ mode: Consts_1.TakeTurnModes.Error, error: "Unexpected mode " + takeTurnResponse.mode });
                                                cb(response);
                                            }
                                            if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.Callback)) return [3 /*break*/, 2];
                                            takeTurnRequest = void 0;
                                            if (this.options.luisCallback) {
                                                takeTurnRequest = this.options.luisCallback(takeTurnResponse.originalText, takeTurnResponse.entities);
                                            }
                                            else {
                                                takeTurnRequest = this.DefaultLUCallback(takeTurnResponse.originalText, takeTurnResponse.entities);
                                            }
                                            return [4 /*yield*/, this.TakeTurn(takeTurnRequest, cb)];
                                        case 1:
                                            _a.sent();
                                            return [3 /*break*/, 7];
                                        case 2:
                                            if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.Teach)) return [3 /*break*/, 3];
                                            cb(takeTurnResponse);
                                            return [3 /*break*/, 7];
                                        case 3:
                                            if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.Action)) return [3 /*break*/, 7];
                                            if (!(takeTurnResponse.actions[0].actionType == Consts_1.ActionTypes.Text)) return [3 /*break*/, 4];
                                            cb(takeTurnResponse);
                                            return [3 /*break*/, 7];
                                        case 4:
                                            if (!(takeTurnResponse.actions[0].actionType == Consts_1.ActionTypes.API)) return [3 /*break*/, 7];
                                            apiName = takeTurnResponse.actions[0].content;
                                            if (!(this.options.apiCallbacks && this.options.apiCallbacks[apiName])) return [3 /*break*/, 6];
                                            takeTurnRequest = this.options.apiCallbacks[apiName]();
                                            expectedNextModes = [Consts_1.TakeTurnModes.Action, Consts_1.TakeTurnModes.Teach];
                                            return [4 /*yield*/, this.TakeTurn(takeTurnRequest, cb)];
                                        case 5:
                                            _a.sent();
                                            return [3 /*break*/, 7];
                                        case 6:
                                            response_1 = this.ErrorResponse("API " + apiName + " not defined");
                                            cb(response_1);
                                            _a.label = 7;
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
    BlisClient.prototype.SendTurnRequest = function (body) {
        var _this = this;
        var apiPath = "app/" + this.options.appId + "/session2/" + this.options.sessionId;
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
                    reject(JSON.parse(body).message);
                }
                else {
                    var ttresponse = json_typescript_mapper_1.deserialize(TakeTurnResponse_1.TakeTurnResponse, body);
                    resolve(ttresponse);
                }
            });
        });
    };
    BlisClient.prototype.ErrorResponse = function (text) {
        return new TakeTurnResponse_1.TakeTurnResponse({ mode: Consts_1.TakeTurnModes.Error, error: text });
    };
    return BlisClient;
}());
exports.BlisClient = BlisClient;
//# sourceMappingURL=BlisClient.js.map