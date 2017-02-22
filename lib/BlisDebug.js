"use strict";
var builder = require("botbuilder");
var BlisDebug = (function () {
    function BlisDebug() {
    }
    BlisDebug.InitLogger = function (bot) {
        this.bot = bot;
    };
    BlisDebug.SetAddress = function (address) {
        this.address = address;
    };
    BlisDebug.Log = function (text) {
        if (this.bot && this.address) {
            var msg = new builder.Message().address(this.address);
            msg.text(text);
            this.bot.send(msg);
        }
        else {
            console.log(text);
        }
    };
    return BlisDebug;
}());
exports.BlisDebug = BlisDebug;
//# sourceMappingURL=BlisDebug.js.map