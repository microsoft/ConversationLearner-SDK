"use strict";
var tslib_1 = require("tslib");
var client_1 = require("./client");
var TakeTurnResponse_1 = require("../client/Model/TakeTurnResponse");
var BlisRecognizer = (function () {
    function BlisRecognizer(options) {
        this.options = options;
        this.init(options);
    }
    BlisRecognizer.prototype.init = function (options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, _i, _b, entityName, _c, _d, prebuiltName, _e, _f;
            return tslib_1.__generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        this.blisClient = new client_1.BlisClient(options.serviceUri, options.user, options.secret);
                        // Create App
                        this.appId = options.appId;
                        if (!!this.appId) return [3 /*break*/, 2];
                        console.log("Creating app...");
                        _a = this;
                        return [4 /*yield*/, this.blisClient.CreateApp(options.appName, options.luisKey)];
                    case 1:
                        _a.appId = _g.sent(); // TODO parameter validation
                        _g.label = 2;
                    case 2:
                        if (!options.entityList) return [3 /*break*/, 6];
                        _i = 0, _b = options.entityList;
                        _g.label = 3;
                    case 3:
                        if (!(_i < _b.length)) return [3 /*break*/, 6];
                        entityName = _b[_i];
                        console.log("Adding new LUIS entity: " + entityName);
                        return [4 /*yield*/, this.blisClient.AddEntity(this.appId, entityName, "LOCAL", null)];
                    case 4:
                        _g.sent();
                        _g.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        if (!options.prebuiltList) return [3 /*break*/, 10];
                        _c = 0, _d = options.prebuiltList;
                        _g.label = 7;
                    case 7:
                        if (!(_c < _d.length)) return [3 /*break*/, 10];
                        prebuiltName = _d[_c];
                        console.log("Adding new LUIS pre-build entity: " + prebuiltName);
                        return [4 /*yield*/, this.blisClient.AddEntity(this.appId, prebuiltName, "LUIS", prebuiltName)];
                    case 8:
                        _g.sent(); // ???
                        _g.label = 9;
                    case 9:
                        _c++;
                        return [3 /*break*/, 7];
                    case 10:
                        // Create location, datetime and forecast entities
                        //   var locationEntityId = await this.blisClient.AddEntity(this.appId, "location", "LUIS", "geography");
                        //    var datetimeEntityId = await this.blisClient.AddEntity(this.appId, "date", "LUIS", "datetime");
                        //    var forecastEntityId = await this.blisClient.AddEntity(this.appId, "forecast", "LOCAL", null);
                        // Create actions
                        //      var whichDayActionId = await this.blisClient.AddAction(this.appId, "Which day?", new Array(), new Array(datetimeEntityId), null);
                        //      var whichCityActionId = await this.blisClient.AddAction(this.appId, "Which city?", new Array(), new Array(locationEntityId), null);
                        //      var forecastActionId = await this.blisClient.AddAction(this.appId, "$forecast", new Array(forecastEntityId), new Array(), null);
                        // Train model
                        _e = this;
                        return [4 /*yield*/, this.blisClient.TrainModel(this.appId)];
                    case 11:
                        // Create location, datetime and forecast entities
                        //   var locationEntityId = await this.blisClient.AddEntity(this.appId, "location", "LUIS", "geography");
                        //    var datetimeEntityId = await this.blisClient.AddEntity(this.appId, "date", "LUIS", "datetime");
                        //    var forecastEntityId = await this.blisClient.AddEntity(this.appId, "forecast", "LOCAL", null);
                        // Create actions
                        //      var whichDayActionId = await this.blisClient.AddAction(this.appId, "Which day?", new Array(), new Array(datetimeEntityId), null);
                        //      var whichCityActionId = await this.blisClient.AddAction(this.appId, "Which city?", new Array(), new Array(locationEntityId), null);
                        //      var forecastActionId = await this.blisClient.AddAction(this.appId, "$forecast", new Array(forecastEntityId), new Array(), null);
                        // Train model
                        _e.modelId = _g.sent();
                        // Create session
                        _f = this;
                        return [4 /*yield*/, this.blisClient.StartSession(this.appId, this.modelId)];
                    case 12:
                        // Create session
                        _f.sessionId = _g.sent();
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
                    // Markdown requires double carraige returns
                    var output = response.action.content.replace(/\n/g, ":\n\n");
                    result.answer = output;
                }
                else if (response.mode == TakeTurnResponse_1.TakeTurnModes.Action) {
                    var outText = _this.InsertEntities(response.actions[0].content);
                    result.answer = outText;
                }
                else {
                    result.answer = "Don't know mode: " + response.mode;
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