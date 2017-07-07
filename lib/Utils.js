"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var builder = require("botbuilder");
var util = require("util");
var request = require("request");
var Utils = (function () {
    function Utils() {
    }
    Utils.SendTyping = function (bot, address) {
        var msg = { type: 'typing' };
        msg.address = address;
        bot.send(msg);
    };
    /** Send a text message */
    Utils.SendText = function (memory, content) {
        var address = memory.BotState().Address();
        var session = memory.BotState().Session();
        var message = new builder.Message()
            .address(address)
            .text(content);
        session.send(message);
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
    /** Remove words from start from command string */
    Utils.RemoveWords = function (text, numWords) {
        var firstSpace = text.indexOf(' ');
        var remaining = (firstSpace > 0) ? text.slice(firstSpace + 1) : "";
        numWords--;
        if (numWords == 0) {
            return remaining;
        }
        return this.RemoveWords(remaining, numWords);
    };
    return Utils;
}());
exports.Utils = Utils;
//# sourceMappingURL=Utils.js.map