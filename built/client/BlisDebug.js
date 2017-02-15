"use strict";
var BlisDebug = (function () {
    function BlisDebug() {
    }
    BlisDebug.Log = function (text) {
        if (this.logFunction) {
            this.logFunction(text);
        }
        else {
            console.log(text);
        }
    };
    return BlisDebug;
}());
exports.BlisDebug = BlisDebug;
//# sourceMappingURL=BlisDebug.js.map