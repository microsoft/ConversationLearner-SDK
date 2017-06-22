"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var restify = require('restify');
var BlisDebug_1 = require("../BlisDebug");
var BlisClient_1 = require("../BlisClient");
var BlisApp_1 = require("../Model/BlisApp");
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
                        res.send(error_1.statusCode, Error(error_1.body));
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
                        res.send(error_2.statusCode, Error(error_2.body));
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
                        res.send(error_3.statusCode, Error(error_3.body));
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