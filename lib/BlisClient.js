"use strict";
var request = require('request');
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Credentials_1 = require("./Http/Credentials");
var Action_1 = require("./Model/Action");
var BlisApp_1 = require("./Model/BlisApp");
var Entity_1 = require("./Model/Entity");
var Consts_1 = require("./Model/Consts");
var TakeTurnResponse_1 = require("./Model/TakeTurnResponse");
var BlisUserState_1 = require("./BlisUserState");
var BlisMemory_1 = require("./BlisMemory");
var BlisDebug_1 = require("./BlisDebug");
var BlisClient = (function () {
    function BlisClient(serviceUri, user, secret) {
        if (!serviceUri) {
            BlisDebug_1.BlisDebug.Log("service URI is required");
        }
        this.serviceUri = serviceUri;
        this.credentials = new Credentials_1.Credentials(user, secret);
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
                    BlisUserState_1.BlisUserState.InitState(appId, userState);
                    resolve(appId);
                }
            });
        });
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
                    new BlisMemory_1.BlisMemory(userState).EndSession();
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
                    var blisApp = json_typescript_mapper_1.deserialize(BlisApp_1.BlisApp, body);
                    resolve(blisApp);
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
    BlisClient.prototype.GetEntity = function (userState, entityId) {
        var _this = this;
        var apiPath = "app/" + userState[Consts_1.UserStates.APP] + "/entity/" + entityId;
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
                    var entity = json_typescript_mapper_1.deserialize(Entity_1.Entity, body);
                    resolve(entity);
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
    BlisClient.prototype.ImportApp = function (userState, blisApp) {
        var _this = this;
        var apiPath = "app/" + userState[Consts_1.UserStates.APP] + "/source";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                json: true,
                body: blisApp
            };
            request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(JSON.parse(body).message);
                }
                else {
                    var blisApp = json_typescript_mapper_1.deserialize(BlisApp_1.BlisApp, body);
                    resolve(blisApp);
                }
            });
        });
    };
    BlisClient.prototype.Retrain = function (userState) {
        var _this = this;
        var apiPath = "app/" + userState[Consts_1.UserStates.APP] + "/session2/" + userState[Consts_1.UserStates.SESSION] + "/retrain";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                json: true
            };
            request.put(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body);
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
                    reject(error.message);
                }
                else if (response.statusCode >= 300) {
                    reject(body.message);
                }
                else {
                    var sessionId = body.id;
                    new BlisMemory_1.BlisMemory(userState).StartSession(sessionId, inTeach);
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
    return BlisClient;
}());
exports.BlisClient = BlisClient;
//# sourceMappingURL=BlisClient.js.map