"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var BlisApp_1 = require("../Model/BlisApp");
var AdminResponse_1 = require("../Model/AdminResponse");
var BlisDebug_1 = require("../BlisDebug");
var BlisClient_1 = require("../BlisClient");
var Consts_1 = require("../Model/Consts");
var Command_1 = require("./Command");
var BlisMemory_1 = require("../BlisMemory");
var Utils_1 = require("../Utils");
var Menu_1 = require("../Menu");
var ActionMetaData = (function () {
    function ActionMetaData(init) {
        this.actionType = undefined;
        Object.assign(this, init);
    }
    ActionMetaData.prototype.Equal = function (metaData) {
        if (this.actionType != metaData.actionType)
            return false;
        return true;
    };
    return ActionMetaData;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('actionType'),
    tslib_1.__metadata("design:type", String)
], ActionMetaData.prototype, "actionType", void 0);
exports.ActionMetaData = ActionMetaData;
var ActionMetaData_v1 = (function () {
    function ActionMetaData_v1(init) {
        this.type = undefined;
        this.version = undefined;
        this.packageCreationId = undefined;
        this.packageDeletionId = undefined;
        Object.assign(this, init);
    }
    ActionMetaData_v1.prototype.Equal = function (metaData) {
        if (this.type != metaData.type)
            return false;
        return true;
    };
    return ActionMetaData_v1;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('type'),
    tslib_1.__metadata("design:type", String)
], ActionMetaData_v1.prototype, "type", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('version'),
    tslib_1.__metadata("design:type", Number)
], ActionMetaData_v1.prototype, "version", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('packageCreationId'),
    tslib_1.__metadata("design:type", Number)
], ActionMetaData_v1.prototype, "packageCreationId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('packageDeletionId'),
    tslib_1.__metadata("design:type", Number)
], ActionMetaData_v1.prototype, "packageDeletionId", void 0);
exports.ActionMetaData_v1 = ActionMetaData_v1;
var ActionSet = (function () {
    function ActionSet(actionType) {
        this.actionType = actionType;
        this.negIds = [];
        this.posIds = [];
        this.negNames = [];
        this.posNames = [];
    }
    return ActionSet;
}());
var Action = (function () {
    function Action(init) {
        this.actionId = undefined;
        this.payload = undefined;
        this.isTerminal = undefined;
        this.requiredEntities = undefined;
        this.negativeEntities = undefined;
        this.version = undefined;
        this.packageCreationId = undefined;
        this.packageDeletionId = undefined;
        this.metadata = new ActionMetaData();
        Object.assign(this, init);
    }
    /** Returns true if content of action is equal */
    /** ID, version and package do not matter      */
    Action.prototype.Equal = function (action) {
        if (this.payload != action.payload)
            return false;
        if (this.isTerminal != action.isTerminal)
            return false;
        if (this.negativeEntities.length != action.negativeEntities.length)
            return false;
        if (this.requiredEntities.length != action.requiredEntities.length)
            return false;
        for (var _i = 0, _a = this.negativeEntities; _i < _a.length; _i++) {
            var negEntity = _a[_i];
            if (action.negativeEntities.indexOf(negEntity) < 0)
                return false;
        }
        for (var _b = 0, _c = this.requiredEntities; _b < _c.length; _b++) {
            var reqEntity = _c[_b];
            if (action.requiredEntities.indexOf(reqEntity) < 0)
                return false;
        }
        return this.metadata.Equal(action.metadata);
    };
    Action.Add = function (appId, action) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var actionId;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, BlisClient_1.BlisClient.client.AddAction(appId, action)];
                    case 1:
                        actionId = _a.sent();
                        return [2 /*return*/, AdminResponse_1.AdminResponse.Result(actionId)];
                }
            });
        });
    };
    Action.Edit = function (appId, action) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var actionId;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, BlisClient_1.BlisClient.client.EditAction(appId, action)];
                    case 1:
                        actionId = _a.sent();
                        return [2 /*return*/, AdminResponse_1.AdminResponse.Result(actionId)];
                }
            });
        });
    };
    /** Delete Action with the given actionId */
    Action.Delete = function (appId, actionId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var action, inUse, msg, error_1, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Action");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        if (!actionId) {
                            return [2 /*return*/, AdminResponse_1.AdminResponse.Error("You must provide the ID of the action to delete.")];
                        }
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetAction(appId, actionId)];
                    case 2:
                        action = _a.sent();
                        return [4 /*yield*/, action.InUse(appId)];
                    case 3:
                        inUse = _a.sent();
                        if (inUse) {
                            msg = "Delete Failed " + action.payload + " is being used by App";
                            return [2 /*return*/, AdminResponse_1.AdminResponse.Error(msg)];
                        }
                        // TODO clear savelookup
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.DeleteAction(appId, actionId)];
                    case 4:
                        // TODO clear savelookup
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_1);
                        return [2 /*return*/, AdminResponse_1.AdminResponse.Error(errMsg)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /** Get actions. */
    Action.GetAll = function (key, actionType, search) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, appId, debug, actionIds, json, textactions, apiactions, actions, _i, actionIds_1, actionId, action, error_2, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting actions");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        memory = BlisMemory_1.BlisMemory.GetMemory(key);
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 2:
                        appId = _a.sent();
                        if (!appId) {
                            return [2 /*return*/, AdminResponse_1.AdminResponse.Error("No app in memory")];
                        }
                        debug = false;
                        if (search && search.indexOf(Consts_1.ActionCommand.DEBUG) > -1) {
                            debug = true;
                            search = search.replace(Consts_1.ActionCommand.DEBUG, "");
                        }
                        actionIds = [];
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetActions(appId)];
                    case 3:
                        json = _a.sent();
                        actionIds = JSON.parse(json)['ids'];
                        BlisDebug_1.BlisDebug.Log("Found " + actionIds.length + " actions");
                        if (actionIds.length == 0) {
                            return [2 /*return*/, AdminResponse_1.AdminResponse.Result([])];
                        }
                        textactions = "";
                        apiactions = "";
                        actions = [];
                        if (search)
                            search = search.toLowerCase();
                        _i = 0, actionIds_1 = actionIds;
                        _a.label = 4;
                    case 4:
                        if (!(_i < actionIds_1.length)) return [3 /*break*/, 7];
                        actionId = actionIds_1[_i];
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetAction(appId, actionId)];
                    case 5:
                        action = _a.sent();
                        if ((!search || action.payload.toLowerCase().indexOf(search) > -1) && (!actionType || action.metadata.actionType == actionType)) {
                            actions.push(action);
                            BlisDebug_1.BlisDebug.Log("Action lookup: " + action.payload + " : " + action.metadata.actionType);
                        }
                        _a.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 4];
                    case 7:
                        // Sort
                        actions = Action.Sort(actions);
                        return [2 /*return*/, AdminResponse_1.AdminResponse.Result(actions)];
                    case 8:
                        error_2 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_2);
                        return [2 /*return*/, AdminResponse_1.AdminResponse.Error(errMsg)];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    Action.Sort = function (actions) {
        return actions.sort(function (n1, n2) {
            var c1 = n1.payload.toLowerCase();
            var c2 = n2.payload.toLowerCase();
            if (c1 > c2) {
                return 1;
            }
            if (c1 < c2) {
                return -1;
            }
            return 0;
        });
    };
    /** Is the Activity used anywhere */
    Action.prototype.InUse = function (appId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var appContent, appString;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, BlisClient_1.BlisClient.client.ExportApp(appId)];
                    case 1:
                        appContent = _a.sent();
                        // Clear actions
                        appContent.actions = null;
                        appString = JSON.stringify(appContent);
                        // Negative also can't be in use
                        return [2 /*return*/, (appString.indexOf(this.actionId) > -1)];
                }
            });
        });
    };
    return Action;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('actionId'),
    tslib_1.__metadata("design:type", String)
], Action.prototype, "actionId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('payload'),
    tslib_1.__metadata("design:type", String)
], Action.prototype, "payload", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('isTerminal'),
    tslib_1.__metadata("design:type", Boolean)
], Action.prototype, "isTerminal", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('requiredEntities'),
    tslib_1.__metadata("design:type", Array)
], Action.prototype, "requiredEntities", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('negativeEntities'),
    tslib_1.__metadata("design:type", Array)
], Action.prototype, "negativeEntities", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('version'),
    tslib_1.__metadata("design:type", Number)
], Action.prototype, "version", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('packageCreationId'),
    tslib_1.__metadata("design:type", Number)
], Action.prototype, "packageCreationId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('packageDeletionId'),
    tslib_1.__metadata("design:type", Number)
], Action.prototype, "packageDeletionId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: ActionMetaData, name: 'metadata' }),
    tslib_1.__metadata("design:type", ActionMetaData)
], Action.prototype, "metadata", void 0);
exports.Action = Action;
var Action_v1 = (function () {
    function Action_v1(init) {
        this.id = undefined;
        this.actionType = undefined;
        this.content = undefined;
        this.negativeEntities = undefined;
        this.requiredEntities = undefined;
        this.waitAction = undefined;
        this.metadata = new ActionMetaData_v1();
        Object.assign(this, init);
    }
    Action_v1.prototype.TOV2 = function () {
        var metadataV2 = new ActionMetaData();
        if (this.actionType == Consts_1.ActionTypes_v1.API) {
            if (this.metadata.type == Consts_1.APITypes_v1.AZURE) {
                metadataV2.actionType = Consts_1.ActionTypes.API_AZURE;
            }
            else if (this.metadata.type == Consts_1.APITypes_v1.INTENT) {
                metadataV2.actionType = Consts_1.ActionTypes.INTENT;
            }
            else {
                metadataV2.actionType = Consts_1.ActionTypes.API_LOCAL;
            }
        }
        else if (this.actionType == Consts_1.ActionTypes_v1.CARD) {
            metadataV2.actionType = Consts_1.ActionTypes.CARD;
        }
        else {
            metadataV2.actionType = Consts_1.ActionTypes.INTENT;
        }
        return new Action({
            actionId: this.id,
            payload: this.content,
            isTerminal: this.waitAction,
            requiredEntities: this.requiredEntities,
            negativeEntities: this.negativeEntities,
            version: this.metadata.version,
            packageCreationId: this.metadata.packageCreationId,
            packageDeletionId: this.metadata.packageDeletionId,
            metadata: metadataV2
        });
    };
    Action_v1.TOV1 = function (action) {
        var metadataV1 = new ActionMetaData_v1();
        var actionType = undefined;
        switch (action.metadata.actionType) {
            case (Consts_1.ActionTypes.API_AZURE):
                actionType = Consts_1.ActionTypes_v1.API;
                metadataV1.type = Consts_1.APITypes_v1.AZURE;
                break;
            case (Consts_1.ActionTypes.API_LOCAL):
                actionType = Consts_1.ActionTypes_v1.API;
                metadataV1.type = Consts_1.APITypes_v1.LOCAL;
                break;
            case (Consts_1.ActionTypes.CARD):
                actionType = Consts_1.ActionTypes_v1.CARD;
                metadataV1.type = undefined;
                break;
            case (Consts_1.ActionTypes.INTENT):
                actionType = Consts_1.ActionTypes_v1.API;
                metadataV1.type = Consts_1.APITypes_v1.INTENT;
                break;
            case (Consts_1.ActionTypes.TEXT):
                actionType = Consts_1.ActionTypes_v1.TEXT;
                metadataV1.type = undefined;
                break;
        }
        metadataV1.version = action.version;
        metadataV1.packageCreationId = action.packageCreationId;
        metadataV1.packageDeletionId = action.packageDeletionId;
        return new Action_v1({
            id: action.actionId,
            actionType: actionType,
            content: action.payload,
            negativeEntities: action.negativeEntities,
            requiredEntities: action.requiredEntities,
            waitAction: action.isTerminal,
            metadata: metadataV1
        });
    };
    Action_v1.prototype.Equal_v1 = function (action) {
        if (this.actionType != action.actionType)
            return false;
        if (this.content != action.content)
            return false;
        if (this.negativeEntities.length != action.negativeEntities.length)
            return false;
        if (this.requiredEntities.length != action.requiredEntities.length)
            return false;
        for (var _i = 0, _a = this.negativeEntities; _i < _a.length; _i++) {
            var negEntity = _a[_i];
            if (action.negativeEntities.indexOf(negEntity) < 0)
                return false;
        }
        for (var _b = 0, _c = this.requiredEntities; _b < _c.length; _b++) {
            var reqEntity = _c[_b];
            if (action.requiredEntities.indexOf(reqEntity) < 0)
                return false;
        }
        return true;
    };
    /** Convert into display type */
    Action_v1.prototype.DisplayType_v1 = function () {
        // INTENTs are APIs internally but shown as TEXT responses in UI
        if (this.actionType == Consts_1.ActionTypes_v1.API) {
            return (this.metadata.type != Consts_1.APITypes_v1.INTENT) ? Consts_1.ActionTypes_v1.API : Consts_1.ActionTypes_v1.TEXT;
        }
        else {
            return Consts_1.ActionTypes_v1.TEXT;
        }
    };
    /** Look for entity suggestions in the last action taken */
    // For example: "What is your *name?" suggests user response is likely to be a name
    Action_v1.GetEntitySuggestion = function (actions) {
        if (!actions || actions.length == 0)
            return null;
        // Looks for suggestions in the last action
        var words = this.Split(actions[actions.length - 1]);
        for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
            var word = words_1[_i];
            if (word.startsWith(Consts_1.ActionCommand.SUGGEST)) {
                // Key is in form of $entityName
                var entityName = word.substr(1, word.length - 1);
                return entityName;
            }
        }
        return null;
    };
    Action_v1.toText = function (appId, actionId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var action, msg, error_3;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetAction_v1(appId, actionId)];
                    case 1:
                        action = _a.sent();
                        msg = action.content;
                        if (action.waitAction) {
                            msg += " (WAIT)";
                        }
                        return [2 /*return*/, msg];
                    case 2:
                        error_3 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_3);
                        throw (error_3);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Action_v1.Split = function (action) {
        return action.split(/[\[\]\s,:.?!]+/);
    };
    Action_v1.Sort_v1 = function (actions) {
        return actions.sort(function (n1, n2) {
            var c1 = n1.content.toLowerCase();
            var c2 = n2.content.toLowerCase();
            if (c1 > c2) {
                return 1;
            }
            if (c1 < c2) {
                return -1;
            }
            return 0;
        });
    };
    /** Is the Activity used anywhere */
    Action_v1.prototype.InUse_v1 = function (appId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var appContent, appString;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, BlisClient_1.BlisClient.client.ExportApp(appId)];
                    case 1:
                        appContent = _a.sent();
                        // Clear actions
                        appContent.actions = null;
                        appString = JSON.stringify(appContent);
                        // Negative also can't be in use
                        return [2 /*return*/, (appString.indexOf(this.id) > -1)];
                }
            });
        });
    };
    Action_v1.Buttons = function (id, actionType) {
        var editCommand = (actionType == Consts_1.ActionTypes_v1.API) ? Command_1.CueCommands.EDITAPICALL : Command_1.CueCommands.EDITRESPONSE;
        var buttons = {
            "Edit": editCommand + " " + id,
            "Delete": Command_1.LineCommands.DELETEACTION + " " + id,
        };
        return buttons;
    };
    Action_v1.ProcessCommandString = function (context, actionSet, commandString) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, commandWords, _i, commandWords_1, word, negName, negID, posName, posID;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!commandString)
                            return [2 /*return*/];
                        memory = context.Memory();
                        commandWords = Action_v1.Split(commandString);
                        _i = 0, commandWords_1 = commandWords;
                        _a.label = 1;
                    case 1:
                        if (!(_i < commandWords_1.length)) return [3 /*break*/, 12];
                        word = commandWords_1[_i];
                        if (!word.startsWith(Consts_1.ActionCommand.BLOCK)) return [3 /*break*/, 5];
                        negName = word.slice(Consts_1.ActionCommand.BLOCK.length);
                        if (!(negName == Consts_1.ActionCommand.TERMINAL)) return [3 /*break*/, 2];
                        actionSet.waitAction = false;
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, memory.EntityLookup().ToId(negName)];
                    case 3:
                        negID = _a.sent();
                        if (negID) {
                            actionSet.negIds.push(negID);
                            actionSet.negNames.push(negName);
                        }
                        else {
                            return [2 /*return*/, "Entity " + negName + " not found."];
                        }
                        _a.label = 4;
                    case 4: return [3 /*break*/, 11];
                    case 5:
                        if (!word.startsWith(Consts_1.ActionCommand.REQUIRE)) return [3 /*break*/, 9];
                        posName = word.slice(Consts_1.ActionCommand.REQUIRE.length);
                        if (!(posName == Consts_1.ActionCommand.TERMINAL)) return [3 /*break*/, 6];
                        actionSet.waitAction = true;
                        return [3 /*break*/, 8];
                    case 6:
                        if (!(actionSet.posNames.indexOf(posName) < 0)) return [3 /*break*/, 8];
                        return [4 /*yield*/, memory.EntityLookup().ToId(posName)];
                    case 7:
                        posID = _a.sent();
                        if (posID) {
                            actionSet.posIds.push(posID);
                            actionSet.posNames.push(posName);
                        }
                        else {
                            return [2 /*return*/, "Entity $" + posName + " not found."];
                        }
                        _a.label = 8;
                    case 8: return [3 /*break*/, 11];
                    case 9:
                        if (!word.startsWith(Consts_1.ActionCommand.SUGGEST)) return [3 /*break*/, 11];
                        return [4 /*yield*/, this.ProcessSuggestion(context, actionSet, word)];
                    case 10:
                        _a.sent();
                        _a.label = 11;
                    case 11:
                        _i++;
                        return [3 /*break*/, 1];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    Action_v1.ProcessResponse = function (context, actionSet, responseString) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, words, _i, words_2, word, posName, posID;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Ignore bracketed text
                        responseString = Action_v1.IgnoreBrackets(responseString);
                        memory = context.Memory();
                        words = Action_v1.Split(responseString);
                        _i = 0, words_2 = words;
                        _a.label = 1;
                    case 1:
                        if (!(_i < words_2.length)) return [3 /*break*/, 7];
                        word = words_2[_i];
                        if (!word.startsWith(Consts_1.ActionCommand.SUBSTITUTE)) return [3 /*break*/, 4];
                        posName = word.slice(Consts_1.ActionCommand.SUBSTITUTE.length);
                        if (!(actionSet.posNames.indexOf(posName) < 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, memory.EntityLookup().ToId(posName)];
                    case 2:
                        posID = _a.sent();
                        if (posID) {
                            actionSet.posIds.push(posID);
                            actionSet.posNames.push(posName);
                        }
                        else {
                            return [2 /*return*/, "Entity $" + posName + " not found."];
                        }
                        _a.label = 3;
                    case 3: return [3 /*break*/, 6];
                    case 4:
                        if (!word.startsWith(Consts_1.ActionCommand.SUGGEST)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.ProcessSuggestion(context, actionSet, word)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 1];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    Action_v1.ProcessSuggestion = function (context, actionSet, word) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        memory = context.Memory();
                        // Only allow one suggested entity
                        if (actionSet.saveName) {
                            return [2 /*return*/, "Only one entity suggestion (denoted by \"!_ENTITY_\") allowed per Action"];
                        }
                        if (actionSet.actionType == Consts_1.ActionTypes_v1.API) {
                            return [2 /*return*/, "Suggested entities can't be added to API Actions"];
                        }
                        actionSet.saveName = word.slice(Consts_1.ActionCommand.SUGGEST.length);
                        _a = actionSet;
                        return [4 /*yield*/, memory.EntityLookup().ToId(actionSet.saveName)];
                    case 1:
                        _a.saveId = _b.sent();
                        if (!actionSet.saveId) {
                            return [2 /*return*/, "Entity $" + actionSet.saveName + " not found."];
                        }
                        // Add to negative entities
                        if (actionSet.negNames.indexOf(actionSet.saveName) < 0) {
                            actionSet.negIds.push(actionSet.saveId);
                            actionSet.negNames.push(actionSet.saveName);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Remove all bracketed text from a string */
    Action_v1.IgnoreBrackets = function (text) {
        var start = text.indexOf('[');
        var end = text.indexOf(']');
        // If no legal contingency found
        if (start < 0 || end < 0 || end < start) {
            return text;
        }
        text = text.substring(0, start) + text.substring(end + 1, text.length);
        return this.IgnoreBrackets(text);
    };
    Action_v1.Add_v1 = function (context, actionId, actionType, apiType, content, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, appId, actionSet, _a, action, commands, error, changeType, metaData, editAction, metadata, newAction, substr, type, card, error_4, errMsg;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("AddAction");
                        memory = context.Memory();
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 1:
                        appId = _b.sent();
                        if (!BlisApp_1.BlisApp.HaveApp(appId, context, cb)) {
                            return [2 /*return*/];
                        }
                        if (!content) {
                            cb(Menu_1.Menu.AddEditCards(context, ["You must provide action text for the action."]), null);
                            return [2 /*return*/];
                        }
                        else if (!actionType && !actionId) {
                            cb(Menu_1.Menu.AddEditCards(context, ["You must provide the actionType."]), null);
                            return [2 /*return*/];
                        }
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 9, , 10]);
                        // Handle Azure calls
                        if (actionType == Consts_1.ActionTypes_v1.API) {
                            if (apiType == Consts_1.APITypes_v1.AZURE) {
                                content = Consts_1.APICalls.AZUREFUNCTION + " " + content;
                            }
                            else if (apiType == Consts_1.APITypes_v1.INTENT) {
                                content = Consts_1.APICalls.FIREINTENT + " " + content;
                            }
                            // TODO : user should be able to specify on command line
                            if (!apiType) {
                                apiType == Consts_1.APITypes_v1.LOCAL;
                            }
                        }
                        actionSet = new ActionSet(actionType);
                        // Non INTENT API actions default to not-wait, TEXT actions to wait for user input
                        actionSet.waitAction = (actionType == Consts_1.ActionTypes_v1.API && apiType != Consts_1.APITypes_v1.INTENT) ? false : true;
                        _a = content.split('//'), action = _a[0], commands = _a[1];
                        return [4 /*yield*/, this.ProcessCommandString(context, actionSet, commands)];
                    case 3:
                        error = _b.sent();
                        if (error) {
                            cb(Menu_1.Menu.AddEditCards(context, [error]), null);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.ProcessResponse(context, actionSet, action)];
                    case 4:
                        error = _b.sent();
                        if (error) {
                            cb(Menu_1.Menu.AddEditCards(context, [error]), null);
                            return [2 /*return*/];
                        }
                        changeType = (actionType == Consts_1.ActionTypes_v1.TEXT) ? "Response" : (apiType = Consts_1.APITypes_v1.INTENT) ? "Intent Call" : "API Call";
                        if (!actionId) return [3 /*break*/, 6];
                        metaData = new ActionMetaData({
                            actionType: actionType
                        });
                        editAction = new Action({
                            actionId: actionId,
                            payload: action,
                            negativeEntities: actionSet.negIds,
                            requiredEntities: actionSet.posIds,
                            isTerminal: actionSet.waitAction,
                            metadata: metaData
                        });
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.EditAction(appId, editAction)];
                    case 5:
                        actionId = _b.sent();
                        changeType = changeType + " Edited";
                        return [3 /*break*/, 8];
                    case 6:
                        metadata = new ActionMetaData({ actionType: apiType });
                        newAction = new Action({
                            payload: action,
                            negativeEntities: actionSet.negIds,
                            requiredEntities: actionSet.posIds,
                            isTerminal: actionSet.waitAction,
                            metadata: metadata
                        });
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.AddAction(appId, newAction)];
                    case 7:
                        actionId = _b.sent();
                        changeType = changeType + " Created";
                        _b.label = 8;
                    case 8:
                        substr = actionSet.waitAction ? " (WAIT)" : "";
                        ;
                        if (actionSet.posIds.length > 0) {
                            substr += Consts_1.ActionCommand.REQUIRE + "[" + actionSet.posNames.toLocaleString() + "] ";
                        }
                        if (actionSet.negIds.length > 0) {
                            substr += Consts_1.ActionCommand.BLOCK + "[" + actionSet.negNames.toLocaleString() + "]";
                        }
                        type = apiType ? "(" + apiType + ") " : "";
                        card = Utils_1.Utils.MakeHero("" + changeType, "" + type + substr, action, Action_v1.Buttons(actionId, actionType));
                        cb(Menu_1.Menu.AddEditCards(context, [card]), actionId);
                        return [3 /*break*/, 10];
                    case 9:
                        error_4 = _b.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_4);
                        cb([errMsg], null);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /** Delete Action with the given actionId */
    Action_v1.Delete_v1 = function (context, actionId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, appId, action, inUse, card_1, card, error_5, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Action");
                        if (!actionId) {
                            cb(Menu_1.Menu.AddEditCards(context, ["You must provide the ID of the action to delete."]));
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        memory = context.Memory();
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 2:
                        appId = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetAction_v1(appId, actionId)];
                    case 3:
                        action = _a.sent();
                        return [4 /*yield*/, action.InUse_v1(appId)];
                    case 4:
                        inUse = _a.sent();
                        if (inUse) {
                            card_1 = Utils_1.Utils.MakeHero("Delete Failed", action.content, "Action is being used by App", null);
                            cb(Menu_1.Menu.AddEditCards(context, [card_1]));
                            return [2 /*return*/];
                        }
                        // TODO clear savelookup
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.DeleteAction(appId, actionId)];
                    case 5:
                        // TODO clear savelookup
                        _a.sent();
                        card = Utils_1.Utils.MakeHero("Deleted Action", null, action.content, null);
                        cb(Menu_1.Menu.AddEditCards(context, [card]));
                        return [3 /*break*/, 7];
                    case 6:
                        error_5 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_5);
                        cb([errMsg]);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /** Get actions.  Return count of actions */
    Action_v1.GetAll_v1 = function (context, actionType, search, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, appId, debug, actionIds, responses, json, textactions, apiactions, actions, _i, actionIds_2, actionId, action, _a, actions_1, action, posstring, negstring, atext, postext, negtext, wait, line, type, subtext, msg, error_6, errMsg;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting actions");
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 13, , 14]);
                        memory = context.Memory();
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 2:
                        appId = _b.sent();
                        if (!BlisApp_1.BlisApp.HaveApp(appId, context, cb)) {
                            return [2 /*return*/];
                        }
                        debug = false;
                        if (search && search.indexOf(Consts_1.ActionCommand.DEBUG) > -1) {
                            debug = true;
                            search = search.replace(Consts_1.ActionCommand.DEBUG, "");
                        }
                        actionIds = [];
                        responses = [];
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetActions(appId)];
                    case 3:
                        json = _b.sent();
                        actionIds = JSON.parse(json)['ids'];
                        BlisDebug_1.BlisDebug.Log("Found " + actionIds.length + " actions");
                        if (actionIds.length == 0) {
                            responses.push("This application contains no " + ((actionType == Consts_1.ActionTypes_v1.API) ? "API Calls" : "Responses"));
                            cb(Menu_1.Menu.AddEditCards(context, responses));
                            return [2 /*return*/];
                        }
                        textactions = "";
                        apiactions = "";
                        actions = [];
                        if (search)
                            search = search.toLowerCase();
                        _i = 0, actionIds_2 = actionIds;
                        _b.label = 4;
                    case 4:
                        if (!(_i < actionIds_2.length)) return [3 /*break*/, 7];
                        actionId = actionIds_2[_i];
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetAction_v1(appId, actionId)];
                    case 5:
                        action = _b.sent();
                        if ((!search || action.content.toLowerCase().indexOf(search) > -1) && (!actionType || action.DisplayType_v1() == actionType)) {
                            actions.push(action);
                            BlisDebug_1.BlisDebug.Log("Action lookup: " + action.content + " : " + action.actionType);
                        }
                        _b.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 4];
                    case 7:
                        // Sort
                        actions = Action_v1.Sort_v1(actions);
                        _a = 0, actions_1 = actions;
                        _b.label = 8;
                    case 8:
                        if (!(_a < actions_1.length)) return [3 /*break*/, 12];
                        action = actions_1[_a];
                        return [4 /*yield*/, memory.EntityLookup().Ids2Names(action.requiredEntities)];
                    case 9:
                        posstring = _b.sent();
                        return [4 /*yield*/, memory.EntityLookup().Ids2Names(action.negativeEntities)];
                    case 10:
                        negstring = _b.sent();
                        atext = "" + action.content;
                        // Don't show AZURE or INTENT command string
                        if (action.metadata) {
                            if (action.metadata.type == Consts_1.APITypes_v1.INTENT || action.metadata.type == Consts_1.APITypes_v1.AZURE) {
                                atext = Utils_1.Utils.RemoveWords(atext, 1);
                            }
                        }
                        postext = (posstring.length > 0) ? "  " + Consts_1.ActionCommand.REQUIRE + "[" + posstring + "]" : "";
                        negtext = (negstring.length > 0) ? "  " + Consts_1.ActionCommand.BLOCK + "[" + negstring + "]" : "";
                        wait = action.waitAction ? " (WAIT)" : "";
                        if (debug) {
                            line = atext + postext + negtext + wait + action.id + "\n\n";
                            if (action.actionType == Consts_1.ActionTypes_v1.API) {
                                apiactions += line;
                            }
                            else {
                                textactions += line;
                            }
                        }
                        else {
                            type = (action.metadata && action.metadata.type) ? "(" + action.metadata.type + ") " : "";
                            subtext = "" + type + postext + negtext + wait;
                            responses.push(Utils_1.Utils.MakeHero(null, subtext, atext, Action_v1.Buttons(action.id, action.actionType)));
                        }
                        _b.label = 11;
                    case 11:
                        _a++;
                        return [3 /*break*/, 8];
                    case 12:
                        if (debug) {
                            msg = "";
                            if (apiactions) {
                                msg += "**API Actions**\n\n" + apiactions;
                            }
                            if (textactions) {
                                msg += "**TEXT Actions**\n\n" + textactions;
                            }
                            responses.push(msg);
                        }
                        if (responses.length == 0) {
                            responses.push("No Actions match your query.");
                        }
                        responses.push(null, Menu_1.Menu.Home());
                        cb(responses);
                        return [2 /*return*/, actionIds.length];
                    case 13:
                        error_6 = _b.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_6);
                        cb([errMsg]);
                        return [3 /*break*/, 14];
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    return Action_v1;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('id'),
    tslib_1.__metadata("design:type", String)
], Action_v1.prototype, "id", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('action_type'),
    tslib_1.__metadata("design:type", String)
], Action_v1.prototype, "actionType", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('content'),
    tslib_1.__metadata("design:type", String)
], Action_v1.prototype, "content", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('NegativeEntities'),
    tslib_1.__metadata("design:type", Array)
], Action_v1.prototype, "negativeEntities", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('RequiredEntities'),
    tslib_1.__metadata("design:type", Array)
], Action_v1.prototype, "requiredEntities", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('sequence_terminal'),
    tslib_1.__metadata("design:type", Boolean)
], Action_v1.prototype, "waitAction", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: ActionMetaData_v1, name: 'metadata' }),
    tslib_1.__metadata("design:type", ActionMetaData_v1)
], Action_v1.prototype, "metadata", void 0);
exports.Action_v1 = Action_v1;
//# sourceMappingURL=Action.js.map