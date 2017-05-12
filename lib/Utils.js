"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var builder = require("botbuilder");
var util = require("util");
var request = require("request");
var EditableResponse_1 = require("./Model/EditableResponse");
var Utils = (function () {
    function Utils() {
    }
    /** Add hero card and keyboard to reponse list */ // NOT CURRENTL USED
    Utils.AddHeroKeyboard = function (responses, title, subtitle, text, buttons) {
        responses.push(this.MakeHero(title, subtitle, text, []));
        responses.push(this.MakeKeyboard(buttons));
    };
    /** Make hero card with buttons */
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
    /** Make hero card with buttons */
    Utils.MakeEditableHero = function (session, title, subtitle, text, buttons) {
        var buttonList = [];
        var postBackList = [];
        for (var message in buttons) {
            var postback = buttons[message];
            postBackList.push(postback);
            buttonList.push(builder.CardAction.postBack(null, postback, message));
        }
        var original = new builder.HeroCard()
            .title(title)
            .subtitle(subtitle)
            .text(text)
            .buttons(buttonList);
        var replacement = new builder.HeroCard()
            .title(title)
            .subtitle(subtitle)
            .text(text);
        return new EditableResponse_1.EditableResponse(session, original, replacement, postBackList);
    };
    /** Make hero card with a keyboard */ // NOT CURRENTLY USED
    Utils.MakeKeyboard = function (buttons) {
        var buttonList = [];
        for (var message in buttons) {
            var postback = buttons[message];
            buttonList.push(builder.CardAction.postBack(null, postback, message));
        }
        return builder.SuggestedActions.create(null, buttonList);
    };
    Utils.SendTyping = function (bot, address) {
        var msg = { type: 'typing' };
        msg.address = address;
        bot.send(msg);
    };
    /** Send an out of band message */
    Utils.SendMessage = function (context, content) {
        var message = new builder.Message()
            .address(context.Address());
        if (content instanceof builder.SuggestedActions) {
            var msg = new builder.Message(context.session).suggestedActions(content);
            context.session.send(msg);
            return;
        }
        else if (typeof content == 'string') {
            message.text(content);
        }
        else if (content instanceof EditableResponse_1.EditableResponse) {
            content.Send(context.session);
        }
        else {
            message.addAttachment(content);
        }
        context.session.send(message);
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
    Utils.HashCode = function (text) {
        var hash = 0, i, chr;
        if (text.length === 0)
            return hash;
        for (i = 0; i < text.length; i++) {
            chr = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    };
    ;
    /** Delete previous message batch */
    Utils.DeleteLastMessages = function (session) {
        if (session.conversationData.lasPosts) {
            for (var _i = 0, _a = session.conversationData.lastPosts; _i < _a.length; _i++) {
                var address = _a[_i];
                session.connector.delete(address, function (err) {
                    if (err) {
                        session.error(err);
                    }
                });
            }
        }
        else {
            session.send("No messages to delete.");
        }
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
    /** Handle that catch clauses can be any type */
    Utils.ErrorCard = function (message, subtext) {
        if (subtext === void 0) { subtext = null; }
        var title = "**ERROR**\n\n";
        return Utils.MakeHero(title, message, subtext, null);
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