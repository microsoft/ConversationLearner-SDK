"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var BlisDebug_1 = require("../BlisDebug");
var BlisClient_1 = require("../BlisClient");
var Action_1 = require("./Action");
var Utils_1 = require("../Utils");
var json_typescript_mapper_2 = require("json-typescript-mapper");
var Entity_1 = require("./Entity");
var Menu_1 = require("../Menu");
var TrainDialog_1 = require("./TrainDialog");
var BlisAppContent = (function () {
    function BlisAppContent(init) {
        this.actions = undefined;
        this.entities = undefined;
        this.trainDialogs = undefined;
        this.appVersion = undefined;
        Object.assign(this, init);
    }
    BlisAppContent.prototype.FindTrainDialogs = function (appId, searchTerm) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var dialogs, _i, _a, trainDialog, dialog;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        dialogs = [];
                        searchTerm = searchTerm.toLowerCase();
                        _i = 0, _a = this.trainDialogs;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        trainDialog = _a[_i];
                        return [4 /*yield*/, trainDialog.toText(appId)];
                    case 2:
                        dialog = _b.sent();
                        if (!searchTerm || dialog.toLowerCase().indexOf(searchTerm) > 0) {
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
            var memory, appId, dialogIds, BlisAppContent_1, msg, error_1, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Exporting App");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        memory = context.Memory();
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 2:
                        appId = _a.sent();
                        dialogIds = [];
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.ExportApp(appId)];
                    case 3:
                        BlisAppContent_1 = _a.sent();
                        msg = JSON.stringify(json_typescript_mapper_1.serialize(BlisAppContent_1));
                        if (context.Address().channelId == "emulator") {
                            cb([msg]);
                        }
                        else {
                            Utils_1.Utils.SendAsAttachment(context, msg);
                            cb([""]);
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_1);
                        cb([errMsg]);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /** Import (and merge) application with given appId */
    BlisAppContent.Import = function (context, appId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, curAppId, currentApp, mergeApp, finalApp, responses, error_2, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        memory = context.Memory();
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 1:
                        curAppId = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.ExportApp(curAppId)];
                    case 2:
                        currentApp = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.ExportApp(appId)];
                    case 3:
                        mergeApp = _a.sent();
                        // Merge any duplicate entities
                        mergeApp = this.MergeEntities(currentApp, mergeApp);
                        // Merge any duplicate actions
                        mergeApp = this.MergeActions(currentApp, mergeApp);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.ImportApp(curAppId, mergeApp)];
                    case 4:
                        finalApp = _a.sent();
                        return [4 /*yield*/, this.Load(context, curAppId)];
                    case 5:
                        responses = _a.sent();
                        cb(responses);
                        return [3 /*break*/, 7];
                    case 6:
                        error_2 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_2);
                        cb([errMsg]);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /** Import application from sent attachment */
    BlisAppContent.ImportAttachment = function (context, attachment, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var text, json, blisApp, memory, appId, newApp, reponses, error_3, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (attachment.contentType != "text/plain") {
                            cb("Expected a text file for import.");
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, Utils_1.Utils.ReadFromFile(attachment.contentUrl)
                            // Import new training data
                        ];
                    case 2:
                        text = _a.sent();
                        json = JSON.parse(text);
                        blisApp = json_typescript_mapper_1.deserialize(BlisAppContent, json);
                        memory = context.Memory();
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 3:
                        appId = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.ImportApp(appId, blisApp)
                            // Reload the app
                        ];
                    case 4:
                        newApp = _a.sent();
                        return [4 /*yield*/, BlisAppContent.Load(context, appId)];
                    case 5:
                        reponses = _a.sent();
                        cb(reponses);
                        return [3 /*break*/, 7];
                    case 6:
                        error_3 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_3);
                        cb(error_3);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    BlisAppContent.Load = function (context, appId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, app, error_4, numActions, modelId, error_5, errMsg, error_6, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 19, , 20]);
                        memory = context.Memory();
                        if (!appId) {
                            return [2 /*return*/, [Menu_1.Menu.Home("You must provide the ID of the application to load.")]];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 6]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetApp(appId)];
                    case 2:
                        app = _a.sent();
                        return [4 /*yield*/, memory.BotState().SetAppId(app.id)];
                    case 3:
                        _a.sent();
                        BlisDebug_1.BlisDebug.Log("Loaded App: " + app.id);
                        return [3 /*break*/, 6];
                    case 4:
                        error_4 = _a.sent();
                        // Bad App
                        return [4 /*yield*/, memory.BotState().SetAppId(null)];
                    case 5:
                        // Bad App
                        _a.sent();
                        throw error_4;
                    case 6: 
                    // Load entities to generate lookup table
                    return [4 /*yield*/, Entity_1.Entity_v1.Get_v1(context, null, function (text) {
                            BlisDebug_1.BlisDebug.Log("Entity lookup generated");
                        })];
                    case 7:
                        // Load entities to generate lookup table
                        _a.sent();
                        return [4 /*yield*/, Action_1.Action_v1.GetAll_v1(context, null, null, function (text) {
                                BlisDebug_1.BlisDebug.Log("Action lookup generated");
                            })];
                    case 8:
                        numActions = _a.sent();
                        if (!numActions) {
                            return [2 /*return*/, [Menu_1.Menu.Home("Application loaded.  No Actions found.")]];
                        }
                        modelId = null;
                        _a.label = 9;
                    case 9:
                        _a.trys.push([9, 14, , 17]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetModel(appId)];
                    case 10:
                        // Load or train a new modelId
                        modelId = _a.sent();
                        if (!!modelId) return [3 /*break*/, 13];
                        Utils_1.Utils.SendMessage(context, "Training the model...");
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.TrainModel(appId)];
                    case 11:
                        modelId = _a.sent();
                        return [4 /*yield*/, memory.BotState().SetModelId(modelId)];
                    case 12:
                        _a.sent();
                        BlisDebug_1.BlisDebug.Log("Model trained: " + modelId);
                        _a.label = 13;
                    case 13: return [3 /*break*/, 17];
                    case 14:
                        error_5 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_5);
                        Utils_1.Utils.SendMessage(context, errMsg + "\n\n\n\nFailed. Retraining the model from scratch...");
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.TrainModel(appId, true)];
                    case 15:
                        modelId = _a.sent();
                        return [4 /*yield*/, memory.BotState().SetModelId(modelId)];
                    case 16:
                        _a.sent();
                        BlisDebug_1.BlisDebug.Log("Model trained: " + modelId);
                        return [3 /*break*/, 17];
                    case 17:
                        BlisDebug_1.BlisDebug.Log("Loaded Model: " + modelId);
                        return [4 /*yield*/, memory.BotState().SetModelId(modelId)];
                    case 18:
                        _a.sent();
                        return [2 /*return*/, [Menu_1.Menu.Home("Application loaded.")]];
                    case 19:
                        error_6 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_6);
                        return [2 /*return*/, [errMsg]];
                    case 20: return [2 /*return*/];
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
                if (action1.Equal_v1(action2)) {
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
    json_typescript_mapper_2.JsonProperty({ clazz: Action_1.Action_v1, name: 'actions' }),
    tslib_1.__metadata("design:type", Array)
], BlisAppContent.prototype, "actions", void 0);
tslib_1.__decorate([
    json_typescript_mapper_2.JsonProperty({ clazz: Entity_1.Entity_v1, name: 'entities' }),
    tslib_1.__metadata("design:type", Array)
], BlisAppContent.prototype, "entities", void 0);
tslib_1.__decorate([
    json_typescript_mapper_2.JsonProperty({ clazz: TrainDialog_1.TrainDialog, name: 'traindialogs' }),
    tslib_1.__metadata("design:type", Array)
], BlisAppContent.prototype, "trainDialogs", void 0);
tslib_1.__decorate([
    json_typescript_mapper_2.JsonProperty('blis-app-version'),
    tslib_1.__metadata("design:type", String)
], BlisAppContent.prototype, "appVersion", void 0);
exports.BlisAppContent = BlisAppContent;
//# sourceMappingURL=BlisAppContent.js.map