"use strict";
var tslib_1 = require("tslib");
process.stdin.resume();
process.stdin.setEncoding('utf8');
var util = require('util');
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
            var words;
            return tslib_1.__generator(this, function (_a) {
                text = text.trim();
                words = text.split(' ');
                if (words[0] == "!reset") {
                }
                if (words[0] === '!exit') {
                    done();
                }
                try {
                }
                catch (error) {
                    console.log("> !!! " + error);
                }
                return [2 /*return*/];
            });
        }); });
    };
    return ConsoleBase;
}());
exports.ConsoleBase = ConsoleBase;
//# sourceMappingURL=consoleBase.js.map