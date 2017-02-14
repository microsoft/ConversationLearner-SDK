"use strict";
var tslib_1 = require("tslib");
process.stdin.resume();
process.stdin.setEncoding('utf8');
var util = require('util');
var client_1 = require("../client/client");
var TakeTurnResponse_1 = require("../client/Model/TakeTurnResponse");
var TakeTurnRequest_1 = require("../client/Model/TakeTurnRequest");
function done() {
    console.log('Now that process.stdin is paused, there is nothing more I can do.');
    process.exit();
}
var Console = (function () {
    function Console() {
        this.hist = {};
    }
    Console.prototype.CreateClient = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, locationEntityId, datetimeEntityId, forecastEntityId, whichDayActionId, whichCityActionId, forecastActionId, _b, _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        this.blisclient = new client_1.BlisClient("http://dialog.centralus.cloudapp.azure.com/", "ccastro@microsoft.com", "002a6a39-7ae3-49f5-a737-baf289d44f6f");
                        // Create App
                        _a = this;
                        return [4 /*yield*/, this.blisclient.CreateApp("Test1", "e740e5ecf4c3429eadb1a595d57c14c5")];
                    case 1:
                        // Create App
                        _a.appId = _d.sent();
                        return [4 /*yield*/, this.blisclient.AddEntity(this.appId, "location", "LUIS", "geography")];
                    case 2:
                        locationEntityId = _d.sent();
                        return [4 /*yield*/, this.blisclient.AddEntity(this.appId, "date", "LUIS", "datetime")];
                    case 3:
                        datetimeEntityId = _d.sent();
                        return [4 /*yield*/, this.blisclient.AddEntity(this.appId, "forecast", "LOCAL", null)];
                    case 4:
                        forecastEntityId = _d.sent();
                        this.entityName2Id =
                            {
                                'location': locationEntityId,
                                'date': datetimeEntityId,
                                'forecast': forecastEntityId
                            };
                        return [4 /*yield*/, this.blisclient.AddAction(this.appId, "Which day?", new Array(), new Array(datetimeEntityId), null)];
                    case 5:
                        whichDayActionId = _d.sent();
                        return [4 /*yield*/, this.blisclient.AddAction(this.appId, "Which city?", new Array(), new Array(locationEntityId), null)];
                    case 6:
                        whichCityActionId = _d.sent();
                        return [4 /*yield*/, this.blisclient.AddAction(this.appId, "$forecast", new Array(forecastEntityId), new Array(), null)];
                    case 7:
                        forecastActionId = _d.sent();
                        // Train model
                        _b = this;
                        return [4 /*yield*/, this.blisclient.TrainModel(this.appId)];
                    case 8:
                        // Train model
                        _b.modelId = _d.sent();
                        // Create session
                        _c = this;
                        return [4 /*yield*/, this.blisclient.StartSession(this.appId, this.modelId)];
                    case 9:
                        // Create session
                        _c.sessionId = _d.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Console.prototype.Run = function () {
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
    Console.prototype.LUCallback = function (text, entities) {
        return new TakeTurnRequest_1.TakeTurnRequest({ text: text, entities: entities });
    };
    Console.prototype.InsertEntities = function (text) {
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
    Console.prototype.start = function () {
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
    return Console;
}());
exports.Console = Console;
new Console().Run();
//# sourceMappingURL=console.1.js.map