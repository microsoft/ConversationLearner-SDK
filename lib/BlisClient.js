"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require('request');
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Credentials_1 = require("./Http/Credentials");
var Action_1 = require("./Model/Action");
var BlisApp_1 = require("./Model/BlisApp");
var BlisAppContent_1 = require("./Model/BlisAppContent");
var Entity_1 = require("./Model/Entity");
var TakeTurnResponse_1 = require("./Model/TakeTurnResponse");
var BlisDebug_1 = require("./BlisDebug");
var NodeCache = require("node-cache");
var BlisClient = (function () {
    function BlisClient(serviceUri, user, secret, azureFunctionsUrl) {
        this.actionCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });
        this.entityCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });
        this.exportCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });
        if (!serviceUri) {
            BlisDebug_1.BlisDebug.Log("service URI is required");
        }
        this.serviceUri = serviceUri;
        this.credentials = new Credentials_1.Credentials(user, secret);
        this.azureFunctionsUrl = azureFunctionsUrl;
    }
    BlisClient.prototype.ClearExportCache = function (appId) {
        this.exportCache.del(appId);
    };
    // TODO: switch remaining to not userstate
    BlisClient.prototype.AddAction = function (appId, content, actionType, sequenceTerminal, requiredEntityList, negativeEntityList, prebuiltEntityName, metaData) {
        var _this = this;
        if (requiredEntityList === void 0) { requiredEntityList = []; }
        if (negativeEntityList === void 0) { negativeEntityList = []; }
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
                    action_type: actionType,
                    sequence_terminal: sequenceTerminal,
                    metadata: metaData
                },
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("POST", apiPath, requestData);
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
    BlisClient.prototype.AddEntity = function (appId, entityName, entityType, prebuiltEntityName, metaData) {
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
                    LUISPreName: prebuiltEntityName,
                    metadata: metaData
                },
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("POST", apiPath, requestData);
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
            BlisDebug_1.BlisDebug.LogRequest("POST", apiPath, requestData);
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
            BlisDebug_1.BlisDebug.LogRequest("DELETE", apiPath, requestData);
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
    BlisClient.prototype.DeleteApp = function (activeAppId, appId) {
        var _this = this;
        // If not appId sent use active app
        var activeApp = false;
        if (appId == activeAppId) {
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
            BlisDebug_1.BlisDebug.LogRequest("DELETE", apiPath, requestData);
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
            BlisDebug_1.BlisDebug.LogRequest("DELETE", apiPath, requestData);
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
            BlisDebug_1.BlisDebug.LogRequest("DELETE", apiPath, requestData);
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
    BlisClient.prototype.EditAction = function (appId, actionId, content, actionType, sequenceTerminal, requiredEntityList, negativeEntityList, prebuiltEntityName) {
        var _this = this;
        if (requiredEntityList === void 0) { requiredEntityList = []; }
        if (negativeEntityList === void 0) { negativeEntityList = []; }
        if (prebuiltEntityName === void 0) { prebuiltEntityName = null; }
        var apiPath = "app/" + appId + "/action/" + actionId;
        // Clear old one from cache
        this.actionCache.del(actionId);
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
                    //action_type: actionType
                    sequence_terminal: sequenceTerminal,
                },
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("PUT", apiPath, requestData);
            request.put(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body);
                }
                else {
                    // Service returns a 204
                    resolve(body);
                }
            });
        });
    };
    BlisClient.prototype.EditEntity = function (appId, entityId, entityName, entityType, prebuiltEntityName, metaData) {
        var _this = this;
        var apiPath = "app/" + appId + "/entity/" + entityId;
        // Clear old one from cache
        this.entityCache.del(entityId);
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: {
                    name: entityName,
                    //    EntityType: entityType,   Immutable
                    //    LUISPreName: prebuiltEntityName,   Immutable
                    metadata: metaData
                },
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("PUT", apiPath, requestData);
            request.put(requestData, function (error, response, body) {
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
            BlisDebug_1.BlisDebug.LogRequest("DELETE", apiPath, requestData);
            request.delete(url, requestData, function (error, response, body) {
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
    BlisClient.prototype.ExportApp = function (appId) {
        var _this = this;
        var apiPath = "app/" + appId + "/source";
        return new Promise(function (resolve, reject) {
            // Check cache first
            var blisAppContent = _this.exportCache.get(appId);
            if (blisAppContent) {
                resolve(blisAppContent);
                return;
            }
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("GET", apiPath, requestData);
            request.get(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body);
                }
                else {
                    var blisAppContent_1 = json_typescript_mapper_1.deserialize(BlisAppContent_1.BlisAppContent, body);
                    _this.exportCache.set(appId, blisAppContent_1);
                    resolve(blisAppContent_1);
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
                },
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("GET", apiPath, requestData);
            request.get(url, requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body);
                }
                else {
                    var blisApp = json_typescript_mapper_1.deserialize(BlisApp_1.BlisApp, body);
                    blisApp.id = appId;
                    resolve(blisApp);
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
            BlisDebug_1.BlisDebug.LogRequest("GET", apiPath, requestData);
            request.get(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body);
                }
                else {
                    var action = json_typescript_mapper_1.deserialize(Action_1.Action, body);
                    action.id = actionId;
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
            BlisDebug_1.BlisDebug.LogRequest("GET", apiPath, requestData);
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
            BlisDebug_1.BlisDebug.LogRequest("GET", apiPath, requestData);
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
            var apiPath = "app/" + appId + "/entity/" + entityId;
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("GET", apiPath, requestData);
            request.get(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body);
                }
                else {
                    var entity = json_typescript_mapper_1.deserialize(Entity_1.Entity, body);
                    entity.id = entityId;
                    if (!entity.metadata) {
                        entity.metadata = new Entity_1.EntityMetaData();
                    }
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
            BlisDebug_1.BlisDebug.LogRequest("GET", apiPath, requestData);
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
            BlisDebug_1.BlisDebug.LogRequest("GET", apiPath, requestData);
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
            BlisDebug_1.BlisDebug.LogRequest("GET", apiPath, requestData);
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
            BlisDebug_1.BlisDebug.LogRequest("GET", apiPath, requestData);
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
    BlisClient.prototype.ImportApp = function (appId, blisAppContent) {
        var _this = this;
        var apiPath = "app/" + appId + "/source";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                json: true,
                body: json_typescript_mapper_1.serialize(blisAppContent)
            };
            BlisDebug_1.BlisDebug.LogRequest("POST", apiPath, requestData);
            request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body);
                }
                else {
                    var blisAppContent = json_typescript_mapper_1.deserialize(BlisAppContent_1.BlisAppContent, body);
                    resolve(blisAppContent);
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
            BlisDebug_1.BlisDebug.LogRequest("PUT", apiPath, requestData);
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
        if (saveDialog === void 0) { saveDialog = !inTeach; }
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
                    // Note: Never need to send modelId as will use the latest
                },
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("POST", apiPath, requestData);
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
            BlisDebug_1.BlisDebug.LogRequest("POST", apiPath, requestData);
            request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body);
                }
                else {
                    var modelId = body.id;
                    resolve(modelId);
                }
            });
        });
    };
    BlisClient.prototype.SendTurnRequest = function (appId, sessionId, body) {
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
            requestData['body'] = body;
            BlisDebug_1.BlisDebug.LogRequest("PUT", apiPath, requestData);
            request.put(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body);
                }
                else {
                    if (typeof body === "string") {
                        reject("Service returned invalid JSON\n\n" + body);
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