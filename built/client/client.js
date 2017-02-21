"use strict";
var tslib_1 = require("tslib");
var request = require('request');
var util = require('util');
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Credentials_1 = require("./Http/Credentials");
var Consts_1 = require("./Model/Consts");
var TakeTurnResponse_1 = require("./Model/TakeTurnResponse");
var TakeTurnRequest_1 = require("./Model/TakeTurnRequest");
var BlisDebug_1 = require("./BlisDebug");
var BlisClient = (function () {
    function BlisClient(serviceUri, user, secret) {
        if (!serviceUri) {
            BlisDebug_1.BlisDebug.Log("service Uri is required");
        }
        this.serviceUri = serviceUri;
        this.credentials = new Credentials_1.Credentials(user, secret);
    }
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
                    reject(body.message);
                }
                else {
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient.prototype.DeleteApp = function (appId) {
        var _this = this;
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
                    reject(body.message);
                }
                else {
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient.prototype.StartSession = function (appId, modelId, teach, saveDialog) {
        var _this = this;
        if (teach === void 0) { teach = false; }
        if (saveDialog === void 0) { saveDialog = false; }
        var apiPath = "app/" + appId + "/session2";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: {
                    Teach: teach,
                    Save_To_Log: saveDialog,
                    ModelID: modelId
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
    BlisClient.prototype.EndSession = function (appId, sessionId) {
        var _this = this;
        var apiPath = "app/" + appId + "/session2/" + sessionId;
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
                    reject(body.message);
                }
                else {
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient.prototype.AddEntity = function (appId, entityName, entityType, prebuiltEntityName) {
        var _this = this;
        var apiPath = "app/" + appId + "/entity";
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
    BlisClient.prototype.GetEntity = function (appId, entityId) {
        var _this = this;
        var apiPath = "app/" + appId + "/entity/" + entityId;
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
                    reject(body.message);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    BlisClient.prototype.GetEntities = function (appId) {
        var _this = this;
        var apiPath = "app/" + appId + "/entity";
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
                    reject(body.message);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    BlisClient.prototype.AddAction = function (appId, content, requiredEntityList, negativeEntityList, prebuiltEntityName) {
        var _this = this;
        if (requiredEntityList === void 0) { requiredEntityList = null; }
        if (negativeEntityList === void 0) { negativeEntityList = null; }
        if (prebuiltEntityName === void 0) { prebuiltEntityName = null; }
        var apiPath = "app/" + appId + "/action";
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
                    reject(body.message);
                }
                else {
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient.prototype.GetAction = function (appId, actionId) {
        var _this = this;
        var apiPath = "app/" + appId + "/entity/" + actionId;
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
                    reject(body.message);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    BlisClient.prototype.GetActions = function (appId) {
        var _this = this;
        var apiPath = "app/" + appId + "/action";
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
                    reject(body.message);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    BlisClient.prototype.DeleteAction = function (appId, actionId) {
        var _this = this;
        var apiPath = "app/" + appId + "/action/" + actionId;
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
                    reject(body.message);
                }
                else {
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient.prototype.TrainDialog = function (appId, traindialog) {
        var _this = this;
        var apiPath = "app/" + appId + "/traindialog";
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
                    reject(body.message);
                }
                else {
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient.prototype.TrainModel = function (appId, fromScratch) {
        var _this = this;
        if (fromScratch === void 0) { fromScratch = false; }
        var apiPath = "app/" + appId + "/model";
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
                    reject(body.message);
                }
                else {
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient.prototype.DefaultLUCallback = function (text, entities) {
        return new TakeTurnRequest_1.TakeTurnRequest({ text: text, entities: entities });
    };
    BlisClient.prototype.TakeTurn = function (appId, sessionId, text, luCallback, apiCallbacks, resultCallback, takeTurnRequest, expectedNextModes) {
        if (takeTurnRequest === void 0) { takeTurnRequest = new TakeTurnRequest_1.TakeTurnRequest({ text: text }); }
        if (expectedNextModes === void 0) { expectedNextModes = [Consts_1.TakeTurnModes.Callback, Consts_1.TakeTurnModes.Action, Consts_1.TakeTurnModes.Teach]; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.SendTurnRequest(appId, sessionId, takeTurnRequest)
                            .then(function (takeTurnResponse) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var response, apiName, response, response, response;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        BlisDebug_1.BlisDebug.Log(takeTurnResponse);
                                        if (expectedNextModes.indexOf(takeTurnResponse.mode) < 0) {
                                            response = new TakeTurnResponse_1.TakeTurnResponse({ mode: Consts_1.TakeTurnModes.Error, error: "Unexpected mode " + takeTurnResponse.mode });
                                            resultCallback(response);
                                        }
                                        if (!takeTurnResponse.mode) return [3 /*break*/, 10];
                                        if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.Callback)) return [3 /*break*/, 2];
                                        if (luCallback) {
                                            takeTurnRequest = luCallback(takeTurnResponse.originalText, takeTurnResponse.entities);
                                        }
                                        else {
                                            takeTurnRequest = this.DefaultLUCallback(takeTurnResponse.originalText, takeTurnResponse.entities);
                                        }
                                        expectedNextModes = [Consts_1.TakeTurnModes.Action, Consts_1.TakeTurnModes.Teach];
                                        return [4 /*yield*/, this.TakeTurn(appId, sessionId, text, luCallback, apiCallbacks, resultCallback, takeTurnRequest, expectedNextModes)];
                                    case 1:
                                        _a.sent();
                                        return [3 /*break*/, 9];
                                    case 2:
                                        if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.Teach)) return [3 /*break*/, 3];
                                        resultCallback(takeTurnResponse);
                                        return [3 /*break*/, 9];
                                    case 3:
                                        if (!(takeTurnResponse.mode == Consts_1.TakeTurnModes.Action)) return [3 /*break*/, 8];
                                        if (!(takeTurnResponse.actions[0].actionType == Consts_1.ActionTypes.Text)) return [3 /*break*/, 4];
                                        resultCallback(takeTurnResponse);
                                        return [3 /*break*/, 7];
                                    case 4:
                                        if (!(takeTurnResponse.actions[0].actionType == Consts_1.ActionTypes.API)) return [3 /*break*/, 7];
                                        apiName = takeTurnResponse.actions[0].content;
                                        if (!apiCallbacks[apiName]) return [3 /*break*/, 6];
                                        takeTurnRequest = apiCallbacks[apiName]();
                                        expectedNextModes = [Consts_1.TakeTurnModes.Action, Consts_1.TakeTurnModes.Teach];
                                        return [4 /*yield*/, this.TakeTurn(appId, sessionId, text, luCallback, apiCallbacks, resultCallback, takeTurnRequest, expectedNextModes)];
                                    case 5:
                                        _a.sent();
                                        return [3 /*break*/, 7];
                                    case 6:
                                        response = new TakeTurnResponse_1.TakeTurnResponse({ mode: Consts_1.TakeTurnModes.Error, error: "API " + apiName + " not defined" });
                                        resultCallback(response);
                                        _a.label = 7;
                                    case 7: return [3 /*break*/, 9];
                                    case 8:
                                        response = new TakeTurnResponse_1.TakeTurnResponse({ mode: Consts_1.TakeTurnModes.Error, error: "mode " + response.mode + " not supported by the SDK" });
                                        resultCallback(response);
                                        _a.label = 9;
                                    case 9: return [3 /*break*/, 11];
                                    case 10:
                                        response = new TakeTurnResponse_1.TakeTurnResponse({ mode: Consts_1.TakeTurnModes.Error, error: "TakeTurnResponse has no mode" });
                                        resultCallback(response);
                                        _a.label = 11;
                                    case 11: return [2 /*return*/];
                                }
                            });
                        }); })
                            .catch(function (text) {
                            var response = new TakeTurnResponse_1.TakeTurnResponse({ mode: Consts_1.TakeTurnModes.Error, error: text });
                            resultCallback(response);
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisClient.prototype.SendTurnRequest = function (appId, sessionId, takeTurnRequest) {
        var _this = this;
        var apiPath = "app/" + appId + "/session2/" + sessionId;
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                json: true
            };
            requestData['body'] = takeTurnRequest.ToJSON();
            request.put(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body.message);
                }
                else {
                    var ttresponse = json_typescript_mapper_1.deserialize(TakeTurnResponse_1.TakeTurnResponse, body);
                    resolve(ttresponse);
                }
            });
        });
    };
    return BlisClient;
}());
exports.BlisClient = BlisClient;
//# sourceMappingURL=client.js.map