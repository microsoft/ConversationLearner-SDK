"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var BlisDebug_1 = require("../BlisDebug");
var BlisClient_1 = require("../BlisClient");
var Consts_1 = require("../Model/Consts");
var Command_1 = require("./Command");
var Help_1 = require("../Model/Help");
var BlisMemory_1 = require("../BlisMemory");
var Utils_1 = require("../Utils");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Menu_1 = require("../Menu");
var AdminResponse_1 = require("./AdminResponse");
var BlisAppMetaData = (function () {
    function BlisAppMetaData(init) {
        this.botFrameworkApps = undefined;
        Object.assign(this, init);
    }
    return BlisAppMetaData;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('botFrameworkApps'),
    tslib_1.__metadata("design:type", Array)
], BlisAppMetaData.prototype, "botFrameworkApps", void 0);
exports.BlisAppMetaData = BlisAppMetaData;
var BlisApp = (function () {
    function BlisApp(init) {
        this.appName = undefined;
        this.appId = undefined;
        this.luisKey = undefined;
        this.locale = undefined;
        this.metadata = undefined;
        Object.assign(this, init);
    }
    BlisApp.Delete = function (appId, key) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, curAppId, error_1, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Application");
                        if (!appId) {
                            return [2 /*return*/, AdminResponse_1.AdminResponse.Error('No app provided')];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        memory = BlisMemory_1.BlisMemory.GetMemory(key);
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 2:
                        curAppId = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.DeleteApp(curAppId, appId)
                            // Did I delete my loaded app
                        ];
                    case 3:
                        _a.sent();
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
                        error_1 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_1);
                        AdminResponse_1.AdminResponse.Error(errMsg);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /** Create a new app, return new appId */
    BlisApp.Add = function (key, blisApp) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var appId, error_2, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Create Application");
                        // TODO - temp debug
                        if (blisApp.luisKey == '*') {
                            blisApp.luisKey = '5bb9d31334f14bc5a6bd0d7c3d06094d'; // SRAL
                        }
                        if (blisApp.luisKey == '**') {
                            blisApp.luisKey = '8d7dadb7520044c59518b5203b75e802';
                        }
                        if (!blisApp.appName) {
                            return [2 /*return*/, AdminResponse_1.AdminResponse.Error("You must provide a name for your application.")];
                        }
                        if (!blisApp.luisKey) {
                            return [2 /*return*/, AdminResponse_1.AdminResponse.Error("You must provide a luisKey for your application.")];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.AddApp(blisApp)];
                    case 2:
                        appId = _a.sent();
                        // Initialize
                        return [4 /*yield*/, BlisMemory_1.BlisMemory.GetMemory(key).Init(appId)];
                    case 3:
                        // Initialize
                        _a.sent();
                        return [2 /*return*/, AdminResponse_1.AdminResponse.Result(appId)];
                    case 4:
                        error_2 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_2);
                        return [2 /*return*/, AdminResponse_1.AdminResponse.Error(errMsg)];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /** Get all apps, filter by Search term */
    BlisApp.GetAll = function (key, search) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var debug, appIds, json, apps, _i, appIds_1, appId, blisApp, error_3, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting apps");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        debug = false;
                        if (search && search.indexOf(Consts_1.ActionCommand.DEBUG) > -1) {
                            debug = true;
                            search = search.replace(Consts_1.ActionCommand.DEBUG, "");
                        }
                        appIds = [];
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.GetApps()];
                    case 2:
                        json = _a.sent();
                        appIds = JSON.parse(json)['ids'];
                        BlisDebug_1.BlisDebug.Log("Found " + appIds.length + " apps");
                        if (appIds.length == 0) {
                            return [2 /*return*/, AdminResponse_1.AdminResponse.Result([])];
                        }
                        apps = [];
                        if (search)
                            search = search.toLowerCase();
                        _i = 0, appIds_1 = appIds;
                        _a.label = 3;
                    case 3:
                        if (!(_i < appIds_1.length)) return [3 /*break*/, 6];
                        appId = appIds_1[_i];
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetApp(appId)];
                    case 4:
                        blisApp = _a.sent();
                        if (!search || blisApp.appId.toLowerCase().indexOf(search) > -1) {
                            apps.push(blisApp);
                            BlisDebug_1.BlisDebug.Log("App lookup: " + blisApp.appName + " : " + blisApp.appId);
                        }
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        // Sort
                        apps = BlisApp.Sort(apps);
                        return [2 /*return*/, AdminResponse_1.AdminResponse.Result(apps)];
                    case 7:
                        error_3 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_3);
                        return [2 /*return*/, AdminResponse_1.AdminResponse.Result(errMsg)];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /** Delete all apps associated with this account */
    BlisApp.DeleteAll = function (key) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var appIds, json, memory, curAppId, _i, appIds_2, appId, text, error_4, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete All Applications");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 11, , 12]);
                        appIds = [];
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.GetApps()];
                    case 2:
                        json = _a.sent();
                        appIds = JSON.parse(json)['ids'];
                        BlisDebug_1.BlisDebug.Log("Found " + appIds.length + " apps");
                        memory = BlisMemory_1.BlisMemory.GetMemory(key);
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 3:
                        curAppId = _a.sent();
                        _i = 0, appIds_2 = appIds;
                        _a.label = 4;
                    case 4:
                        if (!(_i < appIds_2.length)) return [3 /*break*/, 7];
                        appId = appIds_2[_i];
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.DeleteApp(curAppId, appId)];
                    case 5:
                        text = _a.sent();
                        BlisDebug_1.BlisDebug.Log("Deleted " + appId + " apps");
                        _a.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 4];
                    case 7: 
                    // No longer have an active app
                    return [4 /*yield*/, memory.BotState().SetAppId(null)];
                    case 8:
                        // No longer have an active app
                        _a.sent();
                        return [4 /*yield*/, memory.BotState().SetModelId(null)];
                    case 9:
                        _a.sent();
                        return [4 /*yield*/, memory.BotState().SetSessionId(null)];
                    case 10:
                        _a.sent();
                        return [2 /*return*/, AdminResponse_1.AdminResponse.Result(true)];
                    case 11:
                        error_4 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_4);
                        return [2 /*return*/, AdminResponse_1.AdminResponse.Error(errMsg)];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    BlisApp.Sort = function (apps) {
        return apps.sort(function (n1, n2) {
            var c1 = n1.appName.toLowerCase();
            var c2 = n2.appName.toLowerCase();
            if (c1 > c2) {
                return 1;
            }
            if (c1 < c2) {
                return -1;
            }
            return 0;
        });
    };
    return BlisApp;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('appName'),
    tslib_1.__metadata("design:type", String)
], BlisApp.prototype, "appName", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('appId'),
    tslib_1.__metadata("design:type", String)
], BlisApp.prototype, "appId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('luisKey'),
    tslib_1.__metadata("design:type", String)
], BlisApp.prototype, "luisKey", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('locale'),
    tslib_1.__metadata("design:type", String)
], BlisApp.prototype, "locale", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: BlisAppMetaData, name: 'metadata' }),
    tslib_1.__metadata("design:type", BlisAppMetaData)
], BlisApp.prototype, "metadata", void 0);
exports.BlisApp = BlisApp;
var BlisAppList = (function () {
    function BlisAppList(init) {
        this.apps = undefined;
        Object.assign(this, init);
    }
    return BlisAppList;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('apps'),
    tslib_1.__metadata("design:type", Array)
], BlisAppList.prototype, "apps", void 0);
exports.BlisAppList = BlisAppList;
var BlisApp_v1 = (function () {
    function BlisApp_v1(init) {
        this.name = undefined;
        this.id = undefined;
        Object.assign(this, init);
    }
    BlisApp_v1.Sort_v1 = function (apps) {
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
    BlisApp_v1.HaveApp_v1 = function (appId, context, cb) {
        if (appId == null) {
            cb(Menu_1.Menu.AppPanel('No Application has been loaded'));
            return false;
        }
        return true;
    };
    BlisApp_v1.Create_v1 = function (context, appName, luisKey, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg, msg, appId, card, error_5, errMsg;
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
                            cb(Menu_1.Menu.AppPanel(msg));
                            return [2 /*return*/];
                        }
                        if (!luisKey) {
                            msg = "You must provide a luisKey for your application.";
                            cb(Menu_1.Menu.AppPanel(msg));
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.CreateApp_v1(appName, luisKey)
                            // Initialize
                        ];
                    case 2:
                        appId = _a.sent();
                        // Initialize
                        return [4 /*yield*/, context.Memory().Init(appId)];
                    case 3:
                        // Initialize
                        _a.sent();
                        card = Utils_1.Utils.MakeHero("Created App", appName, null, null);
                        cb(Menu_1.Menu.AddEditCards(context, [card]));
                        return [3 /*break*/, 5];
                    case 4:
                        error_5 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_5);
                        cb([errMsg]);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /** Get all apps, filter by Search term */
    BlisApp_v1.GetAll_v1 = function (context, search, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var debug, appIds, json, msg, responses, apps, _i, appIds_3, appId_1, blisApp, memory, appId, _a, apps_1, app, error_6, errMsg;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting apps");
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 8, , 9]);
                        debug = false;
                        if (search && search.indexOf(Consts_1.ActionCommand.DEBUG) > -1) {
                            debug = true;
                            search = search.replace(Consts_1.ActionCommand.DEBUG, "");
                        }
                        appIds = [];
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.GetApps()];
                    case 2:
                        json = _b.sent();
                        appIds = JSON.parse(json)['ids'];
                        BlisDebug_1.BlisDebug.Log("Found " + appIds.length + " apps");
                        if (appIds.length == 0) {
                            cb(Menu_1.Menu.AppPanel("This account contains no apps."));
                        }
                        msg = "";
                        responses = [];
                        apps = [];
                        if (search)
                            search = search.toLowerCase();
                        _i = 0, appIds_3 = appIds;
                        _b.label = 3;
                    case 3:
                        if (!(_i < appIds_3.length)) return [3 /*break*/, 6];
                        appId_1 = appIds_3[_i];
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.GetApp_v1(appId_1)];
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
                        apps = BlisApp_v1.Sort_v1(apps);
                        memory = context.Memory();
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 7:
                        appId = _b.sent();
                        // Genrate output
                        for (_a = 0, apps_1 = apps; _a < apps_1.length; _a++) {
                            app = apps_1[_a];
                            if (debug) {
                                msg += app.name + " : " + app.id + "\n\n";
                            }
                            else {
                                if (!appId) {
                                    responses.push(Utils_1.Utils.MakeHero(app.name, null, null, {
                                        "Load": Command_1.LineCommands.LOADAPP + " " + app.id,
                                        "Delete": Command_1.IntCommands.DELETEAPP + " " + app.id
                                    }));
                                }
                                else if (app.id == appId) {
                                    responses.push(Utils_1.Utils.MakeHero(app.name + " (LOADED)", null, null, {
                                        "Delete": Command_1.IntCommands.DELETEAPP + " " + app.id
                                    }));
                                }
                                else {
                                    responses.push(Utils_1.Utils.MakeHero(app.name, null, null, {
                                        "Load": Command_1.LineCommands.LOADAPP + " " + app.id,
                                        "Import": Command_1.LineCommands.IMPORTAPP + " " + app.id,
                                        "Delete": Command_1.IntCommands.DELETEAPP + " " + app.id
                                    }));
                                }
                            }
                        }
                        if (debug)
                            responses.push(msg);
                        if (responses.length == 0) {
                            responses.push("No Apps match your query.");
                        }
                        responses.push(null, Menu_1.Menu.Home());
                        cb(responses);
                        return [3 /*break*/, 9];
                    case 8:
                        error_6 = _b.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_6);
                        cb([errMsg]);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /** Delete all apps associated with this account */
    BlisApp_v1.DeleteAll_v1 = function (context, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var appIds, json, memory, appId, _i, appIds_4, appId_2, text, error_7, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete All Applications");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 11, , 12]);
                        appIds = [];
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.GetApps()];
                    case 2:
                        json = _a.sent();
                        appIds = JSON.parse(json)['ids'];
                        BlisDebug_1.BlisDebug.Log("Found " + appIds.length + " apps");
                        memory = context.Memory();
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 3:
                        appId = _a.sent();
                        _i = 0, appIds_4 = appIds;
                        _a.label = 4;
                    case 4:
                        if (!(_i < appIds_4.length)) return [3 /*break*/, 7];
                        appId_2 = appIds_4[_i];
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.DeleteApp(appId_2, appId_2)];
                    case 5:
                        text = _a.sent();
                        BlisDebug_1.BlisDebug.Log("Deleted " + appId_2 + " apps");
                        _a.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 4];
                    case 7: 
                    // No longer have an active app
                    return [4 /*yield*/, memory.BotState().SetAppId(null)];
                    case 8:
                        // No longer have an active app
                        _a.sent();
                        return [4 /*yield*/, memory.BotState().SetModelId(null)];
                    case 9:
                        _a.sent();
                        return [4 /*yield*/, memory.BotState().SetSessionId(null)];
                    case 10:
                        _a.sent();
                        cb(Menu_1.Menu.AddEditCards(context, ["Done"]));
                        return [3 /*break*/, 12];
                    case 11:
                        error_7 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_7);
                        cb([errMsg]);
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    BlisApp_v1.Delete_v1 = function (context, appId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg, memory, curAppId, cards, error_8, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Application");
                        if (!appId) {
                            msg = Help_1.BlisHelp.Get(Command_1.HelpCommands.DELETEAPP);
                            cb(msg);
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 10]);
                        memory = context.Memory();
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 2:
                        curAppId = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.DeleteApp(curAppId, appId)];
                    case 3:
                        _a.sent();
                        cards = [];
                        cards.push(Utils_1.Utils.MakeHero("Deleted App", appId, null, null));
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
                        cards.push(null); // Line break
                        cards = cards.concat(Menu_1.Menu.AppPanel('No App Loaded', 'Load or Create one'));
                        cb(cards);
                        return [3 /*break*/, 8];
                    case 7:
                        cb(Menu_1.Menu.AddEditCards(context, cards));
                        _a.label = 8;
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        error_8 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_8);
                        cb([errMsg]);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    return BlisApp_v1;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('app-name'),
    tslib_1.__metadata("design:type", String)
], BlisApp_v1.prototype, "name", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('model-id'),
    tslib_1.__metadata("design:type", String)
], BlisApp_v1.prototype, "id", void 0);
exports.BlisApp_v1 = BlisApp_v1;
//# sourceMappingURL=BlisApp.js.map