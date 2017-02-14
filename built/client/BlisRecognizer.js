"use strict";
var tslib_1 = require("tslib");
var client_1 = require("./client");
var TakeTurnResponse_1 = require("../client/Model/TakeTurnResponse");
var BlisRecognizer = (function () {
    function BlisRecognizer(options) {
        this.options = options;
        //this.kbUri = qnaMakerServiceEndpoint + options.knowledgeBaseId + '/' + qnaApi;
        //this.ocpApimSubscriptionKey = options.subscriptionKey;
        this.init();
    }
    BlisRecognizer.prototype.init = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, locationEntityId, datetimeEntityId, forecastEntityId, whichDayActionId, whichCityActionId, forecastActionId, _b, _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        this.blisClient = new client_1.BlisClient("http://dialog.centralus.cloudapp.azure.com/", "ccastro@microsoft.com", "002a6a39-7ae3-49f5-a737-baf289d44f6f");
                        // Create App
                        _a = this;
                        return [4 /*yield*/, this.blisClient.CreateApp("Test1", "e740e5ecf4c3429eadb1a595d57c14c5")];
                    case 1:
                        // Create App
                        _a.appId = _d.sent();
                        return [4 /*yield*/, this.blisClient.AddEntity(this.appId, "location", "LUIS", "geography")];
                    case 2:
                        locationEntityId = _d.sent();
                        return [4 /*yield*/, this.blisClient.AddEntity(this.appId, "date", "LUIS", "datetime")];
                    case 3:
                        datetimeEntityId = _d.sent();
                        return [4 /*yield*/, this.blisClient.AddEntity(this.appId, "forecast", "LOCAL", null)];
                    case 4:
                        forecastEntityId = _d.sent();
                        return [4 /*yield*/, this.blisClient.AddAction(this.appId, "Which day?", new Array(), new Array(datetimeEntityId), null)];
                    case 5:
                        whichDayActionId = _d.sent();
                        return [4 /*yield*/, this.blisClient.AddAction(this.appId, "Which city?", new Array(), new Array(locationEntityId), null)];
                    case 6:
                        whichCityActionId = _d.sent();
                        return [4 /*yield*/, this.blisClient.AddAction(this.appId, "$forecast", new Array(forecastEntityId), new Array(), null)];
                    case 7:
                        forecastActionId = _d.sent();
                        // Train model
                        _b = this;
                        return [4 /*yield*/, this.blisClient.TrainModel(this.appId)];
                    case 8:
                        // Train model
                        _b.modelId = _d.sent();
                        // Create session
                        _c = this;
                        return [4 /*yield*/, this.blisClient.StartSession(this.appId, this.modelId)];
                    case 9:
                        // Create session
                        _c.sessionId = _d.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BlisRecognizer.prototype.recognize = function (context, cb) {
        var _this = this;
        var result = { score: 1.0, answer: "yo", intent: null };
        if (context && context.message && context.message.text) {
            var text = context.message.text.trim();
            var words = text.split(' ');
            if (words[0] == "!reset") {
            }
            this.blisClient.TakeTurn(this.appId, this.sessionId, text, this.LUCallback, null, function (response) {
                if (response.mode == TakeTurnResponse_1.TakeTurnModes.Teach) {
                    result.answer = "> " + response.action.content;
                }
                else if (response.mode == TakeTurnResponse_1.TakeTurnModes.Action) {
                    var outText = _this.InsertEntities(response.actions[0].content);
                    result.answer = "> " + outText;
                }
                else {
                    result.answer = "> Don't know mode: " + response.mode;
                }
                cb(null, result);
            });
        }
    };
    BlisRecognizer.prototype.InsertEntities = function (text) {
        var words = [];
        var tokens = text.split(' ').forEach(function (item) {
            if (item.startsWith('$')) {
                var name_1 = item; // LARS TODO WAS: ent_name = item[1:] - why the 1:?
            }
            else {
                words.push(item);
            }
        });
        return words.join(' ');
    };
    return BlisRecognizer;
}());
exports.BlisRecognizer = BlisRecognizer;
//# sourceMappingURL=BlisRecognizer.js.map