"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var restify = require('restify');
var BlisDebug_1 = require("../BlisDebug");
var BlisClient_1 = require("../BlisClient");
var BlisDialog_1 = require("../BlisDialog");
var BlisMemory_1 = require("../BlisMemory");
var BlisApp_1 = require("../Model/BlisApp");
var Action_1 = require("../Model/Action");
var Entity_1 = require("../Model/Entity");
var blis_models_1 = require("blis-models");
var blis_models_2 = require("blis-models");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Server = (function () {
    function Server() {
    }
    // TEMP until we have an actual user
    Server.InitClient = function () {
        var user = "testuser";
        var secret = "none";
        var azureFunctionsUrl = "";
        var azureFunctionsKey = "";
        BlisClient_1.BlisClient.Init(user, secret, azureFunctionsUrl, azureFunctionsKey);
    };
    // Parse error to return appropriate error message
    Server.ErrorMessage = function (response) {
        var msg;
        if (response.body) {
            return response.body;
        }
        else {
            return Error(response.statusMessage);
        }
    };
    Server.Init = function () {
        var _this = this;
        this.server = restify.createServer();
        this.server.use(restify.bodyParser());
        this.server.use(restify.queryParser());
        //CORS
        this.server.use(restify.CORS({
            origins: ['*'],
            credentials: true,
            headers: ['*']
        }));
        this.server.listen(5000, function (err) {
            if (err) {
                BlisDebug_1.BlisDebug.Error(err);
            }
            else {
                BlisDebug_1.BlisDebug.Log(_this.server.name + " listening to " + _this.server.url);
            }
        });
        //========================================================
        // State
        //=======================================================
        /** Sets the current active application */
        this.server.put("state/app/:appId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, memory, error_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        memory = BlisMemory_1.BlisMemory.GetMemory(key);
                        return [4 /*yield*/, memory.BotState().SetAppId(appId)];
                    case 1:
                        _a.sent();
                        res.send(200);
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        res.send(error_1.statusCode, Server.ErrorMessage(error_1));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        //========================================================
        // App
        //========================================================
        /** Retrieves information about a specific application */
        this.server.get("/app/:appId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, app, error_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetApp(appId, query)];
                    case 2:
                        app = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(app));
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        res.send(error_2.statusCode, Server.ErrorMessage(error_2));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        /** Create a new application */
        this.server.post("/app", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, app, appId, error_3;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        this.InitClient(); // TEMP
                        query = req.getQuery();
                        key = req.params.key;
                        app = json_typescript_mapper_1.deserialize(BlisApp_1.BlisApp, req.body);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.AddApp(app, query)];
                    case 1:
                        appId = _a.sent();
                        res.send(appId);
                        // Initialize memory
                        return [4 /*yield*/, BlisMemory_1.BlisMemory.GetMemory(key).Init(appId)];
                    case 2:
                        // Initialize memory
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        res.send(error_3.statusCode, Server.ErrorMessage(error_3));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        /** Renames an existing application or changes its LUIS key
         * Note: Renaming an application does not affect packages */
        this.server.put("/app/:appId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, app, appId, error_4;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        query = req.getQuery();
                        key = req.params.key;
                        app = json_typescript_mapper_1.deserialize(BlisApp_1.BlisApp, req.body);
                        if (!app.appId) {
                            app.appId = req.params.appId;
                        }
                        else if (req.params.appId != app.appId) {
                            return [2 /*return*/, next(new restify.InvalidArgumentError("AppId of object does not match URI"))];
                        }
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.EditApp(app, query)];
                    case 1:
                        appId = _a.sent();
                        res.send(appId);
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        res.send(error_4.statusCode, Server.ErrorMessage(error_4));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        /** Archives an existing application */
        this.server.del("/app/:appId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, memory, curAppId, error_5;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.ArchiveApp(appId)];
                    case 2:
                        _a.sent();
                        res.send(200);
                        memory = BlisMemory_1.BlisMemory.GetMemory(key);
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 3:
                        curAppId = _a.sent();
                        if (!(appId == curAppId)) return [3 /*break*/, 7];
                        return [4 /*yield*/, memory.BotState().SetAppId(null)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, memory.BotState().SetModelId(null)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, memory.BotState().SetSessionId(null)];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_5 = _a.sent();
                        res.send(error_5.statusCode, Server.ErrorMessage(error_5));
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        }); });
        /** Destroys an existing application, including all its models, sessions, and logged dialogs
         * Deleting an application from the archive really destroys it – no undo. */
        this.server.del("/archive/:appId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, error_6;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.DeleteApp(appId)];
                    case 2:
                        _a.sent();
                        res.send(200);
                        return [3 /*break*/, 4];
                    case 3:
                        error_6 = _a.sent();
                        res.send(error_6.statusCode, Server.ErrorMessage(error_6));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        /** GET APP STATUS : Retrieves details for a specific $appId */
        this.server.get("/archive/:appId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, blisApp, error_7;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetAppStatus(appId)];
                    case 2:
                        blisApp = _a.sent();
                        res.send(blisApp);
                        return [3 /*break*/, 4];
                    case 3:
                        error_7 = _a.sent();
                        res.send(error_7.statusCode, Server.ErrorMessage(error_7));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        /** Retrieves a list of (active) applications */
        this.server.get("/apps", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, apps, error_8;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetApps(query)];
                    case 2:
                        apps = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(apps));
                        return [3 /*break*/, 4];
                    case 3:
                        error_8 = _a.sent();
                        res.send(error_8.statusCode, Server.ErrorMessage(error_8));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        /** Retrieves a list of application Ids in the archive for the given user */
        this.server.get("/archive", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, apps, error_9;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetArchivedAppIds(query)];
                    case 2:
                        apps = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(apps));
                        return [3 /*break*/, 4];
                    case 3:
                        error_9 = _a.sent();
                        res.send(error_9.statusCode, Server.ErrorMessage(error_9));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        /** Retrieves a list of full applications in the archive for the given user */
        this.server.get("/archives", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, apps, error_10;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetArchivedApps(query)];
                    case 2:
                        apps = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(apps));
                        return [3 /*break*/, 4];
                    case 3:
                        error_10 = _a.sent();
                        res.send(error_10.statusCode, Server.ErrorMessage(error_10));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        /** Moves an application from the archive to the set of active applications */
        this.server.put("/archive/:appId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, app, error_11;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.RestoreApp(appId)];
                    case 2:
                        app = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(app));
                        return [3 /*break*/, 4];
                    case 3:
                        error_11 = _a.sent();
                        res.send(error_11.statusCode, Server.ErrorMessage(error_11));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        //========================================================
        // Action
        //========================================================
        this.server.get("/app/:appId/action/:actionId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, actionId, action, error_12;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        actionId = req.params.actionId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetAction(appId, actionId, query)];
                    case 2:
                        action = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(action));
                        return [3 /*break*/, 4];
                    case 3:
                        error_12 = _a.sent();
                        res.send(error_12.statusCode, Server.ErrorMessage(error_12));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.post("/app/:appId/action", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, action, actionId, error_13;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        action = json_typescript_mapper_1.deserialize(Action_1.Action, req.body);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.AddAction(appId, action)];
                    case 1:
                        actionId = _a.sent();
                        res.send(actionId);
                        return [3 /*break*/, 3];
                    case 2:
                        error_13 = _a.sent();
                        res.send(error_13.statusCode, Server.ErrorMessage(error_13));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this.server.put("/app/:appId/action/:actionId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, action, actionId, error_14;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        action = json_typescript_mapper_1.deserialize(Action_1.Action, req.body);
                        if (!action.actionId) {
                            action.actionId = req.params.actionId;
                        }
                        else if (req.params.actionId != action.actionId) {
                            return [2 /*return*/, next(new restify.InvalidArgumentError("ActionId of object does not match URI"))];
                        }
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.EditAction(appId, action)];
                    case 1:
                        actionId = _a.sent();
                        res.send(actionId);
                        return [3 /*break*/, 3];
                    case 2:
                        error_14 = _a.sent();
                        res.send(error_14.statusCode, Server.ErrorMessage(error_14));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this.server.del("/app/:appId/action/:actionId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, actionId, error_15;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        actionId = req.params.actionId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.DeleteAction(appId, actionId)];
                    case 2:
                        _a.sent();
                        res.send(200);
                        return [3 /*break*/, 4];
                    case 3:
                        error_15 = _a.sent();
                        res.send(error_15.statusCode, Server.ErrorMessage(error_15));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.get("/app/:appId/actions", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, actions, error_16;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetActions(appId, query)];
                    case 2:
                        actions = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(actions));
                        return [3 /*break*/, 4];
                    case 3:
                        error_16 = _a.sent();
                        res.send(error_16.statusCode, Server.ErrorMessage(error_16));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.get("/app/:appId/action", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, actions, error_17;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetActionIds(appId, query)];
                    case 2:
                        actions = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(actions));
                        return [3 /*break*/, 4];
                    case 3:
                        error_17 = _a.sent();
                        res.send(error_17.statusCode, Server.ErrorMessage(error_17));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        //========================================================
        // Entities
        //========================================================
        this.server.get("/app/:appId/entityIds", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, actions, error_18;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetEntityIds(appId, query)];
                    case 2:
                        actions = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(actions));
                        return [3 /*break*/, 4];
                    case 3:
                        error_18 = _a.sent();
                        res.send(error_18.statusCode, Server.ErrorMessage(error_18));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.get("/app/:appId/entity/:entityId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, entityId, entity, error_19;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        entityId = req.params.entityId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetEntity(appId, entityId, query)];
                    case 2:
                        entity = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(entity));
                        return [3 /*break*/, 4];
                    case 3:
                        error_19 = _a.sent();
                        res.send(error_19.statusCode, Server.ErrorMessage(error_19));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.post("/app/:appId/entity", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, entity, entityId, error_20;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        entity = json_typescript_mapper_1.deserialize(Entity_1.Entity, req.body);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.AddEntity(appId, entity)];
                    case 1:
                        entityId = _a.sent();
                        res.send(entityId);
                        return [3 /*break*/, 3];
                    case 2:
                        error_20 = _a.sent();
                        res.send(error_20.statusCode, Server.ErrorMessage(error_20));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this.server.put("/app/:appId/entity/:entityId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, entity, entityId, error_21;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        entity = json_typescript_mapper_1.deserialize(Entity_1.Entity, req.body);
                        if (!entity.entityId) {
                            entity.entityId = req.params.entityId;
                        }
                        else if (req.params.entityId != entity.entityId) {
                            return [2 /*return*/, next(new restify.InvalidArgumentError("EntityId of object does not match URI"))];
                        }
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.EditEntity(appId, entity)];
                    case 1:
                        entityId = _a.sent();
                        res.send(entityId);
                        return [3 /*break*/, 3];
                    case 2:
                        error_21 = _a.sent();
                        res.send(error_21.statusCode, Server.ErrorMessage(error_21));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this.server.del("/app/:appId/entity/:entityId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, entityId, error_22;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        entityId = req.params.entityId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.DeleteEntity(appId, entityId)];
                    case 2:
                        _a.sent();
                        res.send(200);
                        return [3 /*break*/, 4];
                    case 3:
                        error_22 = _a.sent();
                        res.send(error_22.statusCode, Server.ErrorMessage(error_22));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.get("/app/:appId/entities", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, entities, error_23;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetEntities(appId, query)];
                    case 2:
                        entities = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(entities));
                        return [3 /*break*/, 4];
                    case 3:
                        error_23 = _a.sent();
                        res.send(error_23.statusCode, Server.ErrorMessage(error_23));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.get("/app/:appId/entity", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, entityIds, error_24;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetEntityIds(appId, query)];
                    case 2:
                        entityIds = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(entityIds));
                        return [3 /*break*/, 4];
                    case 3:
                        error_24 = _a.sent();
                        res.send(error_24.statusCode, Server.ErrorMessage(error_24));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        //========================================================
        // LogDialogs
        //========================================================
        this.server.get("/app/:appId/logdialog/:logDialogId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, logDialogId, logDialog, error_25;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        logDialogId = req.params.logDialogId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetLogDialog(appId, logDialogId)];
                    case 2:
                        logDialog = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(logDialog));
                        return [3 /*break*/, 4];
                    case 3:
                        error_25 = _a.sent();
                        res.send(error_25.statusCode, Server.ErrorMessage(error_25));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.del("/app/:appId/logdialogs/:logDialogId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, logDialogId, error_26;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        logDialogId = req.params.logDialogId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.DeleteLogDialog(appId, logDialogId)];
                    case 2:
                        _a.sent();
                        res.send(200);
                        return [3 /*break*/, 4];
                    case 3:
                        error_26 = _a.sent();
                        res.send(error_26.statusCode, Server.ErrorMessage(error_26));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.get("/app/:appId/logdialogs", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, logDialogs, error_27;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetLogDialogs(appId, query)];
                    case 2:
                        logDialogs = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(logDialogs));
                        return [3 /*break*/, 4];
                    case 3:
                        error_27 = _a.sent();
                        res.send(error_27.statusCode, Server.ErrorMessage(error_27));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.get("/app/:appId/logDialogIds", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, logDialogIds, error_28;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetLogDialogIds(appId, query)];
                    case 2:
                        logDialogIds = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(logDialogIds));
                        return [3 /*break*/, 4];
                    case 3:
                        error_28 = _a.sent();
                        res.send(error_28.statusCode, Server.ErrorMessage(error_28));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        //========================================================
        // TrainDialogs
        //========================================================
        this.server.post("/app/:appId/traindialog", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, trainDialog, trainDialogId, error_29;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        trainDialog = json_typescript_mapper_1.deserialize(blis_models_1.TrainDialog, req.body);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.AddTrainDialog(appId, trainDialog)];
                    case 1:
                        trainDialogId = _a.sent();
                        res.send(trainDialogId);
                        return [3 /*break*/, 3];
                    case 2:
                        error_29 = _a.sent();
                        res.send(error_29.statusCode, Server.ErrorMessage(error_29));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this.server.put("/app/:appId/traindialog/:traindialogId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, trainDialog, trainDialogId, error_30;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        trainDialog = json_typescript_mapper_1.deserialize(blis_models_1.TrainDialog, req.body);
                        if (!trainDialog.trainDialogId) {
                            trainDialog.trainDialogId = req.params.trainDialogId;
                        }
                        else if (req.params.trainDialogId != trainDialog.trainDialogId) {
                            return [2 /*return*/, next(new restify.InvalidArgumentError("ActionId of object does not match URI"))];
                        }
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.EditTrainDialog(appId, trainDialog)];
                    case 1:
                        trainDialogId = _a.sent();
                        res.send(trainDialogId);
                        return [3 /*break*/, 3];
                    case 2:
                        error_30 = _a.sent();
                        res.send(error_30.statusCode, Server.ErrorMessage(error_30));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this.server.get("/app/:appId/traindialog/:trainDialogId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, trainDialogId, trainDialog, error_31;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        trainDialogId = req.params.trainDialogId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetTrainDialog(appId, trainDialogId)];
                    case 2:
                        trainDialog = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(trainDialog));
                        return [3 /*break*/, 4];
                    case 3:
                        error_31 = _a.sent();
                        res.send(error_31.statusCode, Server.ErrorMessage(error_31));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.del("/app/:appId/traindialogs/:trainDialogId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, trainDialogId, error_32;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        trainDialogId = req.params.trainDialogId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.DeleteTrainDialog(appId, trainDialogId)];
                    case 2:
                        _a.sent();
                        res.send(200);
                        return [3 /*break*/, 4];
                    case 3:
                        error_32 = _a.sent();
                        res.send(error_32.statusCode, Server.ErrorMessage(error_32));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.get("/app/:appId/traindialogs", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, trainDialogs, error_33;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetTrainDialogs(appId, query)];
                    case 2:
                        trainDialogs = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(trainDialogs));
                        return [3 /*break*/, 4];
                    case 3:
                        error_33 = _a.sent();
                        res.send(error_33.statusCode, Server.ErrorMessage(error_33));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.get("/app/:appId/trainDialogIds", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, trainDialogIds, error_34;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetTrainDialogIds(appId, query)];
                    case 2:
                        trainDialogIds = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(trainDialogIds));
                        return [3 /*break*/, 4];
                    case 3:
                        error_34 = _a.sent();
                        res.send(error_34.statusCode, Server.ErrorMessage(error_34));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        //========================================================
        // Session
        //========================================================
        /** START SESSION : Creates a new session and a corresponding logDialog */
        this.server.post("/app/:appId/session", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, sessionResponse, memory, error_35;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.StartSession(appId)];
                    case 1:
                        sessionResponse = _a.sent();
                        res.send(sessionResponse);
                        memory = BlisMemory_1.BlisMemory.GetMemory(key);
                        memory.StartSession(sessionResponse.sessionId, false);
                        return [3 /*break*/, 3];
                    case 2:
                        error_35 = _a.sent();
                        res.send(error_35.statusCode, Server.ErrorMessage(error_35));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        /** GET SESSION : Retrieves information about the specified session */
        this.server.get("/app/:appId/session/:sessionId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, sessionId, response, error_36;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        sessionId = req.params.sessionId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetSession(appId, sessionId)];
                    case 1:
                        response = _a.sent();
                        res.send(response);
                        return [3 /*break*/, 3];
                    case 2:
                        error_36 = _a.sent();
                        res.send(error_36.statusCode, Server.ErrorMessage(error_36));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        /** END SESSION : End a session. */
        this.server.del("/app/:appId/session/:sessionId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, sessionId, response, memory, error_37;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        sessionId = req.params.sessionId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.EndSession(appId, sessionId, query)];
                    case 2:
                        response = _a.sent();
                        res.send(response);
                        memory = BlisMemory_1.BlisMemory.GetMemory(key);
                        memory.EndSession();
                        return [3 /*break*/, 4];
                    case 3:
                        error_37 = _a.sent();
                        res.send(error_37.statusCode, Server.ErrorMessage(error_37));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        /** GET SESSIONS : Retrieves definitions of ALL open sessions */
        this.server.get("/app/:appId/sessions", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, sessions, error_38;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetSessions(appId, query)];
                    case 2:
                        sessions = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(sessions));
                        return [3 /*break*/, 4];
                    case 3:
                        error_38 = _a.sent();
                        res.send(error_38.statusCode, Server.ErrorMessage(error_38));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        /** GET SESSION IDS : Retrieves a list of session IDs */
        this.server.get("/app/:appId/session", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, sessionIds, error_39;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetSessionIds(appId, query)];
                    case 2:
                        sessionIds = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(sessionIds));
                        return [3 /*break*/, 4];
                    case 3:
                        error_39 = _a.sent();
                        res.send(error_39.statusCode, Server.ErrorMessage(error_39));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        //========================================================
        // Teach
        //========================================================
        /** START TEACH SESSION: Creates a new teaching session and a corresponding trainDialog */
        this.server.post("/app/:appId/teach", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, teachResponse, memory, error_40;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.StartTeach(appId)];
                    case 1:
                        teachResponse = _a.sent();
                        res.send(teachResponse);
                        memory = BlisMemory_1.BlisMemory.GetMemory(key);
                        memory.StartSession(teachResponse.teachId, true);
                        return [3 /*break*/, 3];
                    case 2:
                        error_40 = _a.sent();
                        res.send(error_40.statusCode, Server.ErrorMessage(error_40));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        /** GET TEACH: Retrieves information about the specified teach */
        this.server.get("/app/:appId/teach/:teachId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, teachId, response, error_41;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        teachId = req.params.teachId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetTeach(appId, teachId)];
                    case 1:
                        response = _a.sent();
                        res.send(response);
                        return [3 /*break*/, 3];
                    case 2:
                        error_41 = _a.sent();
                        res.send(error_41.statusCode, Server.ErrorMessage(error_41));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        /** RUN EXTRACTOR: Runs entity extraction (prediction).
         * If a more recent version of the package is available on
         * the server, the session will first migrate to that newer version.  This
         * doesn't affect the trainDialog maintained.
         */
        this.server.put("/app/:appId/teach/:teachId/extractor", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, teachId, userInput, extractResponse, memory, memories, uiExtractResponse, error_42;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        this.InitClient(); // TEMP
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        teachId = req.params.teachId;
                        userInput = req.body;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.TeachExtract(appId, teachId, userInput)];
                    case 1:
                        extractResponse = _a.sent();
                        memory = BlisMemory_1.BlisMemory.GetMemory(key);
                        return [4 /*yield*/, memory.BotMemory().DumpMemory()];
                    case 2:
                        memories = _a.sent();
                        uiExtractResponse = new blis_models_2.UIExtractResponse({ extractResponse: extractResponse, memories: memories });
                        res.send(uiExtractResponse);
                        return [3 /*break*/, 4];
                    case 3:
                        error_42 = _a.sent();
                        res.send(error_42.statusCode, Server.ErrorMessage(error_42));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        /** EXTRACT FEEDBACK & RUN SCORER:
         * 1) Uploads a labeled entity extraction instance
         * ie "commits" an entity extraction label, appending it to the teach session's
         * trainDialog, and advancing the dialog. This may yield produce a new package.
         * 2) Takes a turn and return distribution over actions.
         * If a more recent version of the package is
         * available on the server, the session will first migrate to that newer version.
         * This doesn't affect the trainDialog maintained by the teaching session.
         */
        this.server.put("/app/:appId/teach/:teachId/scorer", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, teachId, uiScoreInput, teachResponse, extractResponse, memory, scoreInput, scoreResponse, memories, uiScoreResponse, error_43;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        this.InitClient(); // TEMP
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        teachId = req.params.teachId;
                        uiScoreInput = json_typescript_mapper_1.deserialize(blis_models_2.UIScoreInput, req.body);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.TeachExtractFeedback(appId, teachId, uiScoreInput.trainExtractorStep)];
                    case 1:
                        teachResponse = _a.sent();
                        extractResponse = uiScoreInput.extractResponse;
                        memory = BlisMemory_1.BlisMemory.GetMemory(key);
                        return [4 /*yield*/, BlisDialog_1.BlisDialog.Instance().CallLuisCallback(extractResponse.text, extractResponse.predictedEntities, memory)];
                    case 2:
                        scoreInput = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.TeachScore(appId, teachId, scoreInput)];
                    case 3:
                        scoreResponse = _a.sent();
                        return [4 /*yield*/, memory.BotMemory().DumpMemory()];
                    case 4:
                        memories = _a.sent();
                        uiScoreResponse = new blis_models_2.UIScoreResponse({ scoreInput: scoreInput, scoreResponse: scoreResponse, memories: memories });
                        res.send(uiScoreResponse);
                        return [3 /*break*/, 6];
                    case 5:
                        error_43 = _a.sent();
                        res.send(error_43.statusCode, Server.ErrorMessage(error_43));
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        }); });
        /** SCORE FEEDBACK: Uploads a labeled scorer step instance
         * – ie "commits" a scorer label, appending it to the teach session's
         * trainDialog, and advancing the dialog. This may yield produce a new package.
         */
        this.server.post("/app/:appId/teach/:teachId/scorer", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, teachId, trainScorerStep, scoredAction, teachResponse, memory, error_44;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        teachId = req.params.teachId;
                        trainScorerStep = json_typescript_mapper_1.deserialize(blis_models_1.TrainScorerStep, req.body);
                        scoredAction = trainScorerStep.scoredAction;
                        delete trainScorerStep.scoredAction;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.TeachScoreFeedback(appId, teachId, trainScorerStep)];
                    case 1:
                        teachResponse = _a.sent();
                        res.send(teachResponse);
                        memory = BlisMemory_1.BlisMemory.GetMemory(key);
                        BlisDialog_1.BlisDialog.Instance().TakeAction(scoredAction, memory);
                        return [3 /*break*/, 3];
                    case 2:
                        error_44 = _a.sent();
                        res.send(error_44.statusCode, Server.ErrorMessage(error_44));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        /** END TEACH: Ends a teach.
         * For Teach sessions, does NOT delete the associated trainDialog.
         * To delete the associated trainDialog, call DELETE on the trainDialog.
         */
        this.server.del("/app/:appId/teach/:teachId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, teachId, save, response, memory, error_45;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        teachId = req.params.teachId;
                        save = req.params.save ? "saveDialog=" + req.params.save : null;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.EndTeach(appId, teachId, save)];
                    case 2:
                        response = _a.sent();
                        res.send(response);
                        memory = BlisMemory_1.BlisMemory.GetMemory(key);
                        memory.EndSession();
                        return [3 /*break*/, 4];
                    case 3:
                        error_45 = _a.sent();
                        res.send(error_45.statusCode, Server.ErrorMessage(error_45));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        /** GET TEACH SESSOINS: Retrieves definitions of ALL open teach sessions */
        this.server.get("/app/:appId/teaches", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, teaches, error_46;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetTeaches(appId, query)];
                    case 2:
                        teaches = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(teaches));
                        return [3 /*break*/, 4];
                    case 3:
                        error_46 = _a.sent();
                        res.send(error_46.statusCode, Server.ErrorMessage(error_46));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        /** GET TEACH SESSION IDS: Retrieves a list of teach session IDs */
        this.server.get("/app/:appId/teach", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var query, key, appId, teachIds, error_47;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = req.getQuery();
                        key = req.params.key;
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetTeachIds(appId, query)];
                    case 2:
                        teachIds = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(teachIds));
                        return [3 /*break*/, 4];
                    case 3:
                        error_47 = _a.sent();
                        res.send(error_47.statusCode, Server.ErrorMessage(error_47));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    };
    return Server;
}());
exports.Server = Server;
//# sourceMappingURL=Server.js.map