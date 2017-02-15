"use strict";
var tslib_1 = require("tslib");
var request = require('request');
var util = require('util');
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Credentials_1 = require("./Http/Credentials");
var TakeTurnResponse_1 = require("./Model/TakeTurnResponse");
var TakeTurnRequest_1 = require("./Model/TakeTurnRequest");
var ErrorHandler_1 = require("./Model/ErrorHandler");
var BlisClient = (function () {
    function BlisClient(serviceUri, user, secret) {
        if (!serviceUri)
            ErrorHandler_1.HandleError("service Uri is required");
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
                    'Cookie': _this.credentials.CookieString(),
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
                    reject(body);
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
                    'Cookie': _this.credentials.CookieString()
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
                    reject(body);
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
                    'Cookie': _this.credentials.CookieString()
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
                    'Cookie': _this.credentials.CookieString()
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
                    reject(body);
                }
                else {
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient.prototype.AddAction = function (appId, content, requiredEntityList, negativeEntityList, prebuiltEntityName) {
        var _this = this;
        var apiPath = "app/" + appId + "/action";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.CookieString()
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
                    reject(body);
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
                    'Cookie': _this.credentials.CookieString()
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
                    reject(body);
                }
                else {
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient.prototype.TakeTurn = function (appId, sessionId, text, luCallback, apiCallbacks, resultCallback) {
        if (apiCallbacks === void 0) { apiCallbacks = {}; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var takeTurnRequest, expectedNextModes, takeTurnResponse, apiName;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        takeTurnRequest = new TakeTurnRequest_1.TakeTurnRequest({ text: text });
                        expectedNextModes = [TakeTurnResponse_1.TakeTurnModes.Callback, TakeTurnResponse_1.TakeTurnModes.Action, TakeTurnResponse_1.TakeTurnModes.Teach];
                        _a.label = 1;
                    case 1:
                        if (!true) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.TakeATurn(appId, sessionId, takeTurnRequest)];
                    case 2:
                        takeTurnResponse = _a.sent();
                        ErrorHandler_1.Debug(takeTurnResponse);
                        if (expectedNextModes.indexOf(takeTurnResponse.mode) < 0) {
                            ErrorHandler_1.HandleError("Unexpected mode " + takeTurnResponse.mode);
                        }
                        if (takeTurnResponse.mode) {
                            // LU CALLBACK
                            if (takeTurnResponse.mode == TakeTurnResponse_1.TakeTurnModes.Callback) {
                                if (luCallback) {
                                    takeTurnRequest = luCallback(takeTurnResponse.originalText, takeTurnResponse.entities);
                                }
                                else {
                                    takeTurnRequest = new TakeTurnRequest_1.TakeTurnRequest(); // TODO
                                }
                                expectedNextModes = [TakeTurnResponse_1.TakeTurnModes.Action, TakeTurnResponse_1.TakeTurnModes.Teach];
                            }
                            else if (takeTurnResponse.mode == TakeTurnResponse_1.TakeTurnModes.Teach) {
                                return [2 /*return*/, resultCallback(takeTurnResponse)];
                            }
                            else if (takeTurnResponse.mode == TakeTurnResponse_1.TakeTurnModes.Action) {
                                if (takeTurnResponse.actions[0].actionType == TakeTurnResponse_1.ActionTypes.Text) {
                                    return [2 /*return*/, resultCallback(takeTurnResponse)];
                                }
                                else if (takeTurnResponse.actions[0].actionType == TakeTurnResponse_1.ActionTypes.API) {
                                    apiName = takeTurnResponse.actions[0].content;
                                    if (apiCallbacks[apiName]) {
                                        // TODO handle apli callback
                                        /*
                                        takeTurnResponse = apiCallbacks[apiName]();
                                        req_json = {
                                            'entities': entities,
                                            'context': context,
                                            'action_mask': action_mask,
                                        }
                                        expected_next_modes = ['teach','action']
                                        */
                                        expectedNextModes = [TakeTurnResponse_1.TakeTurnModes.Action, TakeTurnResponse_1.TakeTurnModes.Teach];
                                    }
                                    else {
                                        ErrorHandler_1.HandleError("API " + apiName + " not defined");
                                    }
                                }
                            }
                        }
                        else {
                            ErrorHandler_1.HandleError("mode ${response.mode} not supported by the SDK.");
                        }
                        return [3 /*break*/, 1];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    BlisClient.prototype.TakeATurn = function (appId, sessionId, takeTurnRequest) {
        var _this = this;
        var apiPath = "app/" + appId + "/session2/" + sessionId;
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.CookieString()
                },
                json: true
            };
            requestData['body'] = takeTurnRequest.ToJSON();
            request.put(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body);
                }
                else {
                    // API hands back with one action or a list of actions
                    /*  if (body.action) {
                          body.actions = new Array<Action>(body.action);
                          body.action = null;
                      }*/
                    var ttresponse = json_typescript_mapper_1.deserialize(TakeTurnResponse_1.TakeTurnResponse, body);
                    //var ttresponse = new TakeTurnResponse(body['orig-text'], body.entities, body.mode, body.actions);
                    resolve(ttresponse);
                }
            });
        });
    };
    return BlisClient;
}());
exports.BlisClient = BlisClient;
//# sourceMappingURL=client.js.map