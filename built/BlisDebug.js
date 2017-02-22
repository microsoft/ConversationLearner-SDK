"use strict";
var BlisDebug = (function () {
    function BlisDebug() {
    }
    BlisDebug.setLogger = function (logger, logFunction) {
        this.logFunction = logFunction;
        this.logger = logger;
    };
    BlisDebug.Log = function (text) {
        if (this.logFunction) {
            this.logger.Send(text);
        }
        else {
            console.log(text);
        }
    };
    return BlisDebug;
}());
exports.BlisDebug = BlisDebug;
//# sourceMappingURL=BlisDebug.js.map