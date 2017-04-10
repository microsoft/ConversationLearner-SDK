"use strict";
var tslib_1 = require("tslib");
var BlisUserState_1 = require("../BlisUserState");
var BlisDebug_1 = require("../BlisDebug");
var Consts_1 = require("../Model/Consts");
var Help_1 = require("../Model/Help");
var Utils_1 = require("../Utils");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Menu_1 = require("../Menu");
var BlisApp = (function () {
    function BlisApp(init) {
        this.name = undefined;
        this.id = undefined;
        Object.assign(this, init);
    }
    BlisApp.Sort = function (apps) {
        return apps.sort(function (n1, n2) {
            var c1 = n1.name.toLowerCase();
            var c2 = n2.name.toLowerCase();
            if (c1 > c2) {
                return 1;
            }
            if (c1 < c2) {
                return -1;
            }
            return 0;
        });
    };
    /** Send No App card and return false if no app loaded */
    BlisApp.HaveApp = function (context, cb) {
        if (context.state[Consts_1.UserStates.APP] == null) {
            cb(Menu_1.Menu.Apps('No Application has been loaded'));
            return false;
        }
        return true;
    };
    BlisApp.Create = function (context, appName, luisKey, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg, msg, appId, responses, error_1, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Create Application");
                        // TODO - temp debug
                        if (luisKey == '*') {
                            luisKey = '5bb9d31334f14bc5a6bd0d7c3d06094d'; // SRAL
                        }
                        if (luisKey == '**') {
                            luisKey = '8d7dadb7520044c59518b5203b75e802';
                        }
                        if (!appName) {
                            msg = "You must provide a name for your application.";
                            cb(Menu_1.Menu.Apps(msg));
                            return [2 /*return*/];
                        }
                        if (!luisKey) {
                            msg = "You must provide a luisKey for your application.";
                            cb(Menu_1.Menu.Apps(msg));
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, context.client.CreateApp(appName, luisKey)];
                    case 2:
                        appId = _a.sent();
                        // Initialize
                        Object.assign(context.state, new BlisUserState_1.BlisUserState(appId));
                        responses = Menu_1.Menu.Home("Created App", appName);
                        responses = responses.concat(Menu_1.Menu.EditApp(true));
                        cb(responses);
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_1);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb([errMsg]);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /** Get all apps, filter by Search term */
    BlisApp.GetAll = function (context, search, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var debug, appIds, json, msg, responses, apps, _i, appIds_1, appId, blisApp, _a, apps_1, app, error_2, errMsg;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting apps");
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, , 8]);
                        debug = false;
                        if (search && search.indexOf(Consts_1.ActionCommand.DEBUG) > -1) {
                            debug = true;
                            search = search.replace(Consts_1.ActionCommand.DEBUG, "");
                        }
                        appIds = [];
                        return [4 /*yield*/, context.client.GetApps()];
                    case 2:
                        json = _b.sent();
                        appIds = JSON.parse(json)['ids'];
                        BlisDebug_1.BlisDebug.Log("Found " + appIds.length + " apps");
                        if (appIds.length == 0) {
                            cb(Menu_1.Menu.Apps("This account contains no apps."));
                        }
                        msg = "";
                        responses = [];
                        apps = [];
                        if (search)
                            search = search.toLowerCase();
                        _i = 0, appIds_1 = appIds;
                        _b.label = 3;
                    case 3:
                        if (!(_i < appIds_1.length)) return [3 /*break*/, 6];
                        appId = appIds_1[_i];
                        return [4 /*yield*/, context.client.GetApp(appId)];
                    case 4:
                        blisApp = _b.sent();
                        if (!search || blisApp.name.toLowerCase().indexOf(search) > -1) {
                            apps.push(blisApp);
                            BlisDebug_1.BlisDebug.Log("App lookup: " + blisApp.name + " : " + blisApp.id);
                        }
                        _b.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        // Sort
                        apps = BlisApp.Sort(apps);
                        // Genrate output
                        for (_a = 0, apps_1 = apps; _a < apps_1.length; _a++) {
                            app = apps_1[_a];
                            if (debug) {
                                msg += app.name + " : " + app.id + "\n\n";
                            }
                            else {
                                if (app.id == context.state[Consts_1.UserStates.APP]) {
                                    responses.push(Utils_1.Utils.MakeHero(app.name + " (LOADED)", null, null, {
                                        "Delete": Consts_1.IntCommands.DELETEAPP + " " + app.id
                                    }));
                                }
                                else {
                                    responses.push(Utils_1.Utils.MakeHero(app.name, null, null, {
                                        "Load": Consts_1.Commands.LOADAPP + " " + app.id,
                                        "Import": Consts_1.Commands.IMPORTAPP + " " + app.id,
                                        "Delete": Consts_1.IntCommands.DELETEAPP + " " + app.id,
                                    }));
                                }
                            }
                        }
                        if (debug)
                            responses.push(msg);
                        if (responses.length == 0) {
                            responses.push("No Apps match your query.");
                        }
                        cb(responses);
                        return [3 /*break*/, 8];
                    case 7:
                        error_2 = _b.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_2);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb([errMsg]);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /** Delete all apps associated with this account */
    BlisApp.DeleteAll = function (context, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var appIds, json, _i, appIds_2, appId, text, error_3, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete All Applications");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        appIds = [];
                        return [4 /*yield*/, context.client.GetApps()];
                    case 2:
                        json = _a.sent();
                        appIds = JSON.parse(json)['ids'];
                        BlisDebug_1.BlisDebug.Log("Found " + appIds.length + " apps");
                        _i = 0, appIds_2 = appIds;
                        _a.label = 3;
                    case 3:
                        if (!(_i < appIds_2.length)) return [3 /*break*/, 6];
                        appId = appIds_2[_i];
                        return [4 /*yield*/, context.client.DeleteApp(context.state, appId)];
                    case 4:
                        text = _a.sent();
                        BlisDebug_1.BlisDebug.Log("Deleted " + appId + " apps");
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        cb(["Done"]);
                        return [3 /*break*/, 8];
                    case 7:
                        error_3 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_3);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb([errMsg]);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    BlisApp.Delete = function (context, appId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg, card, error_4, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Application");
                        if (!appId) {
                            msg = Help_1.BlisHelp.Get(Help_1.Help.DELETEAPP);
                            cb([msg]);
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, context.client.DeleteApp(context.state, appId)];
                    case 2:
                        _a.sent();
                        card = Menu_1.Menu.Apps("Deleted App", appId, null);
                        // Did I delete my loaded app
                        if (appId == context.state[Consts_1.UserStates.APP]) {
                            context.state[Consts_1.UserStates.APP] = null;
                        }
                        cb(card);
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_4);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb([errMsg]);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return BlisApp;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('app-name'),
    tslib_1.__metadata("design:type", String)
], BlisApp.prototype, "name", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('model-id'),
    tslib_1.__metadata("design:type", String)
], BlisApp.prototype, "id", void 0);
exports.BlisApp = BlisApp;
//# sourceMappingURL=BlisApp.js.map