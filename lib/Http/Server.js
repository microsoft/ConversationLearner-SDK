"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var restify = require('restify');
var BlisDebug_1 = require("../BlisDebug");
var BlisClient_1 = require("../BlisClient");
var BlisApp_1 = require("../Model/BlisApp");
var Action_1 = require("../Model/Action");
var Entity_1 = require("../Model/Entity");
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
        //-------------------------------------
        // App
        //-------------------------------------
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
        this.server.del("/app/:appId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, error_3;
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
                        error_3 = _a.sent();
                        res.send(error_3.statusCode, Server.ErrorMessage(error_3));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        //-------------------------------------
        // Action
        //-------------------------------------
        this.server.get("/app/:appId/action/:actionId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, actionId, action, error_4;
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
                        error_4 = _a.sent();
                        res.send(error_4.statusCode, Server.ErrorMessage(error_4));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.post("/app/:appId/action", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, action, actionId, error_5;
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
                        error_5 = _a.sent();
                        res.send(error_5.statusCode, Server.ErrorMessage(error_5));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this.server.del("/app/:appId/action/:actionId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, actionId, error_6;
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
                        error_6 = _a.sent();
                        res.send(error_6.statusCode, Server.ErrorMessage(error_6));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        //-------------------------------------
        // Entity
        //-------------------------------------
        this.server.get("/app/:appId/entity/:entityId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, entityId, entity, error_7;
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
                        error_7 = _a.sent();
                        res.send(error_7.statusCode, Server.ErrorMessage(error_7));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.server.post("/app/:appId/entity", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, entity, entityId, error_8;
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
                        error_8 = _a.sent();
                        res.send(error_8.statusCode, Server.ErrorMessage(error_8));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this.server.del("/app/:appId/entity/:entityId", function (req, res, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var appId, entityId, error_9;
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
                        error_9 = _a.sent();
                        res.send(error_9.statusCode, Server.ErrorMessage(error_9));
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