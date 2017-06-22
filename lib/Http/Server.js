"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var restify = require('restify');
var BlisDebug_1 = require("../BlisDebug");
var BlisApp_1 = require("../Model/BlisApp");
var Server = (function () {
    function Server() {
    }
    Server.Init = function () {
        var _this = this;
        this.server = restify.createServer();
        this.server.listen(5000, function (err) {
            if (err) {
                BlisDebug_1.BlisDebug.Error(err);
            }
            else {
                BlisDebug_1.BlisDebug.Log(_this.server.name + " listening to " + _this.server.url);
            }
        });
        this.server.get("/apps", BlisApp_1.BlisApp.GetAll);
    };
    return Server;
}());
exports.Server = Server;
//# sourceMappingURL=Server.js.map