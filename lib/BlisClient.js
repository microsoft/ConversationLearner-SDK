"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require('request');
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Credentials_1 = require("./Http/Credentials");
var Action_1 = require("./Model/Action");
var TrainDialog_1 = require("./Model/TrainDialog");
var LogDialog_1 = require("./Model/LogDialog");
var BlisApp_1 = require("./Model/BlisApp");
var BlisAppContent_1 = require("./Model/BlisAppContent");
var Entity_1 = require("./Model/Entity");
var TakeTurnResponse_1 = require("./Model/TakeTurnResponse");
var BlisDebug_1 = require("./BlisDebug");
var NodeCache = require("node-cache");
var BlisClient = (function () {
    function BlisClient(serviceUri, user, secret, azureFunctionsUrl, azureFunctionsKey) {
        this.user = user;
        this.actionCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });
        this.entityCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });
        this.exportCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });
        if (!serviceUri) {
            BlisDebug_1.BlisDebug.Log("service URI is required");
        }
        this.serviceUri = serviceUri;
        this.credentials = new Credentials_1.Credentials(user, secret);
        this.azureFunctionsUrl = azureFunctionsUrl;
        this.azureFunctionsKey = azureFunctionsKey;
    }
    // Create singleton
    BlisClient.Init = function (serviceUri, user, secret, azureFunctionsUrl, azureFunctionsKey) {
        this.client = new BlisClient(serviceUri, user, secret, azureFunctionsUrl, azureFunctionsKey);
    };
    BlisClient.prototype.MakeURL = function (apiPath) {
        return this.serviceUri + apiPath + ("?userId=" + this.user);
    };
    BlisClient.prototype.ClearExportCache = function (appId) {
        this.exportCache.del(appId);
    };
    //==============================================================================
    // Action
    //=============================================================================
    /** Retrieves information about a specific action for the current package
     *  (or the specified package if provided) */
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
                url: _this.MakeURL(apiPath),
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
                    reject(response);
                }
                else {
                    var action = json_typescript_mapper_1.deserialize(Action_1.Action, body);
                    action.actionId = actionId;
                    _this.actionCache.set(actionId, action);
                    resolve(action);
                }
            });
        });
    };
    /** Retrieves definitions of ALL actions for the current package
     * (or the specified package if provided). To retrieve just the
     * IDs of actions, see the GetActionIds Method */
    BlisClient.prototype.GetActions = function (appId) {
        var _this = this;
        var apiPath = "app/" + appId + "/actions";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
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
                    reject(response);
                }
                else {
                    var actions = json_typescript_mapper_1.deserialize(Action_1.ActionList, body);
                    resolve(actions);
                }
            });
        });
    };
    /** Retrieves a list of action IDs for the latest package
     * (or the specified package, if provided).  To retrieve
     * the definitions of many actions, see the GetAction method */
    BlisClient.prototype.GetActionIds = function (appId) {
        var _this = this;
        var apiPath = "app/" + appId + "/action";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
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
                    reject(response);
                }
                else {
                    var actions = json_typescript_mapper_1.deserialize(Action_1.ActionIdList, body);
                    resolve(actions);
                }
            });
        });
    };
    /** Updates payload and/or metadata on an existing action */
    BlisClient.prototype.EditAction = function (appId, action) {
        var _this = this;
        var apiPath = "app/" + appId + "/action/" + action.actionId;
        // Clear old one from cache
        this.actionCache.del(action.actionId);
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: json_typescript_mapper_1.serialize(action),
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("PUT", apiPath, requestData);
            request.put(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response);
                }
                else {
                    // Service returns a 204
                    resolve(body);
                }
            });
        });
    };
    /** Marks an action as deleted */
    BlisClient.prototype.DeleteAction = function (appId, actionId) {
        var _this = this;
        var apiPath = "app/" + appId + "/action/" + actionId;
        return new Promise(function (resolve, reject) {
            var url = _this.MakeURL(apiPath);
            var requestData = {
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("DELETE", apiPath, requestData);
            request.delete(url, requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    /** Create a new action */
    BlisClient.prototype.AddAction = function (appId, action) {
        var _this = this;
        var apiPath = "app/" + appId + "/action";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: json_typescript_mapper_1.serialize(action),
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("POST", apiPath, requestData);
            request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response);
                }
                else {
                    resolve(body.actionId);
                }
            });
        });
    };
    //==============================================================================
    // App
    //=============================================================================
    /** Retrieve information about a specific application
     * If the app ID isn't found in the set of (non-archived) apps,
     * returns 404 error ("not found")
     */
    BlisClient.prototype.GetApp = function (appId) {
        var _this = this;
        var apiPath = "app/" + appId + "?userId=" + this.user;
        return new Promise(function (resolve, reject) {
            var url = _this.MakeURL(apiPath);
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
                    reject(response);
                }
                else {
                    var blisApp = json_typescript_mapper_1.deserialize(BlisApp_1.BlisApp, body);
                    blisApp.appId = appId;
                    resolve(blisApp);
                }
            });
        });
    };
    /** Retrieve a list of (active) applications */
    BlisClient.prototype.GetApps = function () {
        var _this = this;
        var apiPath = "apps";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
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
                    reject(response);
                }
                else {
                    var apps = json_typescript_mapper_1.deserialize(BlisApp_1.BlisAppList, body);
                    resolve(apps);
                }
            });
        });
    };
    /** Rename an existing application or changes its LUIS key
     * Note: Renaming an application does not affect packages
     */
    BlisClient.prototype.EditApp = function (app) {
        var _this = this;
        var apiPath = "app/" + app.appId;
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: json_typescript_mapper_1.serialize(app),
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("PUT", apiPath, requestData);
            request.put(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response);
                }
                else {
                    // Service returns a 204
                    resolve(body);
                }
            });
        });
    };
    /** Archive an existing application
     * Note: "deleting" an application doesn't destroy it, but rather archives
     * it for a period (eg 30 days).  During the archive period, the application
     * can be restored with the next API call.  At the end of the archive period,
     * the application is destroyed.
     */
    BlisClient.prototype.DeleteApp = function (appId) {
        var _this = this;
        var apiPath = "app/" + appId;
        return new Promise(function (resolve, reject) {
            var url = _this.MakeURL(apiPath);
            var requestData = {
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("DELETE", apiPath, requestData);
            request.delete(url, requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    /** Create a new application
     */
    BlisClient.prototype.AddApp = function (blisApp) {
        var _this = this;
        var apiPath = "app";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
                headers: {
                    'Cookie': _this.credentials.Cookiestring(),
                },
                body: json_typescript_mapper_1.serialize(blisApp),
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("POST", apiPath, requestData);
            request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response);
                }
                else {
                    var appId = body.appId;
                    resolve(appId);
                }
            });
        });
    };
    //==============================================================================
    // Entity
    //=============================================================================
    /** Retrieves information about a specific entity in the latest package
     * (or the specified package, if provided) */
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
                url: _this.MakeURL(apiPath),
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
                    reject(response);
                }
                else {
                    var entity_1 = json_typescript_mapper_1.deserialize(Entity_1.Entity, body);
                    entity_1.entityId = entityId;
                    if (!entity_1.metadata) {
                        entity_1.metadata = new Entity_1.EntityMetaData();
                    }
                    _this.entityCache.set(entityId, entity_1);
                    resolve(entity_1);
                }
            });
        });
    };
    /** Retrieves definitions of ALL entities in the latest package
     * (or the specified package, if provided).  To retrieve just the IDs
     * of all entities, see the GetEntityIds method */
    BlisClient.prototype.GetEntities = function (appId) {
        var _this = this;
        var apiPath = "app/" + appId + "/entities";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
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
                    reject(response);
                }
                else {
                    var entities = json_typescript_mapper_1.deserialize(Entity_1.EntityList, body);
                    resolve(entities);
                }
            });
        });
    };
    /** Retrieves a list of entity IDs for the latest package
     * (or the specified package, if provided).  To retrieve the definitions
     * of many entities, see the GetEntities method */
    BlisClient.prototype.GetEntityIds = function (appId) {
        var _this = this;
        var apiPath = "app/" + appId + "/entity";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
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
                    reject(response);
                }
                else {
                    var entityIds = json_typescript_mapper_1.deserialize(Entity_1.EntityIdList, body);
                    resolve(entityIds);
                }
            });
        });
    };
    /** Updates name and/or metadata on an existing entity */
    BlisClient.prototype.EditEntity = function (appId, entity) {
        var _this = this;
        var apiPath = "app/" + appId + "/entity/" + entity.entityId;
        // Clear old one from cache
        this.entityCache.del(entity.entityId);
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: json_typescript_mapper_1.serialize(entity),
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("PUT", apiPath, requestData);
            request.put(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    /** Deletes an entity */
    BlisClient.prototype.DeleteEntity = function (appId, entityId) {
        var _this = this;
        var apiPath = "app/" + appId + "/entity/" + entityId;
        return new Promise(function (resolve, reject) {
            var url = _this.MakeURL(apiPath);
            var requestData = {
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("DELETE", apiPath, requestData);
            request.delete(url, requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    /** Create a new entity */
    BlisClient.prototype.AddEntity = function (appId, entity) {
        var _this = this;
        var apiPath = "app/" + appId + "/entity";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: json_typescript_mapper_1.serialize(entity),
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("POST", apiPath, requestData);
            request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response);
                }
                else {
                    resolve(body.entityId);
                }
            });
        });
    };
    //=============================================================================
    // Log Dialogs
    //=============================================================================
    /** Retrieves information about a specific logDialog */
    BlisClient.prototype.GetLogDialog = function (appId, logDialogId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var apiPath = "app/" + appId + "/logdialog/" + logdialogId;
            var requestData = {
                url: _this.MakeURL(apiPath),
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
                    reject(response);
                }
                else {
                    var logDialog = json_typescript_mapper_1.deserialize(LogDialog_1.LogDialog, body);
                    logDialog.logDialogId = logdialogId;
                    resolve(logDialog);
                }
            });
        });
    };
    /** Retrieves the contents of many/all logDialogs.
     * To retrieve just a list of IDs of all logDialogs,
     * see the GET GetLogDialogIds method. */
    BlisClient.prototype.GetLogDialogs = function (appId, searchTerm) {
        var _this = this;
        var apiPath = "app/" + appId + "/logdialogs";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                json: true,
                qs: { text: searchTerm }
            };
            BlisDebug_1.BlisDebug.LogRequest("GET", apiPath, requestData);
            request.get(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response);
                }
                else {
                    var logDialogList = json_typescript_mapper_1.deserialize(LogDialog_1.LogDialogList, body);
                    resolve(logDialogList);
                }
            });
        });
    };
    /** Retrieves just the IDs of logDialogs.
     * To retrieve the contents of many logDialogs, see the GetLogDialogs method. */
    BlisClient.prototype.GetLogDialogIds = function (appId) {
        var _this = this;
        var apiPath = "app/" + appId + "/entity";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
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
                    reject(response);
                }
                else {
                    var entityIds = json_typescript_mapper_1.deserialize(Entity_1.EntityIdList, body);
                    resolve(entityIds);
                }
            });
        });
    };
    /** Updates name and/or metadata on an existing entity */
    BlisClient.prototype.EditEntity = function (appId, entity) {
        var _this = this;
        var apiPath = "app/" + appId + "/entity/" + entity.entityId;
        // Clear old one from cache
        this.entityCache.del(entity.entityId);
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: json_typescript_mapper_1.serialize(entity),
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("PUT", apiPath, requestData);
            request.put(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    /** Deletes an entity */
    BlisClient.prototype.DeleteEntity = function (appId, entityId) {
        var _this = this;
        var apiPath = "app/" + appId + "/entity/" + entityId;
        return new Promise(function (resolve, reject) {
            var url = _this.MakeURL(apiPath);
            var requestData = {
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("DELETE", apiPath, requestData);
            request.delete(url, requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    /** Create a new entity */
    BlisClient.prototype.AddEntity = function (appId, entity) {
        var _this = this;
        var apiPath = "app/" + appId + "/entity";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: json_typescript_mapper_1.serialize(entity),
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("POST", apiPath, requestData);
            request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response);
                }
                else {
                    resolve(body.entityId);
                }
            });
        });
    };
    //=============================================================================
    // Sessions & Training
    //=============================================================================
    /** Creates a new teaching session and a corresponding trainDialog */
    BlisClient.prototype.StartTeachSession = function (appId) {
        var _this = this;
        var apiPath = "app/" + appId + "/teach";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: {},
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("POST", apiPath, requestData);
            request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    /** Creates a new session and a corresponding logDialog */
    BlisClient.prototype.StartSession = function (appId) {
        var _this = this;
        var apiPath = "app/" + appId + "/session";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: {},
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("POST", apiPath, requestData);
            request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    /** Runs entity extraction (prediction).
     * For Train sessions, if a more recent version of the package is available on
     * the server, the session will first migrate to that newer version.  This
     * doesn't affect the trainDialog maintained.
     */
    BlisClient.prototype.Extract = function (appId, sessionId, sessionType, userInput) {
        var _this = this;
        var apiPath = (sessionType == "teach") ?
            "app/" + appId + "/teach/" + sessionId + "/extractor" :
            "app/" + appId + "/session/" + sessionId + "/extractor";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: json_typescript_mapper_1.serialize(userInput),
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("PUT", apiPath, requestData);
            request.put(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    /** Uploads a labeled entity extraction instance
     * ie "commits" an entity extraction label, appending it to the teach session's
     * trainDialog, and advancing the dialog. This may yield produce a new package.
     */
    BlisClient.prototype.ExtractResponse = function (appId, teachId, extractorStep) {
        var _this = this;
        var apiPath = "app/" + appId + "/teach/" + teachId + "/extractor";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: json_typescript_mapper_1.serialize(extractorStep),
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("POST", apiPath, requestData);
            request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    /** Takes a turn.
     * For Train sessions, if a more recent version of the package is
     * available on the server, the session will first migrate to that newer version.
     * This doesn't affect the trainDialog maintained by the teaching session.
     */
    BlisClient.prototype.Score = function (appId, sessionId, sessionType, scorerInput) {
        var _this = this;
        var apiPath = (sessionType == "teach") ?
            "app/" + appId + "/teach/" + sessionId + "/scorer" :
            "app/" + appId + "/session/" + sessionId + "/scorer";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: json_typescript_mapper_1.serialize(scorerInput),
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("PUT", apiPath, requestData);
            request.put(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    /** Uploads a labeled scorer step instance
     * – ie "commits" a scorer label, appending it to the teach session's
     * trainDialog, and advancing the dialog. This may yield produce a new package.
     */
    BlisClient.prototype.ScoreResponse = function (appId, teachId, scorerResponse) {
        var _this = this;
        var apiPath = "app/" + appId + "/teach/" + teachId + "/scorer";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.MakeURL(apiPath),
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: json_typescript_mapper_1.serialize(scorerResponse),
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("POST", apiPath, requestData);
            request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    /** Ends a session.
     * For Teach sessions, does NOT delete the associated trainDialog.
     * To delete the associated trainDialog, call DELETE on the trainDialog.
     */
    BlisClient.prototype.EndSession = function (appId, sessionId, sessionType) {
        var _this = this;
        var apiPath = (sessionType == "teach") ?
            "app/" + appId + "/teach/" + sessionId :
            "app/" + appId + "/session/" + sessionId;
        return new Promise(function (resolve, reject) {
            var url = _this.MakeURL(apiPath);
            var requestData = {
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("DELETE", apiPath, requestData);
            request.delete(url, requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    return BlisClient;
}());
exports.BlisClient = BlisClient;
var BlisClient_v1 = (function () {
    function BlisClient_v1(serviceUri, user, secret, azureFunctionsUrl, azureFunctionsKey) {
        this.actionCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });
        this.entityCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });
        this.exportCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });
        if (!serviceUri) {
            BlisDebug_1.BlisDebug.Log("service URI is required");
        }
        this.serviceUri = serviceUri;
        this.credentials = new Credentials_1.Credentials(user, secret);
        this.azureFunctionsUrl = azureFunctionsUrl;
        this.azureFunctionsKey = azureFunctionsKey;
    }
    // Create singleton
    BlisClient_v1.Init = function (serviceUri, user, secret, azureFunctionsUrl, azureFunctionsKey) {
        this.client = new BlisClient_v1(serviceUri, user, secret, azureFunctionsUrl, azureFunctionsKey);
    };
    BlisClient_v1.prototype.ClearExportCache = function (appId) {
        this.exportCache.del(appId);
    };
    BlisClient_v1.prototype.AddEntity_v1 = function (appId, entityName, entityType, prebuiltEntityName, metaData) {
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
                    reject(response.statusMessage + " : " + body);
                }
                else {
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient_v1.prototype.CreateApp_v1 = function (name, luisKey) {
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
                    reject(response.statusMessage + " : " + body);
                }
                else {
                    var appId = body.id;
                    resolve(appId);
                }
            });
        });
    };
    BlisClient_v1.prototype.DeleteAction = function (appId, actionId) {
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
    BlisClient_v1.prototype.DeleteApp = function (activeAppId, appId) {
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
                    reject(response.statusMessage + " : " + body);
                }
                else {
                    resolve(body.id);
                }
            });
        });
    };
    BlisClient_v1.prototype.DeleteEntity = function (appId, entityId) {
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
    BlisClient_v1.prototype.DeleteTrainDialog = function (appId, dialogId) {
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
                    reject(response.statusMessage + " : " + body);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    BlisClient_v1.prototype.EditAction_v1 = function (appId, actionId, content, actionType, sequenceTerminal, requiredEntityList, negativeEntityList, prebuiltEntityName) {
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
                    reject(response.statusMessage + " : " + body);
                }
                else {
                    // Service returns a 204
                    resolve(body);
                }
            });
        });
    };
    BlisClient_v1.prototype.EditEntity_v1 = function (appId, entityId, entityName, entityType, prebuiltEntityName, metaData) {
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
                    reject(response.statusMessage + " : " + body);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    BlisClient_v1.prototype.EndSession = function (appId, sessionId) {
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
    BlisClient_v1.prototype.EditTrainDialog = function (appId, dialogId, trainDialog) {
        var _this = this;
        var apiPath = "app/" + appId + "/traindialog/" + dialogId;
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.serviceUri + apiPath,
                headers: {
                    'Cookie': _this.credentials.Cookiestring()
                },
                body: json_typescript_mapper_1.serialize(trainDialog.dialog),
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("PUT", apiPath, requestData);
            request.put(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response.statusMessage + " : " + body);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    BlisClient_v1.prototype.ExportApp = function (appId) {
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
                    reject(response.statusMessage + " : " + body);
                }
                else {
                    var blisAppContent_1 = json_typescript_mapper_1.deserialize(BlisAppContent_1.BlisAppContent, body);
                    _this.exportCache.set(appId, blisAppContent_1);
                    resolve(blisAppContent_1);
                }
            });
        });
    };
    BlisClient_v1.prototype.GetApp_v1 = function (appId) {
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
                    reject(response.statusMessage + " : " + body);
                }
                else {
                    var blisApp = json_typescript_mapper_1.deserialize(BlisApp_1.BlisApp_v1, body);
                    blisApp.id = appId;
                    resolve(blisApp);
                }
            });
        });
    };
    BlisClient_v1.prototype.GetAction_v1 = function (appId, actionId) {
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
                    reject(response.statusMessage + " : " + body);
                }
                else {
                    var action = json_typescript_mapper_1.deserialize(Action_1.Action_v1, body);
                    action.id = actionId;
                    _this.actionCache.set(actionId, action);
                    resolve(action);
                }
            });
        });
    };
    BlisClient_v1.prototype.GetActions_v1 = function (appId) {
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
    BlisClient_v1.prototype.GetApps = function () {
        var _this = this;
        var apiPath = "apps";
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
    BlisClient_v1.prototype.GetEntity_v1 = function (appId, entityId) {
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
                    reject(response.statusMessage + " : " + body);
                }
                else {
                    var entity = json_typescript_mapper_1.deserialize(Entity_1.Entity_v1, body);
                    entity.id = entityId;
                    if (!entity.metadata) {
                        entity.metadata = new Entity_1.EntityMetaData_v1();
                    }
                    _this.entityCache.set(entityId, entity);
                    resolve(entity);
                }
            });
        });
    };
    BlisClient_v1.prototype.GetEntities = function (appId) {
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
    BlisClient_v1.prototype.GetModel = function (appId) {
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
                    reject(response.statusMessage + " : " + body);
                }
                else {
                    var modelId = body.ids[0];
                    resolve(modelId);
                }
            });
        });
    };
    BlisClient_v1.prototype.GetTrainDialog = function (appId, dialogId) {
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
            BlisDebug_1.BlisDebug.LogRequest("GET", apiPath, requestData);
            request.get(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(response.statusMessage + " : " + body);
                }
                else {
                    var dialog = json_typescript_mapper_1.deserialize(TrainDialog_1.Dialog_v1, body);
                    var trainDialog = new TrainDialog_1.TrainDialog_v1({ dialog: dialog, id: dialogId });
                    resolve(trainDialog);
                }
            });
        });
    };
    BlisClient_v1.prototype.GetTrainDialogs = function (appId) {
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
    BlisClient_v1.prototype.ImportApp = function (appId, blisAppContent) {
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
                    reject(response.statusMessage + " : " + body);
                }
                else {
                    var blisAppContent = json_typescript_mapper_1.deserialize(BlisAppContent_1.BlisAppContent, body);
                    resolve(blisAppContent);
                }
            });
        });
    };
    BlisClient_v1.prototype.Retrain_v1 = function (appId, sessionId) {
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
                    reject(response.statusMessage + " : " + body);
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
    BlisClient_v1.prototype.StartSession = function (appId, inTeach, saveDialog) {
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
                    reject(response.statusMessage + " : " + body);
                }
                else {
                    var sessionId = body.id;
                    resolve(sessionId);
                }
            });
        });
    };
    // TODO:  decice what to do with fromScratch
    BlisClient_v1.prototype.TrainModel = function (appId, fromScratch) {
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
                    reject(response.statusMessage + " : " + body);
                }
                else {
                    var modelId = body.id;
                    resolve(modelId);
                }
            });
        });
    };
    BlisClient_v1.prototype.SendTurnRequest = function (appId, sessionId, body) {
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
                    reject(response.statusMessage + " : " + body);
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
    return BlisClient_v1;
}());
exports.BlisClient_v1 = BlisClient_v1;
//# sourceMappingURL=BlisClient.js.map