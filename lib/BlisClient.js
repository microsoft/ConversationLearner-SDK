"use strict";
var request = require('request');
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Credentials_1 = require("./Http/Credentials");
var Action_1 = require("./Model/Action");
var BlisApp_1 = require("./Model/BlisApp");
var Entity_1 = require("./Model/Entity");
var Consts_1 = require("./Model/Consts");
var TakeTurnResponse_1 = require("./Model/TakeTurnResponse");
var BlisDebug_1 = require("./BlisDebug");
var NodeCache = require("node-cache");
var BlisClient = (function () {
    function BlisClient(serviceUri, user, secret) {
        this.actionCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });
        this.entityCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });
        if (!serviceUri) {
            BlisDebug_1.BlisDebug.Log("service URI is required");
        }
        this.serviceUri = serviceUri;
        this.credentials = new Credentials_1.Credentials(user, secret);
    }
    // TODO: switch remaining to not userstate
    BlisClient.prototype.AddAction = function (appId, content, actionType, requiredEntityList, negativeEntityList, prebuiltEntityName) {
        var _this = this;
        if (requiredEntityList === void 0) { requiredEntityList = []; }
        if (negativeEntityList === void 0) { negativeEntityList = []; }
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
                    reject(body);
                }
                else {
                    resolve(body.id);
                }
            });
        });
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
                    reject(body);
                }
                else {
                    var appId = body.id;
                    resolve(appId);
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
    BlisClient.prototype.DeleteEntity = function (appId, entityId) {
        var _this = this;
        var apiPath = "app/" + appId + "/entity/" + entityId;
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
    BlisClient.prototype.DeleteTrainDialog = function (appId, dialogId) {
        var _this = this;
        var apiPath = "app/" + appId + "/traindialog/" + dialogId;
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                json: true
            };
            request.delete(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    BlisClient.prototype.EndSession = function (appId, sessionId) {
        var _this = this;
        BlisDebug_1.BlisDebug.Log("Deleting existing session " + sessionId);
        var apiPath = "app/" + appId + "/session2/" + sessionId;
        return new Promise(function (resolve, reject) {
            if (!sessionId) {
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
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient.prototype.ExportApp = function (appId) {
        var _this = this;
        var apiPath = "app/" + appId + "/source";
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
                    reject(body);
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
    BlisClient.prototype.GetAction = function (appId, actionId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // Check cache first
            var action = _this.actionCache.get(actionId);
            if (action) {
                resolve(action);
                return;
            }
            // Call API
            var apiPath = "app/" + appId + "/action/" + actionId;
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
                    reject(body);
                }
                else {
                    var action = json_typescript_mapper_1.deserialize(Action_1.Action, body);
                    _this.actionCache.set(actionId, action);
                    resolve(action);
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
    BlisClient.prototype.GetEntity = function (appId, entityId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // Check cache first
            var entity = _this.entityCache.get(entityId);
            if (entity) {
                resolve(entity);
                return;
            }
            // Call API
            var apiPath = "app/" + appId + "/entity/" + entityId;
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
                    reject(body);
                }
                else {
                    var entity = json_typescript_mapper_1.deserialize(Entity_1.Entity, body);
                    _this.entityCache.set(entityId, entity);
                    resolve(entity);
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
                    reject(JSON.parse(body).message);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    BlisClient.prototype.GetModel = function (appId) {
        var _this = this;
        var apiPath = "app/" + appId + "/model";
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
                    reject(body);
                }
                else {
                    var modelId = body.ids[0];
                    resolve(modelId);
                }
            });
        });
    };
    BlisClient.prototype.GetTrainDialog = function (appId, dialogId) {
        var _this = this;
        var apiPath = "app/" + appId + "/traindialog/" + dialogId;
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
    BlisClient.prototype.GetTrainDialogs = function (appId) {
        var _this = this;
        var apiPath = "app/" + appId + "/traindialog";
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
    BlisClient.prototype.ImportApp = function (appId, blisApp) {
        var _this = this;
        var apiPath = "app/" + appId + "/source";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                json: true,
                body: json_typescript_mapper_1.serialize(blisApp)
            };
            request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body);
                }
                else {
                    var blisApp = json_typescript_mapper_1.deserialize(BlisApp_1.BlisApp, body);
                    resolve(blisApp);
                }
            });
        });
    };
    BlisClient.prototype.Retrain = function (appId, sessionId) {
        var _this = this;
        var apiPath = "app/" + appId + "/session2/" + sessionId + "/retrain";
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
    BlisClient.prototype.StartSession = function (appId, inTeach, saveDialog) {
        var _this = this;
        if (inTeach === void 0) { inTeach = false; }
        if (saveDialog === void 0) { saveDialog = false; }
        var apiPath = "app/" + appId + "/session2";
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
                    reject(body);
                }
                else {
                    var sessionId = body.id;
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
                    reject(body);
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
    return BlisClient;
}());
exports.BlisClient = BlisClient;
//# sourceMappingURL=BlisClient.js.map