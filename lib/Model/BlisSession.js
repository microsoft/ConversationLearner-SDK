"use strict";
var tslib_1 = require("tslib");
var BlisDebug_1 = require("../BlisDebug");
var BlisMemory_1 = require("../BlisMemory");
var Utils_1 = require("../Utils");
var Consts_1 = require("./Consts");
var Command_1 = require("./Command");
var BlisSession = (function () {
    function BlisSession() {
    }
    BlisSession.EndSession = function (context, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var sessionId, modelId, error_1, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, context.client.EndSession(context.state[Consts_1.UserStates.APP], context.state[Consts_1.UserStates.SESSION])];
                    case 1:
                        sessionId = _a.sent();
                        return [4 /*yield*/, context.client.GetModel(context.state[Consts_1.UserStates.APP])];
                    case 2:
                        modelId = _a.sent();
                        new BlisMemory_1.BlisMemory(context).EndSession();
                        context.state[Consts_1.UserStates.MODEL] = modelId;
                        cb(sessionId);
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
    BlisSession.NewSession = function (context, teach, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var endId, sessionId, body, subtext, card, card, error_2, errMsg;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        BlisDebug_1.BlisDebug.Log("Trying to create new session, Teach = " + teach);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, context.client.EndSession(context.state[Consts_1.UserStates.APP], context.state[Consts_1.UserStates.SESSION])];
                    case 2:
                        endId = _a.sent();
                        BlisDebug_1.BlisDebug.Log("Ended session " + endId);
                        return [4 /*yield*/, context.client.StartSession(context.state[Consts_1.UserStates.APP], teach)];
                    case 3:
                        sessionId = _a.sent();
                        new BlisMemory_1.BlisMemory(context).StartSession(sessionId, teach);
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
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        errMsg = Utils_1.Utils.ErrorString(error_2);
                        BlisDebug_1.BlisDebug.Error(errMsg);
                        context.state[Consts_1.UserStates.SESSION] = null; // Clear the bad session
                        cb([errMsg]);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /** Return text of current training steps */
    BlisSession.TrainStepText = function (context) {
        var memory = context.Memory();
        var trainSteps = memory.TrainSteps();
        var msg = "** New Dialog Summary **\n\n";
        msg += "-----------------------------\n\n";
        for (var _i = 0, trainSteps_1 = trainSteps; _i < trainSteps_1.length; _i++) {
            var trainstep = trainSteps_1[_i];
            msg += trainstep.input;
            if (trainstep.entity) {
                msg += "    _" + trainstep.entity + "_\n\n";
            }
            else {
                msg += "\n\n";
            }
            for (var _a = 0, _b = trainstep.api; _a < _b.length; _a++) {
                var api = _b[_a];
                msg += "     {" + api + "}\n\n";
            }
            msg += "     " + trainstep.response + "\n\n";
        }
        return msg;
    };
    return BlisSession;
}());
exports.BlisSession = BlisSession;
//# sourceMappingURL=BlisSession.js.map