"use strict";
var Consts_1 = require("./Model/Consts");
var BlisDebug_1 = require("./BlisDebug");
var BlisMemory = (function () {
    function BlisMemory(userState) {
        this.userState = userState;
    }
    BlisMemory.prototype.Remember = function (key, value) {
        try {
            this.userState[Consts_1.UserStates.MEMORY][key] = value;
        }
        catch (Error) {
            BlisDebug_1.BlisDebug.Log(Error);
        }
    };
    BlisMemory.prototype.Forget = function (key) {
        try {
            this.userState[Consts_1.UserStates.MEMORY].delete[key];
        }
        catch (Error) {
            BlisDebug_1.BlisDebug.Log(Error);
        }
    };
    BlisMemory.prototype.Substitute = function (text) {
        var words = text.split(/[\s,:]+/);
        for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
            var word = words_1[_i];
            if (word.startsWith("$")) {
                var key = word.substr(1, word.length - 1);
                var value = this.userState[Consts_1.UserStates.MEMORY][key];
                if (value) {
                    text = text.replace(word, value);
                }
            }
        }
        return text;
    };
    return BlisMemory;
}());
exports.BlisMemory = BlisMemory;
//# sourceMappingURL=BlisMemory.js.map