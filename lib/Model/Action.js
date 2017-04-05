"use strict";
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Help_1 = require("../Model/Help");
var BlisDebug_1 = require("../BlisDebug");
var Consts_1 = require("../Model/Consts");
var BlisMemory_1 = require("../BlisMemory");
var Utils_1 = require("../Utils");
var Action = (function () {
    function Action(init) {
        this.id = undefined;
        this.actionType = undefined;
        this.content = undefined;
        this.negativeEntities = undefined;
        this.requiredEntities = undefined;
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
    Action.GetEntitySuggestion = function (action) {
        if (!action)
            return null;
        var words = this.Split(action);
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
    Action.toText = function (client, appId, actionId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var action, error_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, client.GetAction(appId, actionId)];
                    case 1:
                        action = _a.sent();
                        return [2 /*return*/, action.content];
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
            if (n1.content > n2.content) {
                return 1;
            }
            if (n1.content < n2.content) {
                return -1;
            }
            return 0;
        });
    };
    Action.Add = function (blisClient, userState, content, actionType, actionId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var error, commandHelp, msg, firstNeg, firstPos, cut, actionText, memory, negIds, posIds, negNames, posNames, saveName, saveId, words, _i, words_2, word, posName, posID, negName, negID, posName, posID, saveAPI, apiCall, apiActionId, changeType, substr, card, error_2, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("AddAction");
                        error = null;
                        if (!content) {
                            error = "You must provide action text for the action.";
                        }
                        if (!actionType && !actionId) {
                            error = "You must provide the actionType.";
                        }
                        commandHelp = actionType == Consts_1.ActionTypes.API ? Consts_1.Commands.ADDAPIACTION : Consts_1.Commands.ADDTEXTACTION;
                        if (error) {
                            msg = Help_1.BlisHelp.CommandHelpString(commandHelp, error);
                            cb([msg]);
                            return [2 /*return*/];
                        }
                        firstNeg = content.indexOf(Consts_1.ActionCommand.BLOCK);
                        firstPos = content.indexOf(Consts_1.ActionCommand.REQUIRE);
                        cut = 0;
                        if (firstNeg > 0 && firstPos > 0) {
                            cut = Math.min(firstNeg, firstPos);
                        }
                        else {
                            cut = Math.max(firstNeg, firstPos);
                        }
                        actionText = (cut > 0) ? content.slice(0, cut - 1) : content;
                        memory = new BlisMemory_1.BlisMemory(userState);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        negIds = [];
                        posIds = [];
                        negNames = [];
                        posNames = [];
                        saveName = null;
                        saveId = null;
                        // Ignore bracketed text
                        content = memory.IgnoreBrackets(content);
                        words = Action.Split(content);
                        for (_i = 0, words_2 = words; _i < words_2.length; _i++) {
                            word = words_2[_i];
                            // Add requirement for entity when used for substitution
                            if (word.startsWith(Consts_1.ActionCommand.SUBSTITUTE)) {
                                posName = word.slice(Consts_1.ActionCommand.SUBSTITUTE.length);
                                if (posNames.indexOf(posName) < 0) {
                                    posID = memory.EntityName2Id(posName);
                                    if (posID) {
                                        posIds.push(posID);
                                        posNames.push(posName);
                                    }
                                    else {
                                        cb(["Entity $" + posName + " not found."]);
                                        return [2 /*return*/];
                                    }
                                }
                            }
                            else if (word.startsWith(Consts_1.ActionCommand.SUGGEST)) {
                                // Only allow one suggested entity
                                if (saveName) {
                                    error = Help_1.BlisHelp.CommandHelpString(commandHelp, "Only one entity suggestion (denoted by \"!_ENTITY_\") allowed per Action");
                                    cb([error]);
                                    return [2 /*return*/];
                                }
                                if (actionType == Consts_1.ActionTypes.API) {
                                    error = Help_1.BlisHelp.CommandHelpString(commandHelp, "Suggested entities can't be added to API Actions");
                                    cb([error]);
                                    return [2 /*return*/];
                                }
                                saveName = word.slice(Consts_1.ActionCommand.SUGGEST.length);
                                saveId = memory.EntityName2Id(saveName);
                                if (!saveId) {
                                    error = Help_1.BlisHelp.CommandHelpString(commandHelp, "Entity $" + saveName + " not found.");
                                    cb([error]);
                                    return [2 /*return*/];
                                }
                                // Add to negative entities
                                if (negNames.indexOf(saveName) < 0) {
                                    negIds.push(saveId);
                                    negNames.push(saveName);
                                }
                            }
                            else if (word.startsWith(Consts_1.ActionCommand.BLOCK)) {
                                negName = word.slice(Consts_1.ActionCommand.BLOCK.length);
                                negID = memory.EntityName2Id(negName);
                                if (negID) {
                                    negIds.push(negID);
                                    negNames.push(negName);
                                }
                                else {
                                    error = Help_1.BlisHelp.CommandHelpString(commandHelp, "Entity $" + negName + " not found.");
                                    cb([error]);
                                    return [2 /*return*/];
                                }
                            }
                            else if (word.startsWith(Consts_1.ActionCommand.REQUIRE)) {
                                posName = word.slice(Consts_1.ActionCommand.REQUIRE.length);
                                if (posNames.indexOf(posName) < 0) {
                                    posID = memory.EntityName2Id(posName);
                                    if (posID) {
                                        posIds.push(posID);
                                        posNames.push(posName);
                                    }
                                    else {
                                        error = Help_1.BlisHelp.CommandHelpString(commandHelp, "Entity $" + posName + " not found.");
                                        cb([error]);
                                        return [2 /*return*/];
                                    }
                                }
                            }
                        }
                        if (!saveId) return [3 /*break*/, 3];
                        saveAPI = memory.APILookup(saveName);
                        if (!!saveAPI) return [3 /*break*/, 3];
                        apiCall = Consts_1.APICalls.SAVEENTITY + " " + saveName;
                        return [4 /*yield*/, blisClient.AddAction(userState[Consts_1.UserStates.APP], apiCall, Consts_1.ActionTypes.API, [], [saveId])];
                    case 2:
                        apiActionId = _a.sent();
                        memory.AddAPILookup(saveName, apiActionId);
                        _a.label = 3;
                    case 3:
                        changeType = "";
                        if (!actionId) return [3 /*break*/, 5];
                        return [4 /*yield*/, blisClient.EditAction(userState[Consts_1.UserStates.APP], actionId, actionText, actionType, posIds, negIds)];
                    case 4:
                        actionId = _a.sent();
                        changeType = "Edited";
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, blisClient.AddAction(userState[Consts_1.UserStates.APP], actionText, actionType, posIds, negIds)];
                    case 6:
                        actionId = _a.sent();
                        changeType = "Created";
                        _a.label = 7;
                    case 7:
                        substr = "";
                        if (posIds.length > 0) {
                            substr += Consts_1.ActionCommand.REQUIRE + "[" + posNames.toLocaleString() + "]\n\n";
                        }
                        if (negIds.length > 0) {
                            substr += Consts_1.ActionCommand.BLOCK + "[" + negNames.toLocaleString() + "]";
                        }
                        card = Utils_1.Utils.MakeHero(changeType + " Action", substr + "\n\n", actionText, null);
                        cb([card]);
                        return [3 /*break*/, 9];
                    case 8:
                        error_2 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_2);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb([errMsg]);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /** Delete Action with the given actionId */
    Action.Delete = function (blisClient, userState, actionId, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var msg, card, error_3, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to Delete Action");
                        if (!actionId) {
                            msg = "You must provide the ID of the action to delete.\n\n     " + Consts_1.Commands.DELETEACTION + " {app ID}";
                            cb(msg);
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        // TODO clear savelookup
                        return [4 /*yield*/, blisClient.DeleteAction(userState[Consts_1.UserStates.APP], actionId)];
                    case 2:
                        // TODO clear savelookup
                        _a.sent();
                        card = Utils_1.Utils.MakeHero("Deleted Action", null, actionId, null);
                        cb(card);
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_3);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        cb(errMsg);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /** Get actions.  Return count of actions */
    Action.Get = function (blisClient, userState, search, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var debug, actionIds, responses, json, textactions, apiactions, actions, memory, _i, actionIds_1, actionId, action, name_1, _a, actions_1, action, posstring, negstring, atext, postext, negtext, line, type, msg, error_4, errMsg;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Getting actions");
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, , 8]);
                        debug = false;
                        if (search && search.indexOf(Consts_1.ActionCommand.DEBUG) > -1) {
                            debug = true;
                            search = search.replace(Consts_1.ActionCommand.DEBUG, "");
                        }
                        actionIds = [];
                        responses = [];
                        return [4 /*yield*/, blisClient.GetActions(userState[Consts_1.UserStates.APP])];
                    case 2:
                        json = _b.sent();
                        actionIds = JSON.parse(json)['ids'];
                        BlisDebug_1.BlisDebug.Log("Found " + actionIds.length + " actions");
                        if (actionIds.length == 0) {
                            responses.push("This application contains no actions.");
                            cb(responses);
                            return [2 /*return*/];
                        }
                        textactions = "";
                        apiactions = "";
                        actions = [];
                        memory = new BlisMemory_1.BlisMemory(userState);
                        _i = 0, actionIds_1 = actionIds;
                        _b.label = 3;
                    case 3:
                        if (!(_i < actionIds_1.length)) return [3 /*break*/, 6];
                        actionId = actionIds_1[_i];
                        return [4 /*yield*/, blisClient.GetAction(userState[Consts_1.UserStates.APP], actionId)];
                    case 4:
                        action = _b.sent();
                        if (!search || action.content.indexOf(search) > -1) {
                            actions.push(action);
                            // Create lookup for saveEntity actions
                            if (action.actionType == Consts_1.ActionTypes.API && action.content.startsWith(Consts_1.APICalls.SAVEENTITY)) {
                                name_1 = Action.Split(action.content)[1];
                                memory.AddAPILookup(name_1, actionId);
                            }
                            BlisDebug_1.BlisDebug.Log("Action lookup: " + action.content + " : " + action.actionType);
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
                            postext = (posstring.length > 0) ? "  " + Consts_1.ActionCommand.REQUIRE + "[" + posstring + "]" : "";
                            negtext = (negstring.length > 0) ? "  " + Consts_1.ActionCommand.BLOCK + "[" + negstring + "]" : "";
                            if (debug) {
                                line = atext + postext + negtext + action.id + "\n\n";
                                if (action.actionType == Consts_1.ActionTypes.API) {
                                    apiactions += line;
                                }
                                else {
                                    textactions += line;
                                }
                            }
                            else {
                                type = (action.actionType == Consts_1.ActionTypes.API) ? "API" : "TEXT";
                                responses.push(Utils_1.Utils.MakeHero(atext, type + " Action " + postext + negtext, null, {
                                    "Edit": Consts_1.IntCommands.EDITACTION + " " + action.id,
                                    "Delete": Consts_1.Commands.DELETEACTION + " " + action.id,
                                }));
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
                        cb(responses);
                        return [2 /*return*/, actionIds.length];
                    case 7:
                        error_4 = _b.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_4);
                        BlisDebug_1.BlisDebug.Error(errMsg);
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
exports.Action = Action;
//# sourceMappingURL=Action.js.map