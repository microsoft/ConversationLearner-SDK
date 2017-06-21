"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BlisMemory_1 = require("./BlisMemory");
var BlisContext = (function () {
    function BlisContext(bot, session) {
        this.bot = bot;
        this.session = session;
        var key = BlisMemory_1.BlisMemory.SessionKey(session);
        this.memory = BlisMemory_1.BlisMemory.GetMemory(key);
    }
    BlisContext.prototype.Address = function () {
        return this.session.message.address;
    };
    BlisContext.prototype.Memory = function () {
        return this.memory;
    };
    return BlisContext;
}());
exports.BlisContext = BlisContext;
//# sourceMappingURL=BlisContext.js.map