"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var builder = require("botbuilder");
var util = require("util");
var request = require("request");
var blis_models_1 = require("blis-models");
var Utils = (function () {
    function Utils() {
    }
    Utils.SendTyping = function (bot, address) {
        var msg = { type: 'typing' };
        msg.address = address;
        bot.send(msg);
    };
    /** Send a text message */
    Utils.SendMessage = function (bot, memory, content) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var address, session, message;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, memory.BotState().Address()];
                    case 1:
                        address = _a.sent();
                        return [4 /*yield*/, memory.BotState().Session(bot)];
                    case 2:
                        session = _a.sent();
                        if (content instanceof builder.Message) {
                            session.send(content);
                        }
                        else {
                            message = new builder.Message()
                                .address(address)
                                .text(content);
                            session.send(message);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    Utils.SendAsAttachment = function (context, content) {
        var base64 = Buffer.from(content).toString('base64');
        var msg = new builder.Message();
        msg.data.address = context.Address();
        var contentType = "text/plain";
        var attachment = {
            contentUrl: util.format('data:%s;base64,%s', contentType, base64),
            contentType: contentType,
            content: content
        };
        msg.addAttachment(attachment);
        context.bot.send(msg);
    };
    /** Handle that catch clauses can be any type */
    Utils.ErrorString = function (error) {
        if (typeof error == 'string') {
            return error;
        }
        else if (error.message) {
            return error.message + "\n\n" + error.stack;
        }
        return JSON.stringify(error);
    };
    Utils.ReadFromFile = function (url) {
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: url,
                json: true,
                encoding: 'utf8'
            };
            request.get(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body.message);
                }
                else {
                    var model = String.fromCharCode.apply(null, body.data);
                    resolve(model);
                }
            });
        });
    };
    Utils.GetSuggestedEntity = function (userInput, memory) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var suggestedEntity, predictedEntity;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, memory.BotState().SuggestedEntity()];
                    case 1:
                        suggestedEntity = _a.sent();
                        if (!suggestedEntity || !userInput || !userInput.text) {
                            return [2 /*return*/, null];
                        }
                        // Clear suggested entity (only use once)
                        return [4 /*yield*/, memory.BotState().ClearSuggestedEntity()];
                    case 2:
                        // Clear suggested entity (only use once)
                        _a.sent();
                        predictedEntity = new blis_models_1.PredictedEntity({
                            startCharIndex: 0,
                            endCharIndex: userInput.text.length - 1,
                            entityName: suggestedEntity.entityName,
                            entityId: suggestedEntity.entityId,
                            entityText: userInput.text
                        });
                        return [2 /*return*/, predictedEntity];
                }
            });
        });
    };
    return Utils;
}());
exports.Utils = Utils;
//# sourceMappingURL=Utils.js.map