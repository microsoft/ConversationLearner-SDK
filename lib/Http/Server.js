"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var restify = require('restify');
var BlisDebug_1 = require("../BlisDebug");
var BlisClient_1 = require("../BlisClient");
var BlisApp_1 = require("../Model/BlisApp");
var Action_1 = require("../Model/Action");
var Entity_1 = require("../Model/Entity");
var TrainDialog_1 = require("../Model/TrainDialog");
var TrainDialog_2 = require("../Model/TrainDialog");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Server = (function () {
    function Server() {
    }
    // TEMP until we have an actual user
    Server.InitClient = function () {
        var serviceUrl = "http://blis-service.azurewebsites.net/api/v1/";
        var user = "testuser";
        var secret = "none";
        var azureFunctionsUrl = "";
        var azureFunctionsKey = "";
        BlisClient_1.BlisClient.Init(serviceUrl, user, secret, azureFunctionsUrl, azureFunctionsKey);
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
        this.server.listen(5000, function (err) {
            if (err) {
                BlisDebug_1.BlisDebug.Error(err);
            }
            else {
                BlisDebug_1.BlisDebug.Log(_this.server.name + " listening to " + _this.server.url);
            }
        });
        //========================================================
        // App
        //========================================================
        this.server.get("/app/:appId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, app, error_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        if (!appId) {
                            res.send(400, Error("Missing Application Id"));
                            return [2 /*return*/];
                        }
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetApp(appId)];
                    case 2:
                        app = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(app));
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        res.send(error_1.statusCode, Server.ErrorMessage(error_1));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.post("/app", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var app, appId, error_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        app = json_typescript_mapper_1.deserialize(BlisApp_1.BlisApp, req.body);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.AddApp(app)];
                    case 1:
                        appId = _a.sent();
                        res.send(appId);
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        res.send(error_2.statusCode, Server.ErrorMessage(error_2));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this.server.put("/app/:appId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var app, appId, error_3;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        app = json_typescript_mapper_1.deserialize(BlisApp_1.BlisApp, req.body);
                        if (!app.appId) {
                            app.appId = req.params.appId;
                        }
                        else if (req.params.appId != app.appId) {
                            return [2 /*return*/, next(new restify.InvalidArgumentError("AppId of object does not match URI"))];
                        }
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.EditApp(app)];
                    case 1:
                        appId = _a.sent();
                        res.send(appId);
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        res.send(error_3.statusCode, Server.ErrorMessage(error_3));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this.server.del("/app/:appId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, error_4;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        if (!appId) {
                            res.send(400, Error("Missing Application Id"));
                            return [2 /*return*/];
                        }
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.DeleteApp(appId)];
                    case 2:
                        _a.sent();
                        res.send(200);
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _a.sent();
                        res.send(error_4.statusCode, Server.ErrorMessage(error_4));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.get("/apps", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var apps, error_5;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetApps()];
                    case 2:
                        apps = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(apps));
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _a.sent();
                        res.send(error_5.statusCode, Server.ErrorMessage(error_5));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        //========================================================
        // Action
        //========================================================
        this.server.get("/app/:appId/action/:actionId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, actionId, action, error_6;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        actionId = req.params.actionId;
                        if (!actionId) {
                            res.send(400, Error("Missing Action Id"));
                            return [2 /*return*/];
                        }
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetAction(appId, actionId)];
                    case 2:
                        action = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(action));
                        return [3 /*break*/, 4];
                    case 3:
                        error_6 = _a.sent();
                        res.send(error_6.statusCode, Server.ErrorMessage(error_6));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.post("/app/:appId/action", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, action, actionId, error_7;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        appId = req.params.appId;
                        action = json_typescript_mapper_1.deserialize(Action_1.Action, req.body);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.AddAction(appId, action)];
                    case 1:
                        actionId = _a.sent();
                        res.send(actionId);
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _a.sent();
                        res.send(error_7.statusCode, Server.ErrorMessage(error_7));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this.server.put("/app/:appId/action/:actionId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, action, actionId, error_8;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
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
                        error_8 = _a.sent();
                        res.send(error_8.statusCode, Server.ErrorMessage(error_8));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this.server.del("/app/:appId/action/:actionId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, actionId, error_9;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        actionId = req.params.actionId;
                        if (!actionId) {
                            res.send(400, Error("Missing Action Id"));
                            return [2 /*return*/];
                        }
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.DeleteAction(appId, actionId)];
                    case 2:
                        _a.sent();
                        res.send(200);
                        return [3 /*break*/, 4];
                    case 3:
                        error_9 = _a.sent();
                        res.send(error_9.statusCode, Server.ErrorMessage(error_9));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.get("/app/:appId/actions", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, actions, error_10;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetActions(appId)];
                    case 2:
                        actions = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(actions));
                        return [3 /*break*/, 4];
                    case 3:
                        error_10 = _a.sent();
                        res.send(error_10.statusCode, Server.ErrorMessage(error_10));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.get("/app/:appId/actionIds", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, actions, error_11;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetActionIds(appId)];
                    case 2:
                        actions = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(actions));
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
        // Entities
        //========================================================
        this.server.get("/app/:appId/entityIds", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, actions, error_12;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetEntityIds(appId)];
                    case 2:
                        actions = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(actions));
                        return [3 /*break*/, 4];
                    case 3:
                        error_12 = _a.sent();
                        res.send(error_12.statusCode, Server.ErrorMessage(error_12));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.get("/app/:appId/entity/:entityId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, entityId, entity, error_13;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        entityId = req.params.entityId;
                        if (!entityId) {
                            res.send(400, Error("Missing Entity Id"));
                            return [2 /*return*/];
                        }
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetEntity(appId, entityId)];
                    case 2:
                        entity = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(entity));
                        return [3 /*break*/, 4];
                    case 3:
                        error_13 = _a.sent();
                        res.send(error_13.statusCode, Server.ErrorMessage(error_13));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.post("/app/:appId/entity", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, entity, entityId, error_14;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        appId = req.params.appId;
                        entity = json_typescript_mapper_1.deserialize(Entity_1.Entity, req.body);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.AddEntity(appId, entity)];
                    case 1:
                        entityId = _a.sent();
                        res.send(entityId);
                        return [3 /*break*/, 3];
                    case 2:
                        error_14 = _a.sent();
                        res.send(error_14.statusCode, Server.ErrorMessage(error_14));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this.server.put("/app/:appId/entity/:entityId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, entity, entityId, error_15;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
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
                        error_15 = _a.sent();
                        res.send(error_15.statusCode, Server.ErrorMessage(error_15));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this.server.del("/app/:appId/entity/:entityId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, entityId, error_16;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        entityId = req.params.entityId;
                        if (!entityId) {
                            res.send(400, Error("Missing Entity Id"));
                            return [2 /*return*/];
                        }
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.DeleteEntity(appId, entityId)];
                    case 2:
                        _a.sent();
                        res.send(200);
                        return [3 /*break*/, 4];
                    case 3:
                        error_16 = _a.sent();
                        res.send(error_16.statusCode, Server.ErrorMessage(error_16));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.get("/app/:appId/entities", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, entities, error_17;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetEntities(appId)];
                    case 2:
                        entities = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(entities));
                        return [3 /*break*/, 4];
                    case 3:
                        error_17 = _a.sent();
                        res.send(error_17.statusCode, Server.ErrorMessage(error_17));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.get("/app/:appId/entityIds", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, entityIds, error_18;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetEntityIds(appId)];
                    case 2:
                        entityIds = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(entityIds));
                        return [3 /*break*/, 4];
                    case 3:
                        error_18 = _a.sent();
                        res.send(error_18.statusCode, Server.ErrorMessage(error_18));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        //========================================================
        // LogDialogs
        //========================================================
        this.server.get("/app/:appId/logdialog/:logDialogId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, logDialogId, logDialog, error_19;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        logDialogId = req.params.logDialogId;
                        if (!logDialogId) {
                            res.send(400, Error("Missing Log Dialog Id"));
                            return [2 /*return*/];
                        }
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetLogDialog(appId, logDialogId)];
                    case 2:
                        logDialog = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(logDialog));
                        return [3 /*break*/, 4];
                    case 3:
                        error_19 = _a.sent();
                        res.send(error_19.statusCode, Server.ErrorMessage(error_19));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.del("/app/:appId/logdialogs/:logDialogId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, logDialogId, error_20;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        logDialogId = req.params.logDialogId;
                        if (!logDialogId) {
                            res.send(400, Error("Missing Log Dialog Id"));
                            return [2 /*return*/];
                        }
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.DeleteLogDialog(appId, logDialogId)];
                    case 2:
                        _a.sent();
                        res.send(200);
                        return [3 /*break*/, 4];
                    case 3:
                        error_20 = _a.sent();
                        res.send(error_20.statusCode, Server.ErrorMessage(error_20));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.get("/app/:appId/logdialogs", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, query, logDialogs, error_21;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        query = req.getQuery();
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetLogDialogs(appId, query)];
                    case 2:
                        logDialogs = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(logDialogs));
                        return [3 /*break*/, 4];
                    case 3:
                        error_21 = _a.sent();
                        res.send(error_21.statusCode, Server.ErrorMessage(error_21));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.get("/app/:appId/logDialogIds", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, query, logDialogIds, error_22;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        query = req.getQuery();
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetLogDialogIds(appId)];
                    case 2:
                        logDialogIds = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(logDialogIds));
                        return [3 /*break*/, 4];
                    case 3:
                        error_22 = _a.sent();
                        res.send(error_22.statusCode, Server.ErrorMessage(error_22));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        //========================================================
        // TrainDialogs
        //========================================================
        this.server.post("/app/:appId/traindialog", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, trainDialog, trainDialogId, error_23;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        appId = req.params.appId;
                        trainDialog = json_typescript_mapper_1.deserialize(TrainDialog_1.TrainDialog, req.body);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.AddTrainDialog(appId, trainDialog)];
                    case 1:
                        trainDialogId = _a.sent();
                        res.send(trainDialogId);
                        return [3 /*break*/, 3];
                    case 2:
                        error_23 = _a.sent();
                        res.send(error_23.statusCode, Server.ErrorMessage(error_23));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this.server.put("/app/:appId/traindialog/:traindialogId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, trainDialog, trainDialogId, error_24;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        appId = req.params.appId;
                        trainDialog = json_typescript_mapper_1.deserialize(TrainDialog_1.TrainDialog, req.body);
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
                        error_24 = _a.sent();
                        res.send(error_24.statusCode, Server.ErrorMessage(error_24));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this.server.get("/app/:appId/traindialog/:trainDialogId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, trainDialogId, trainDialog, error_25;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        trainDialogId = req.params.trainDialogId;
                        if (!trainDialogId) {
                            res.send(400, Error("Missing TrainDialog Id"));
                            return [2 /*return*/];
                        }
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetTrainDialog(appId, trainDialogId)];
                    case 2:
                        trainDialog = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(trainDialog));
                        return [3 /*break*/, 4];
                    case 3:
                        error_25 = _a.sent();
                        res.send(error_25.statusCode, Server.ErrorMessage(error_25));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.del("/app/:appId/traindialogs/:trainDialogId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, trainDialogId, error_26;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        trainDialogId = req.params.trainDialogId;
                        if (!trainDialogId) {
                            res.send(400, Error("Missing TrainDialog Id"));
                            return [2 /*return*/];
                        }
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.DeleteTrainDialog(appId, trainDialogId)];
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
        this.server.get("/app/:appId/traindialogs", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, query, trainDialogs, error_27;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        query = req.getQuery();
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetTrainDialogs(appId, query)];
                    case 2:
                        trainDialogs = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(trainDialogs));
                        return [3 /*break*/, 4];
                    case 3:
                        error_27 = _a.sent();
                        res.send(error_27.statusCode, Server.ErrorMessage(error_27));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.get("/app/:appId/trainDialogIds", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, query, trainDialogIds, error_28;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        query = req.getQuery();
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetTrainDialogIds(appId)];
                    case 2:
                        trainDialogIds = _a.sent();
                        res.send(json_typescript_mapper_1.serialize(trainDialogIds));
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
        // Sessions & Training
        //========================================================
        /** Creates a new session and a corresponding logDialog */
        this.server.post("/app/:appId/session", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, response, error_29;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.StartSession(appId)];
                    case 1:
                        response = _a.sent();
                        res.send(response);
                        return [3 /*break*/, 3];
                    case 2:
                        error_29 = _a.sent();
                        res.send(error_29.statusCode, Server.ErrorMessage(error_29));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        /** Retrieves information about the specified session */
        this.server.get("/app/:appId/teach/:sessionId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, sessionId, response, error_30;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        appId = req.params.appId;
                        sessionId = req.params.sessionId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetSession(appId, sessionId)];
                    case 1:
                        response = _a.sent();
                        res.send(response);
                        return [3 /*break*/, 3];
                    case 2:
                        error_30 = _a.sent();
                        res.send(error_30.statusCode, Server.ErrorMessage(error_30));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        /** End a session. */
        this.server.del("/app/:appId/session/:sessionId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, sessionId, response, error_31;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        sessionId = req.params.sessionId;
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.EndSession(appId, sessionId)];
                    case 2:
                        response = _a.sent();
                        res.send(response);
                        return [3 /*break*/, 4];
                    case 3:
                        error_31 = _a.sent();
                        res.send(error_31.statusCode, Server.ErrorMessage(error_31));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        //========================================================
        // Teach
        //========================================================
        /** Creates a new teaching session and a corresponding trainDialog */
        this.server.post("/app/:appId/teach", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, response, error_32;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        appId = req.params.appId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.StartTeach(appId)];
                    case 1:
                        response = _a.sent();
                        res.send(response);
                        return [3 /*break*/, 3];
                    case 2:
                        error_32 = _a.sent();
                        res.send(error_32.statusCode, Server.ErrorMessage(error_32));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        /** Retrieves information about the specified teach */
        this.server.get("/app/:appId/teach/:teachId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, teachId, response, error_33;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        appId = req.params.appId;
                        teachId = req.params.teachId;
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetTeach(appId, teachId)];
                    case 1:
                        response = _a.sent();
                        res.send(response);
                        return [3 /*break*/, 3];
                    case 2:
                        error_33 = _a.sent();
                        res.send(error_33.statusCode, Server.ErrorMessage(error_33));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        /** Uploads a labeled entity extraction instance
         * ie "commits" an entity extraction label, appending it to the teach session's
         * trainDialog, and advancing the dialog. This may yield produce a new package.
         */
        this.server.post("/app/:appId/teach/:teachId/extractor", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, teachId, extractorStep, response, error_34;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        appId = req.params.appId;
                        teachId = req.params.teachId;
                        extractorStep = json_typescript_mapper_1.deserialize(TrainDialog_2.TrainExtractorStep, req.body);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.TeachExtractFeedback(appId, teachId, extractorStep)];
                    case 1:
                        response = _a.sent();
                        res.send(response);
                        return [3 /*break*/, 3];
                    case 2:
                        error_34 = _a.sent();
                        res.send(error_34.statusCode, Server.ErrorMessage(error_34));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        /** Uploads a labeled scorer step instance
         * – ie "commits" a scorer label, appending it to the teach session's
         * trainDialog, and advancing the dialog. This may yield produce a new package.
         */
        this.server.post("/app/:appId/teach/:teachId/scorer", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, teachId, scorerResponse, response, error_35;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.InitClient(); // TEMP
                        appId = req.params.appId;
                        teachId = req.params.teachId;
                        scorerResponse = json_typescript_mapper_1.deserialize(TrainDialog_2.TrainScorerStep, req.body);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.TeachScoreFeedback(appId, teachId, scorerResponse)];
                    case 1:
                        response = _a.sent();
                        res.send(response);
                        return [3 /*break*/, 3];
                    case 2:
                        error_35 = _a.sent();
                        res.send(error_35.statusCode, Server.ErrorMessage(error_35));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        /** Ends a teach.
         * For Teach sessions, does NOT delete the associated trainDialog.
         * To delete the associated trainDialog, call DELETE on the trainDialog.
         */
        this.server.del("/app/:appId/teach/:teachId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, teachId, response, error_36;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = req.params.appId;
                        teachId = req.params.teachId;
                        if (!teachId) {
                            res.send(400, Error("Missing Entity Id"));
                            return [2 /*return*/];
                        }
                        this.InitClient(); // TEMP
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.EndTeach(appId, teachId)];
                    case 2:
                        response = _a.sent();
                        res.send(response);
                        return [3 /*break*/, 4];
                    case 3:
                        error_36 = _a.sent();
                        res.send(error_36.statusCode, Server.ErrorMessage(error_36));
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