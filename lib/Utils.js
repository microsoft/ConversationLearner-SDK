"use strict";
var builder = require("botbuilder");
var util = require("util");
var request = require("request");
var Utils = (function () {
    function Utils() {
    }
    Utils.MakeHero = function (title, subtitle, text, buttons) {
        var buttonList = [];
        for (var message in buttons) {
            var postback = buttons[message];
            buttonList.push(builder.CardAction.postBack(null, postback, message));
        }
        var card = new builder.HeroCard()
            .title(title)
            .subtitle(subtitle)
            .text(text)
            .buttons(buttonList);
        return card;
    };
    Utils.SendTyping = function (bot, address) {
        var msg = { type: 'typing' };
        msg.address = address;
        bot.send(msg);
    };
    /** Send an out of band message */
    Utils.SendMessage = function (context, content) {
        var message = new builder.Message()
            .address(context.address);
        if (typeof content == 'string') {
            message.text(content);
        }
        else {
            message.addAttachment(content);
        }
        context.bot.send(message);
    };
    /** Send a group of out of band message */
    Utils.SendResponses = function (context, responses) {
        for (var _i = 0, responses_1 = responses; _i < responses_1.length; _i++) {
            var response = responses_1[_i];
            Utils.SendMessage(context, response);
        }
    };
    Utils.SendAsAttachment = function (context, content) {
        var base64 = Buffer.from(content).toString('base64');
        var msg = new builder.Message();
        msg.data.address = context.address;
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
            return error.message;
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