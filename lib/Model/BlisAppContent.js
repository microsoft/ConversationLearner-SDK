"use strict";
var tslib_1 = require("tslib");
var BlisUserState_1 = require("../BlisUserState");
var BlisDebug_1 = require("../BlisDebug");
var Consts_1 = require("../Model/Consts");
var Help_1 = require("../Model/Help");
var BlisMemory_1 = require("../BlisMemory");
var Action_1 = require("../Model/Action");
var Utils_1 = require("../Utils");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Entity_1 = require("./Entity");
var TrainDialog_1 = require("./TrainDialog");
var BlisAppContent = (function () {
    function BlisAppContent(init) {
        this.actions = undefined;
        this.entities = undefined;
        this.trainDialogs = undefined;
        this.appVersion = undefined;
        Object.assign(this, init);
    }
    BlisAppContent.prototype.FindTrainDialogs = function (client, appId, searchTerm) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var dialogs, _i, _a, trainDialog, dialog;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        dialogs = [];
                        _i = 0, _a = this.trainDialogs;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        trainDialog = _a[_i];
                        return [4 /*yield*/, trainDialog.toText(client, appId)];
                    case 2:
                        dialog = _b.sent();
                        if (!searchTerm || dialog.indexOf(searchTerm) > 0) {
                            dialogs.push({ 'dialogId': trainDialog.id, 'text': dialog });
                        }
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, dialogs];
                }
            });
        });
    };
    BlisAppContent.Export = function (context, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var dialogIds, BlisAppContent_1, msg, error_1, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Exporting App");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        dialogIds = [];
                        return [4 /*yield*/, context.client.ExportApp(context.state[Consts_1.UserStates.APP])];
                    case 2:
                        BlisAppContent_1 = _a.sent();
                        msg = JSON.stringify(BlisAppContent_1);
                        if (context.address.channelId == "emulator") {
                            cb(msg);
                        }
                        else {
                            Utils_1.Utils.SendAsAttachment(context, msg);
                            cb("");
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_1);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb(errMsg);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /** Import (and merge) application with given appId */
    BlisAppContent.Import = function (context, appId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var currentApp, mergeApp, finalApp, memory, error_2, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, context.client.ExportApp(context.state[Consts_1.UserStates.APP])];
                    case 1:
                        currentApp = _a.sent();
                        return [4 /*yield*/, context.client.ExportApp(appId)];
                    case 2:
                        mergeApp = _a.sent();
                        // Merge any duplicate entities
                        mergeApp = this.MergeEntities(currentApp, mergeApp);
                        // Merge any duplicate actions
                        mergeApp = this.MergeActions(currentApp, mergeApp);
                        return [4 /*yield*/, context.client.ImportApp(context.state[Consts_1.UserStates.APP], mergeApp)];
                    case 3:
                        finalApp = _a.sent();
                        memory = new BlisMemory_1.BlisMemory(context);
                        this.Load(context, memory.AppId(), function (text) {
                            cb(text);
                        });
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_2);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb(errMsg);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /** Import application from sent attachment */
    BlisAppContent.ImportAttachment = function (context, attachment, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var text, json, newApp, memory, error_3, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (attachment.contentType != "text/plain") {
                            cb("Expected a text file for import.");
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, Utils_1.Utils.ReadFromFile(attachment.contentUrl)];
                    case 2:
                        text = _a.sent();
                        json = JSON.parse(text);
                        return [4 /*yield*/, context.client.ImportApp(context.state[Consts_1.UserStates.APP], json)];
                    case 3:
                        newApp = _a.sent();
                        memory = new BlisMemory_1.BlisMemory(context);
                        BlisAppContent.Load(context, memory.AppId(), function (text) {
                            cb(text);
                        });
                        return [3 /*break*/, 5];
                    case 4:
                        error_3 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_3);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb(text);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    BlisAppContent.Load = function (context, appId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg, loadedId, numActions, modelId, sessionId, error_4, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        // TODO - temp debug
                        if (appId == '*') {
                            appId = '0241bae4-ebba-45ca-88b2-2543339c4e6d';
                        }
                        if (!appId) {
                            msg = Help_1.BlisHelp.CommandHelpString(Consts_1.Commands.LOADAPP, "You must provide the ID of the application to load.");
                            cb(msg);
                            return [2 /*return*/];
                        }
                        // Initialize
                        Object.assign(context.state, new BlisUserState_1.BlisUserState(appId));
                        return [4 /*yield*/, context.client.GetApp(appId)];
                    case 1:
                        loadedId = _a.sent();
                        BlisDebug_1.BlisDebug.Log("Loaded App: " + loadedId);
                        // Load entities to generate lookup table
                        return [4 /*yield*/, Entity_1.Entity.Get(context, null, function (text) {
                                BlisDebug_1.BlisDebug.Log("Entity lookup generated");
                            })];
                    case 2:
                        // Load entities to generate lookup table
                        _a.sent();
                        return [4 /*yield*/, Action_1.Action.Get(context, null, null, function (text) {
                                BlisDebug_1.BlisDebug.Log("Action lookup generated");
                            })];
                    case 3:
                        numActions = _a.sent();
                        if (numActions == 0) {
                            cb("Application loaded.  No Actions found.");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, context.client.GetModel(context.state[Consts_1.UserStates.APP])];
                    case 4:
                        modelId = _a.sent();
                        if (!!context.state[Consts_1.UserStates.MODEL]) return [3 /*break*/, 6];
                        BlisDebug_1.BlisDebug.Log("Training the model...");
                        return [4 /*yield*/, context.client.TrainModel(context.state)];
                    case 5:
                        modelId = _a.sent();
                        BlisDebug_1.BlisDebug.Log("Model trained: " + modelId);
                        _a.label = 6;
                    case 6:
                        BlisDebug_1.BlisDebug.Log("Loaded Model: " + modelId);
                        context.state[Consts_1.UserStates.MODEL] = modelId;
                        // Create session
                        BlisDebug_1.BlisDebug.Log("Creating session...");
                        return [4 /*yield*/, context.client.StartSession(context.state[Consts_1.UserStates.APP])];
                    case 7:
                        sessionId = _a.sent();
                        BlisDebug_1.BlisDebug.Log("Stared Session: " + appId);
                        new BlisMemory_1.BlisMemory(context).StartSession(sessionId, false);
                        cb("Application loaded and Session started.");
                        return [3 /*break*/, 9];
                    case 8:
                        error_4 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_4);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb(errMsg);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /** Swap matched items in swapList */
    BlisAppContent.SwapMatches = function (ids, swapList) {
        if (Object.keys(swapList).length == 0) {
            return ids;
        }
        var items = [];
        for (var _i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
            var id = ids_1[_i];
            if (swapList[id]) {
                items.push(swapList[id]);
            }
            else {
                items.push(id);
            }
        }
        return items;
    };
    /** Merge entites */
    BlisAppContent.MergeEntities = function (app1, app2) {
        // Find duplicate entities, use originals from app1
        var mergedEntities = [];
        var swapList = {};
        for (var _i = 0, _a = app2.entities; _i < _a.length; _i++) {
            var entity2 = _a[_i];
            var swap = false;
            for (var _b = 0, _c = app1.entities; _b < _c.length; _b++) {
                var entity1 = _c[_b];
                // If entity name is same, use original entity
                if (entity1.Equal(entity2)) {
                    swapList[entity2.id] = entity1.id;
                    swap = true;
                    break;
                }
            }
            if (!swap) {
                mergedEntities.push(entity2);
            }
        }
        app2.entities = mergedEntities;
        // Make sure all other entity references are correct
        for (var _d = 0, _e = app2.actions; _d < _e.length; _d++) {
            var action = _e[_d];
            // Swap entities
            action.negativeEntities = this.SwapMatches(action.negativeEntities, swapList);
            action.requiredEntities = this.SwapMatches(action.requiredEntities, swapList);
        }
        // Now swap entities for training dialogs
        for (var _f = 0, _g = app2.trainDialogs; _f < _g.length; _f++) {
            var trainDialog = _g[_f];
            for (var _h = 0, _j = trainDialog.dialog.turns; _h < _j.length; _h++) {
                var turn = _j[_h];
                turn.input.entityIds = this.SwapMatches(turn.input.entityIds, swapList);
            }
        }
        return app2;
    };
    /** Merge actions */
    BlisAppContent.MergeActions = function (app1, app2) {
        // Find duplicate actions, use originals from app1
        var mergedActions = [];
        var swapList = {};
        for (var _i = 0, _a = app2.actions; _i < _a.length; _i++) {
            var action2 = _a[_i];
            var swap = false;
            for (var _b = 0, _c = app1.actions; _b < _c.length; _b++) {
                var action1 = _c[_b];
                // If entity name is same, use original entity
                if (action1.Equal(action2)) {
                    swapList[action2.id] = action1.id;
                    swap = true;
                    break;
                }
            }
            if (!swap) {
                mergedActions.push(action2);
            }
        }
        app2.actions = mergedActions;
        // Now swap actions in training dialogs
        for (var _d = 0, _e = app2.trainDialogs; _d < _e.length; _d++) {
            var trainDialog = _e[_d];
            for (var _f = 0, _g = trainDialog.dialog.turns; _f < _g.length; _f++) {
                var turn = _g[_f];
                var swapAction = swapList[turn.actionId];
                if (swapAction) {
                    turn.actionId = swapAction;
                }
                turn.input.maskedActionIds = this.SwapMatches(turn.input.maskedActionIds, swapList);
            }
        }
        return app2;
    };
    return BlisAppContent;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Action_1.Action, name: 'actions' }),
    tslib_1.__metadata("design:type", Array)
], BlisAppContent.prototype, "actions", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Entity_1.Entity, name: 'entities' }),
    tslib_1.__metadata("design:type", Array)
], BlisAppContent.prototype, "entities", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: TrainDialog_1.TrainDialog, name: 'traindialogs' }),
    tslib_1.__metadata("design:type", Array)
], BlisAppContent.prototype, "trainDialogs", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('blis-app-version'),
    tslib_1.__metadata("design:type", String)
], BlisAppContent.prototype, "appVersion", void 0);
exports.BlisAppContent = BlisAppContent;
//# sourceMappingURL=BlisAppContent.js.map