"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var BlisClient_1 = require("./BlisClient");
var BlisApp_1 = require("./Model/BlisApp");
var BlisDebug_1 = require("./BlisDebug");
var Entity_1 = require("./Model/Entity");
var Action_1 = require("./Model/Action");
var TestResult = (function () {
    function TestResult(pass, message) {
        this.pass = pass;
        this.message = message;
    }
    TestResult.Pass = function () {
        return new TestResult(true, "PASS");
    };
    TestResult.Fail = function (reason) {
        return new TestResult(false, "FAIL: " + reason);
    };
    return TestResult;
}());
exports.TestResult = TestResult;
var Test = (function () {
    function Test() {
    }
    Test.InitClient = function () {
        var serviceUrl = "http://blis-service.azurewebsites.net/api/v1/";
        var user = "testuser";
        var secret = "none";
        var azureFunctionsUrl = "";
        var azureFunctionsKey = "";
        BlisClient_1.BlisClient.Init(serviceUrl, user, secret, azureFunctionsUrl, azureFunctionsKey);
    };
    Test.InitApp = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var blisApp;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.InitClient();
                        blisApp = this.MakeApp();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.AddApp(blisApp)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Test.T_AppRoundtrip = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var inApp, appId, outApp, deletedApp, error_1, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        this.InitClient();
                        inApp = this.MakeApp();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.AddApp(inApp)];
                    case 1:
                        appId = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetApp(appId)];
                    case 2:
                        outApp = _a.sent();
                        if (outApp.appId != appId)
                            return [2 /*return*/, TestResult.Fail("appId")];
                        if (outApp.appName != inApp.appName)
                            return [2 /*return*/, TestResult.Fail("appName")];
                        if (outApp.luisKey != inApp.luisKey)
                            return [2 /*return*/, TestResult.Fail("luisKey")];
                        if (outApp.locale != inApp.locale)
                            return [2 /*return*/, TestResult.Fail("luisKey")];
                        // Now delete the app
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.DeleteApp(appId)];
                    case 3:
                        // Now delete the app
                        _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetApp(appId)];
                    case 4:
                        deletedApp = _a.sent();
                        if (deletedApp)
                            return [2 /*return*/, TestResult.Fail("Delete")];
                        return [2 /*return*/, TestResult.Pass()];
                    case 5:
                        error_1 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_1);
                        return [2 /*return*/, TestResult.Fail(errMsg)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    Test.T_EntityRoundtrip = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var appId, inEntity, entityId, outEntity, deletedEntity, error_2, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.InitApp()];
                    case 1:
                        appId = _a.sent();
                        inEntity = this.MakeEntity();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.AddEntity(appId, inEntity)];
                    case 2:
                        entityId = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetEntity(appId, entityId)];
                    case 3:
                        outEntity = _a.sent();
                        if (outEntity.entityId != entityId)
                            return [2 /*return*/, TestResult.Fail("entityId")];
                        if (outEntity.entityName != inEntity.entityName)
                            return [2 /*return*/, TestResult.Fail("entityName")];
                        if (outEntity.entityType != inEntity.entityType)
                            return [2 /*return*/, TestResult.Fail("entityType")];
                        if (outEntity.version != inEntity.version)
                            return [2 /*return*/, TestResult.Fail("version")];
                        if (outEntity.packageCreationId != inEntity.packageCreationId)
                            return [2 /*return*/, TestResult.Fail("packageCreationId")];
                        if (outEntity.packageDeletionId != inEntity.packageDeletionId)
                            return [2 /*return*/, TestResult.Fail("packageDeletionId")];
                        if (outEntity.metadata != inEntity.metadata)
                            return [2 /*return*/, TestResult.Fail("metadata")];
                        // Now delete 
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.DeleteEntity(appId, entityId)];
                    case 4:
                        // Now delete 
                        _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetEntity(appId, entityId)];
                    case 5:
                        deletedEntity = _a.sent();
                        if (deletedEntity)
                            return [2 /*return*/, TestResult.Fail("Delete")];
                        return [2 /*return*/, TestResult.Pass()];
                    case 6:
                        error_2 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_2);
                        return [2 /*return*/, TestResult.Fail(errMsg)];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    Test.T_ActionRoundtrip = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var appId, inAction, actionId, outAction, deletedAction, error_3, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.InitApp()];
                    case 1:
                        appId = _a.sent();
                        inAction = this.MakeAction();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.AddAction(appId, inAction)];
                    case 2:
                        actionId = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetAction(appId, actionId)];
                    case 3:
                        outAction = _a.sent();
                        if (outAction.actionId != actionId)
                            return [2 /*return*/, TestResult.Fail("actionId")];
                        if (outAction.payload != inAction.payload)
                            return [2 /*return*/, TestResult.Fail("payload")];
                        if (outAction.isTerminal != inAction.isTerminal)
                            return [2 /*return*/, TestResult.Fail("isTerminal")];
                        if (!this.IsSame(outAction.requiredEntities, inAction.requiredEntities))
                            return [2 /*return*/, TestResult.Fail("requiredEntities")];
                        if (!this.IsSame(outAction.negativeEntities, inAction.negativeEntities))
                            return [2 /*return*/, TestResult.Fail("negativeEntities")];
                        if (outAction.version != inAction.version)
                            return [2 /*return*/, TestResult.Fail("version")];
                        if (outAction.packageCreationId != inAction.packageCreationId)
                            return [2 /*return*/, TestResult.Fail("packageCreationId")];
                        if (outAction.packageDeletionId != inAction.packageDeletionId)
                            return [2 /*return*/, TestResult.Fail("packageDeletionId")];
                        if (outAction.metadata != inAction.metadata)
                            return [2 /*return*/, TestResult.Fail("metadata")];
                        // Now delete 
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.DeleteAction(appId, actionId)];
                    case 4:
                        // Now delete 
                        _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetAction(appId, actionId)];
                    case 5:
                        deletedAction = _a.sent();
                        if (deletedAction)
                            return [2 /*return*/, TestResult.Fail("Delete")];
                        return [2 /*return*/, TestResult.Pass()];
                    case 6:
                        error_3 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_3);
                        return [2 /*return*/, TestResult.Fail(errMsg)];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    //===================================================
    // Tools
    //===================================================
    Test.IsSame = function (arr1, arr2) {
        if (arr1.length != arr2.length) {
            return false;
        }
        for (var _i = 0, arr1_1 = arr1; _i < arr1_1.length; _i++) {
            var element1 = arr1_1[_i];
            var found = false;
            for (var _a = 0, arr2_1 = arr2; _a < arr2_1.length; _a++) {
                var element2 = arr2_1[_a];
                if (element1 == element2) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }
        return true;
    };
    Test.MakeRandomWord = function (size) {
        return "test_" + Array(size).join().split(',').map(function () { return Test.s.charAt(Math.floor(Math.random() * Test.s.length)); }).join('');
    };
    Test.MakeRandomInt = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    Test.MakeRandomBool = function () {
        return Math.random() >= 0.5;
    };
    //===================================================
    // Object generators
    //===================================================
    Test.MakeApp = function () {
        return new BlisApp_1.BlisApp({
            appName: this.MakeRandomWord(10),
            luisKey: '5bb9d31334f14bc5a6bd0d7c3d06094d',
            locale: 'en-us'
        });
    };
    Test.MakeEntity = function () {
        return new Entity_1.Entity({
            entityName: this.MakeRandomWord(10),
            entityType: "LUIS",
            version: this.MakeRandomInt(0, 100),
            packageCreationId: this.MakeRandomInt(0, 100),
            packageDeletionId: this.MakeRandomInt(0, 100),
            metadata: undefined
        });
    };
    Test.MakeAction = function () {
        return new Action_1.Action({
            payload: this.MakeRandomWord(10),
            isTerminal: this.MakeRandomBool(),
            requiredEntities: [],
            negativeEntities: [],
            version: this.MakeRandomInt(0, 100),
            packageCreationId: this.MakeRandomInt(0, 100),
            packageDeletionId: this.MakeRandomInt(0, 100),
            metadata: undefined
        });
    };
    return Test;
}());
//===================================================
// Random generators
//===================================================
Test.s = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
exports.Test = Test;
//# sourceMappingURL=Test.js.map