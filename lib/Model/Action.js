"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var BlisApp_1 = require("../Model/BlisApp");
var BlisDebug_1 = require("../BlisDebug");
var BlisClient_1 = require("../BlisClient");
var Consts_1 = require("../Model/Consts");
var Command_1 = require("./Command");
var Utils_1 = require("../Utils");
var Menu_1 = require("../Menu");
var ActionMetaData = (function () {
    function ActionMetaData(init) {
        this.internal = undefined;
        this.type = undefined;
        Object.assign(this, init);
    }
    return ActionMetaData;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('internal'),
    tslib_1.__metadata("design:type", Boolean)
], ActionMetaData.prototype, "internal", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('type'),
    tslib_1.__metadata("design:type", String)
], ActionMetaData.prototype, "type", void 0);
exports.ActionMetaData = ActionMetaData;
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
        this.id = undefined;
        this.actionType = undefined;
        this.content = undefined;
        this.negativeEntities = undefined;
        this.requiredEntities = undefined;
        this.waitAction = undefined;
        this.metadata = new ActionMetaData();
        Object.assign(this, init);
    }
    Action.prototype.Equal = function (action) {
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
    Action.prototype.DisplayType = function () {
        // INTENTs are APIs internally but shown as TEXT responses in UI
        if (this.actionType == Consts_1.ActionTypes.API) {
            return (this.metadata.type != Consts_1.APITypes.INTENT) ? Consts_1.ActionTypes.API : Consts_1.ActionTypes.TEXT;
        }
        else {
            return Consts_1.ActionTypes.TEXT;
        }
    };
    /** Look for entity suggestions in the last action taken */
    // For example: "What is your *name?" suggests user response is likely to be a name
    Action.GetEntitySuggestion = function (actions) {
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
    Action.toText = function (appId, actionId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var action, msg, error_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetAction(appId, actionId)];
                    case 1:
                        action = _a.sent();
                        msg = action.content;
                        if (action.waitAction) {
                            msg += " (WAIT)";
                        }
                        return [2 /*return*/, msg];
                    case 2:
                        error_1 = _a.sent();
                        BlisDebug_1.BlisDebug.Error(error_1);
                        throw (error_1);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Action.Split = function (action) {
        return action.split(/[\[\]\s,:.?!]+/);
    };
    Action.Sort = function (actions) {
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
    Action.prototype.InUse = function (context) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var appContent, appString;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, BlisClient_1.BlisClient.client.ExportApp(context.State(Consts_1.UserStates.APP))];
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
    Action.Buttons = function (id, actionType) {
        var editCommand = (actionType == Consts_1.ActionTypes.API) ? Command_1.CueCommands.EDITAPICALL : Command_1.CueCommands.EDITRESPONSE;
        var buttons = {
            "Edit": editCommand + " " + id,
            "Delete": Command_1.LineCommands.DELETEACTION + " " + id,
        };
        return buttons;
    };
    Action.ProcessCommandString = function (context, actionSet, commandString) {
        if (!commandString)
            return;
        // Process any command words
        var memory = context.Memory();
        var commandWords = Action.Split(commandString);
        for (var _i = 0, commandWords_1 = commandWords; _i < commandWords_1.length; _i++) {
            var word = commandWords_1[_i];
            if (word.startsWith(Consts_1.ActionCommand.BLOCK)) {
                var negName = word.slice(Consts_1.ActionCommand.BLOCK.length);
                // Is terminal action
                if (negName == Consts_1.ActionCommand.TERMINAL) {
                    actionSet.waitAction = false;
                }
                else {
                    var negID = memory.EntityName2Id(negName);
                    if (negID) {
                        actionSet.negIds.push(negID);
                        actionSet.negNames.push(negName);
                    }
                    else {
                        return "Entity " + negName + " not found.";
                    }
                }
            }
            else if (word.startsWith(Consts_1.ActionCommand.REQUIRE)) {
                var posName = word.slice(Consts_1.ActionCommand.REQUIRE.length);
                // Is terminal action
                if (posName == Consts_1.ActionCommand.TERMINAL) {
                    actionSet.waitAction = true;
                }
                else if (actionSet.posNames.indexOf(posName) < 0) {
                    var posID = memory.EntityName2Id(posName);
                    if (posID) {
                        actionSet.posIds.push(posID);
                        actionSet.posNames.push(posName);
                    }
                    else {
                        return "Entity $" + posName + " not found.";
                    }
                }
            }
            else if (word.startsWith(Consts_1.ActionCommand.SUGGEST)) {
                this.ProcessSuggestion(context, actionSet, word);
            }
        }
    };
    Action.ProcessResponse = function (context, actionSet, responseString) {
        // Ignore bracketed text
        responseString = Action.IgnoreBrackets(responseString);
        var memory = context.Memory();
        var words = Action.Split(responseString);
        for (var _i = 0, words_2 = words; _i < words_2.length; _i++) {
            var word = words_2[_i];
            // Add requirement for entity when used for substitution
            if (word.startsWith(Consts_1.ActionCommand.SUBSTITUTE)) {
                var posName = word.slice(Consts_1.ActionCommand.SUBSTITUTE.length);
                if (actionSet.posNames.indexOf(posName) < 0) {
                    var posID = memory.EntityName2Id(posName);
                    if (posID) {
                        actionSet.posIds.push(posID);
                        actionSet.posNames.push(posName);
                    }
                    else {
                        return "Entity $" + posName + " not found.";
                    }
                }
            }
            else if (word.startsWith(Consts_1.ActionCommand.SUGGEST)) {
                this.ProcessSuggestion(context, actionSet, word);
            }
        }
    };
    Action.ProcessSuggestion = function (context, actionSet, word) {
        var memory = context.Memory();
        // Only allow one suggested entity
        if (actionSet.saveName) {
            return "Only one entity suggestion (denoted by \"!_ENTITY_\") allowed per Action";
        }
        if (actionSet.actionType == Consts_1.ActionTypes.API) {
            return "Suggested entities can't be added to API Actions";
        }
        actionSet.saveName = word.slice(Consts_1.ActionCommand.SUGGEST.length);
        actionSet.saveId = memory.EntityName2Id(actionSet.saveName);
        if (!actionSet.saveId) {
            return "Entity $" + actionSet.saveName + " not found.";
        }
        // Add to negative entities
        if (actionSet.negNames.indexOf(actionSet.saveName) < 0) {
            actionSet.negIds.push(actionSet.saveId);
            actionSet.negNames.push(actionSet.saveName);
        }
    };
    /** Remove all bracketed text from a string */
    Action.IgnoreBrackets = function (text) {
        var start = text.indexOf('[');
        var end = text.indexOf(']');
        // If no legal contingency found
        if (start < 0 || end < 0 || end < start) {
            return text;
        }
        text = text.substring(0, start) + text.substring(end + 1, text.length);
        return this.IgnoreBrackets(text);
    };
    Action.Add = function (context, actionId, actionType, apiType, content, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var actionSet, _a, action, commands, error, changeType, metadata, substr, type, card, error_2, errMsg;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("AddAction");
                        if (!BlisApp_1.BlisApp.HaveApp(context, cb)) {
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
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        // Handle Azure calls
                        if (actionType == Consts_1.ActionTypes.API) {
                            if (apiType == Consts_1.APITypes.AZURE) {
                                content = Consts_1.APICalls.AZUREFUNCTION + " " + content;
                            }
                            else if (apiType == Consts_1.APITypes.INTENT) {
                                content = Consts_1.APICalls.FIREINTENT + " " + content;
                            }
                            // TODO : user should be able to specify on command line
                            if (!apiType) {
                                apiType == Consts_1.APITypes.LOCAL;
                            }
                        }
                        actionSet = new ActionSet(actionType);
                        // Non INTENT API actions default to not-wait, TEXT actions to wait for user input
                        actionSet.waitAction = (actionType == Consts_1.ActionTypes.API && apiType != Consts_1.APITypes.INTENT) ? false : true;
                        _a = content.split('//'), action = _a[0], commands = _a[1];
                        error = this.ProcessCommandString(context, actionSet, commands);
                        if (error) {
                            cb(Menu_1.Menu.AddEditCards(context, [error]), null);
                            return [2 /*return*/];
                        }
                        error = this.ProcessResponse(context, actionSet, action);
                        if (error) {
                            cb(Menu_1.Menu.AddEditCards(context, [error]), null);
                            return [2 /*return*/];
                        }
                        changeType = (actionType == Consts_1.ActionTypes.TEXT) ? "Response" : (apiType = Consts_1.APITypes.INTENT) ? "Intent Call" : "API Call";
                        if (!actionId) return [3 /*break*/, 3];
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.EditAction(context.State(Consts_1.UserStates.APP), actionId, action, actionType, actionSet.waitAction, actionSet.posIds, actionSet.negIds)];
                    case 2:
                        actionId = _b.sent();
                        changeType = changeType + " Edited";
                        return [3 /*break*/, 5];
                    case 3:
                        metadata = new ActionMetaData({ type: apiType });
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.AddAction(context.State(Consts_1.UserStates.APP), action, actionType, actionSet.waitAction, actionSet.posIds, actionSet.negIds, null, metadata)];
                    case 4:
                        actionId = _b.sent();
                        changeType = changeType + " Created";
                        _b.label = 5;
                    case 5:
                        substr = actionSet.waitAction ? " (WAIT)" : "";
                        ;
                        if (actionSet.posIds.length > 0) {
                            substr += Consts_1.ActionCommand.REQUIRE + "[" + actionSet.posNames.toLocaleString() + "] ";
                        }
                        if (actionSet.negIds.length > 0) {
                            substr += Consts_1.ActionCommand.BLOCK + "[" + actionSet.negNames.toLocaleString() + "]";
                        }
                        type = apiType ? "(" + apiType + ") " : "";
                        card = Utils_1.Utils.MakeHero("" + changeType, "" + type + substr, action, Action.Buttons(actionId, actionType));
                        cb(Menu_1.Menu.AddEditCards(context, [card]), actionId);
                        return [3 /*break*/, 7];
                    case 6:
                        error_2 = _b.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_2);
                        cb([errMsg], null);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /** Delete Action with the given actionId */
    Action.Delete = function (context, actionId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var action, inUse, card_1, card, error_3, errMsg;
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
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetAction(context.State(Consts_1.UserStates.APP), actionId)];
                    case 2:
                        action = _a.sent();
                        return [4 /*yield*/, action.InUse(context)];
                    case 3:
                        inUse = _a.sent();
                        if (inUse) {
                            card_1 = Utils_1.Utils.MakeHero("Delete Failed", action.content, "Action is being used by App", null);
                            cb(Menu_1.Menu.AddEditCards(context, [card_1]));
                            return [2 /*return*/];
                        }
                        // TODO clear savelookup
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.DeleteAction(context.State(Consts_1.UserStates.APP), actionId)];
                    case 4:
                        // TODO clear savelookup
                        _a.sent();
                        card = Utils_1.Utils.MakeHero("Deleted Action", null, action.content, null);
                        cb(Menu_1.Menu.AddEditCards(context, [card]));
                        return [3 /*break*/, 6];
                    case 5:
                        error_3 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_3);
                        cb([errMsg]);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /** Get actions.  Return count of actions */
    Action.GetAll = function (context, actionType, search, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var debug, actionIds, responses, json, textactions, apiactions, actions, memory, _i, actionIds_1, actionId, action, _a, actions_1, action, posstring, negstring, atext, postext, negtext, wait, line, type, subtext, msg, error_4, errMsg;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting actions");
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, , 8]);
                        if (!BlisApp_1.BlisApp.HaveApp(context, cb)) {
                            return [2 /*return*/];
                        }
                        debug = false;
                        if (search && search.indexOf(Consts_1.ActionCommand.DEBUG) > -1) {
                            debug = true;
                            search = search.replace(Consts_1.ActionCommand.DEBUG, "");
                        }
                        actionIds = [];
                        responses = [];
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetActions(context.State(Consts_1.UserStates.APP))];
                    case 2:
                        json = _b.sent();
                        actionIds = JSON.parse(json)['ids'];
                        BlisDebug_1.BlisDebug.Log("Found " + actionIds.length + " actions");
                        if (actionIds.length == 0) {
                            responses.push("This application contains no " + ((actionType == Consts_1.ActionTypes.API) ? "API Calls" : "Responses"));
                            cb(Menu_1.Menu.AddEditCards(context, responses));
                            return [2 /*return*/];
                        }
                        textactions = "";
                        apiactions = "";
                        actions = [];
                        memory = context.Memory();
                        if (search)
                            search = search.toLowerCase();
                        _i = 0, actionIds_1 = actionIds;
                        _b.label = 3;
                    case 3:
                        if (!(_i < actionIds_1.length)) return [3 /*break*/, 6];
                        actionId = actionIds_1[_i];
                        return [4 /*yield*/, BlisClient_1.BlisClient.client.GetAction(context.State(Consts_1.UserStates.APP), actionId)
                            // Don't display internal APIs (unless in debug)
                        ];
                    case 4:
                        action = _b.sent();
                        // Don't display internal APIs (unless in debug)
                        if (debug || !action.metadata || !action.metadata.internal) {
                            if ((!search || action.content.toLowerCase().indexOf(search) > -1) && (!actionType || action.DisplayType() == actionType)) {
                                actions.push(action);
                                BlisDebug_1.BlisDebug.Log("Action lookup: " + action.content + " : " + action.actionType);
                            }
                        }
                        _b.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        // Sort
                        actions = Action.Sort(actions);
                        // Generate output
                        for (_a = 0, actions_1 = actions; _a < actions_1.length; _a++) {
                            action = actions_1[_a];
                            posstring = memory.EntityIds2Names(action.requiredEntities);
                            negstring = memory.EntityIds2Names(action.negativeEntities);
                            atext = "" + action.content;
                            // Don't show AZURE or INTENT command string
                            if (action.metadata) {
                                if (action.metadata.type == Consts_1.APITypes.INTENT || action.metadata.type == Consts_1.APITypes.AZURE) {
                                    atext = Utils_1.Utils.RemoveWords(atext, 1);
                                }
                            }
                            postext = (posstring.length > 0) ? "  " + Consts_1.ActionCommand.REQUIRE + "[" + posstring + "]" : "";
                            negtext = (negstring.length > 0) ? "  " + Consts_1.ActionCommand.BLOCK + "[" + negstring + "]" : "";
                            wait = action.waitAction ? " (WAIT)" : "";
                            if (debug) {
                                line = atext + postext + negtext + wait + action.id + "\n\n";
                                if (action.actionType == Consts_1.ActionTypes.API) {
                                    apiactions += line;
                                }
                                else {
                                    textactions += line;
                                }
                            }
                            else {
                                type = (action.metadata && action.metadata.type) ? "(" + action.metadata.type + ") " : "";
                                subtext = "" + type + postext + negtext + wait;
                                responses.push(Utils_1.Utils.MakeHero(null, subtext, atext, Action.Buttons(action.id, action.actionType)));
                            }
                        }
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
                    case 7:
                        error_4 = _b.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_4);
                        cb([errMsg]);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    return Action;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('id'),
    tslib_1.__metadata("design:type", String)
], Action.prototype, "id", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('action_type'),
    tslib_1.__metadata("design:type", String)
], Action.prototype, "actionType", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('content'),
    tslib_1.__metadata("design:type", String)
], Action.prototype, "content", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('NegativeEntities'),
    tslib_1.__metadata("design:type", Array)
], Action.prototype, "negativeEntities", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('RequiredEntities'),
    tslib_1.__metadata("design:type", Array)
], Action.prototype, "requiredEntities", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('sequence_terminal'),
    tslib_1.__metadata("design:type", Array)
], Action.prototype, "waitAction", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: ActionMetaData, name: 'metadata' }),
    tslib_1.__metadata("design:type", ActionMetaData)
], Action.prototype, "metadata", void 0);
exports.Action = Action;
//# sourceMappingURL=Action.js.map