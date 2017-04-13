"use strict";
var BlisMemory_1 = require("./BlisMemory");
var BlisContext = (function () {
    function BlisContext(bot, client, userState, address) {
        this.bot = bot;
        this.client = client;
        this.state = userState;
        this.address = address;
    }
    BlisContext.prototype.Memory = function () {
        return new BlisMemory_1.BlisMemory(this);
    };
    return BlisContext;
}());
exports.BlisContext = BlisContext;
//# sourceMappingURL=BlisContext.js.map