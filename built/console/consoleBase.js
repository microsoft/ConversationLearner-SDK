"use strict";
var tslib_1 = require("tslib");
process.stdin.resume();
process.stdin.setEncoding('utf8');
var util = require('util');
var TakeTurnResponse_1 = require("../client/Model/TakeTurnResponse");
var TakeTurnRequest_1 = require("../client/Model/TakeTurnRequest");
function done() {
    console.log('Now that process.stdin is paused, there is nothing more I can do.');
    process.exit();
}
var ConsoleBase = (function () {
    function ConsoleBase() {
        this.hist = {};
    }
    ConsoleBase.prototype.CreateClient = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    ConsoleBase.prototype.Run = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.CreateClient()];
                    case 1:
                        _a.sent();
                        console.log("How can I help you?");
                        this.start();
                        return [2 /*return*/];
                }
            });
        });
    };
    ConsoleBase.prototype.LUCallback = function (text, luisEntities) {
        return new TakeTurnRequest_1.TakeTurnRequest({ text: text, entities: luisEntities });
    };
    ConsoleBase.prototype.InsertEntities = function (text) {
        var _this = this;
        var words = [];
        var tokens = text.split(' ').forEach(function (item) {
            if (item.startsWith('$')) {
                var name_1 = item; // LARS TODO WAS: ent_name = item[1:] - why the 1:?
                var value = _this.hist[name_1];
                words.push(value);
            }
            else {
                words.push(item);
            }
        });
        return words.join(' ');
    };
    ConsoleBase.prototype.start = function () {
        var _this = this;
        process.stdin.on('data', function (text) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var words, response, outText, error_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        text = text.trim();
                        words = text.split(' ');
                        if (words[0] == "!reset") {
                        }
                        if (words[0] === '!exit') {
                            done();
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.blisclient.TakeTurn(this.appId, this.sessionId, text, this.LUCallback)];
                    case 2:
                        response = _a.sent();
                        if (response.mode == TakeTurnResponse_1.TakeTurnModes.Teach) {
                            console.log("> " + response.action.content);
                        }
                        else if (response.mode == TakeTurnResponse_1.TakeTurnModes.Action) {
                            outText = this.InsertEntities(response.actions[0].content);
                            console.log("> " + outText);
                        }
                        else {
                            console.log("> Don't know mode: " + response.mode);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.log("> !!! " + error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    };
    return ConsoleBase;
}());
exports.ConsoleBase = ConsoleBase;
//# sourceMappingURL=consoleBase.js.map