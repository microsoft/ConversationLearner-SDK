"use strict";
var BlisContext = (function () {
    function BlisContext(bot, client, userState, address) {
        this.bot = bot;
        this.client = client;
        this.state = userState;
        this.address = address;
    }
    return BlisContext;
}());
exports.BlisContext = BlisContext;
//# sourceMappingURL=BlisContext.js.map