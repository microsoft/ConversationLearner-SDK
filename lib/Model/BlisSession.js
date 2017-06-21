"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var BlisDebug_1 = require("../BlisDebug");
var BlisClient_1 = require("../BlisClient");
var Utils_1 = require("../Utils");
var Command_1 = require("./Command");
var BlisSession = (function () {
    function BlisSession() {
    }
    BlisSession.EndSession = function (context, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, appId, sessionId, modelId, error_1, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        memory = context.Memory();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 10]);
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 2:
                        appId = _a.sent();
                        return [4 /*yield*/, memory.BotState().SessionId()];
                    case 3:
                        sessionId = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.EndSession(appId, sessionId)];
                    case 4:
                        // Ending teaching session (which trains the model if necessary), update modelId
                        sessionId = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.GetModel(appId)];
                    case 5:
                        modelId = _a.sent();
                        return [4 /*yield*/, memory.EndSession()];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, memory.BotState().SetModelId(modelId)];
                    case 7:
                        _a.sent();
                        cb(sessionId);
                        return [3 /*break*/, 10];
                    case 8:
                        error_1 = _a.sent();
                        // End session so user doesn't get trapped
                        return [4 /*yield*/, memory.EndSession()];
                    case 9:
                        // End session so user doesn't get trapped
                        _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_1);
                        cb(errMsg);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    BlisSession.NewSession = function (context, teach, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, appId, sessionId, endId, body, subtext, card, card, error_2, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to create new session, Teach = " + teach);
                        memory = context.Memory();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 9]);
                        return [4 /*yield*/, memory.BotState().AppId()];
                    case 2:
                        appId = _a.sent();
                        return [4 /*yield*/, memory.BotState().SessionId()];
                    case 3:
                        sessionId = _a.sent();
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.EndSession(appId, sessionId)];
                    case 4:
                        endId = _a.sent();
                        BlisDebug_1.BlisDebug.Log("Ended session " + endId);
                        return [4 /*yield*/, BlisClient_1.BlisClient_v1.client.StartSession(appId, teach)];
                    case 5:
                        // Start a new session
                        sessionId = _a.sent();
                        return [4 /*yield*/, memory.StartSession(sessionId, teach)];
                    case 6:
                        _a.sent();
                        BlisDebug_1.BlisDebug.Log("Started session " + sessionId);
                        if (teach) {
                            body = "Provide your first input for this teach dialog.\n\n\n\n";
                            subtext = "At any point type \"" + Command_1.LineCommands.ABANDON + "\" to abort";
                            card = Utils_1.Utils.MakeHero("Teach mode started", subtext, body, {
                                "Cancel": Command_1.LineCommands.ABANDON
                            });
                            cb([card]);
                        }
                        else {
                            card = Utils_1.Utils.MakeHero("Bot Started", null, 'Type !done at any time to stop', {
                                "Cancel": Command_1.LineCommands.DONE
                            });
                            cb([card]);
                        }
                        return [3 /*break*/, 9];
                    case 7:
                        error_2 = _a.sent();
                        errMsg = BlisDebug_1.BlisDebug.Error(error_2);
                        return [4 /*yield*/, memory.BotState().SetSessionId(null)];
                    case 8:
                        _a.sent(); // Clear the bad session
                        cb([errMsg]);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /** Return text of current training steps */
    BlisSession.TrainStepText = function (context) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var memory, trainSteps, msg, _i, trainSteps_1, trainstep, _a, _b, api, _c, _d, response;
            return tslib_1.__generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        memory = context.Memory();
                        return [4 /*yield*/, memory.TrainHistory().Steps()];
                    case 1:
                        trainSteps = _e.sent();
                        msg = "** New Dialog Summary **\n\n";
                        msg += "-----------------------------\n\n";
                        for (_i = 0, trainSteps_1 = trainSteps; _i < trainSteps_1.length; _i++) {
                            trainstep = trainSteps_1[_i];
                            msg += trainstep.input;
                            if (trainstep.entity) {
                                msg += "    _" + trainstep.entity + "_\n\n";
                            }
                            else {
                                msg += "\n\n";
                            }
                            for (_a = 0, _b = trainstep.api; _a < _b.length; _a++) {
                                api = _b[_a];
                                msg += "     {" + api + "}\n\n";
                            }
                            for (_c = 0, _d = trainstep.response; _c < _d.length; _c++) {
                                response = _d[_c];
                                msg += "     " + response + "\n\n";
                            }
                        }
                        return [2 /*return*/, msg];
                }
            });
        });
    };
    return BlisSession;
}());
exports.BlisSession = BlisSession;
//# sourceMappingURL=BlisSession.js.map