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
        this.SendCache();
    };
    BlisDebug.SendCache = function () {
        if (this.bot && this.address && this.cache) {
            var msg = new builder.Message().address(this.address);
            msg.text(this.cache);
            this.cache = "";
            this.bot.send(msg);
        }
    };
    BlisDebug.Log = function (text) {
        if (this.enabled) {
            this.cache += (this.cache ? "\n\n" : ">> ") + text;
        }
        this.SendCache();
        console.log(text);
    };
    BlisDebug.LogRequest = function (method, path, payload) {
        if (this.enabled) {
            var text = JSON.stringify(payload.body);
            this.cache += (this.cache ? "\n\n" : "") + method + ": //" + path + "\n\n" + text;
        }
        this.SendCache();
        console.log(path);
    };
    BlisDebug.Error = function (text) {
        BlisDebug.Log("ERROR: " + text);
    };
    BlisDebug.Verbose = function (text) {
        if (this.verbose) {
            BlisDebug.Log("" + text);
        }
    };
    BlisDebug.LogObject = function (obj) {
        this.Log(JSON.stringify(obj));
    };
    return BlisDebug;
}());
BlisDebug.cache = "";
BlisDebug.verbose = true;
exports.BlisDebug = BlisDebug;
//# sourceMappingURL=BlisDebug.js.map