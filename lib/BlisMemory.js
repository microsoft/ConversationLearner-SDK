"use strict";
var Consts_1 = require("./Model/Consts");
var BlisDebug_1 = require("./BlisDebug");
var BlisMemory = (function () {
    function BlisMemory(userState) {
        this.userState = userState;
    }
    BlisMemory.prototype.AddEntityLookup = function (name, id) {
        this.userState[Consts_1.UserStates.ENTITYLOOKUP][name] = id;
    };
    BlisMemory.prototype.RemoveEntityLookup = function (name) {
        try {
            this.userState[Consts_1.UserStates.ENTITYLOOKUP].delete[name] = null;
        }
        catch (Error) {
            BlisDebug_1.BlisDebug.Log(Error);
        }
    };
    BlisMemory.prototype.EntityId = function (name) {
        try {
            return this.userState[Consts_1.UserStates.ENTITYLOOKUP][name];
        }
        catch (Error) {
            BlisDebug_1.BlisDebug.Log(Error);
        }
    };
    BlisMemory.prototype.EntityName = function (id) {
        try {
            for (var name_1 in this.userState[Consts_1.UserStates.ENTITYLOOKUP]) {
                var foundId = this.userState[Consts_1.UserStates.ENTITYLOOKUP][name_1];
                if (foundId == id) {
                    return name_1;
                }
            }
            return null;
        }
        catch (Error) {
            BlisDebug_1.BlisDebug.Log(Error);
        }
    };
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
        var words = text.split(/[\s,:.]+/);
        for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
            var word = words_1[_i];
            if (word.startsWith("$")) {
                // Key is in form of $entityName
                var entityName = word.substr(1, word.length - 1);
                // Get entityId for the key
                var entityId = this.EntityId(entityName);
                var entityValue = this.userState[Consts_1.UserStates.MEMORY][entityId];
                if (entityValue) {
                    text = text.replace(word, entityValue);
                }
            }
        }
        return text;
    };
    BlisMemory.prototype.Dump = function () {
        var memory = "";
        for (var entityId in this.userState[Consts_1.UserStates.MEMORY]) {
            if (memory)
                memory += ", ";
            var entityName = this.EntityName(entityId);
            var entityValue = this.userState[Consts_1.UserStates.MEMORY][entityId];
            memory += entityName + " : " + entityValue;
        }
        var text = "";
        text += "App: " + this.userState[Consts_1.UserStates.APP] + "\n\n";
        text += "Model: " + this.userState[Consts_1.UserStates.MODEL] + "\n\n";
        text += "Session: " + this.userState[Consts_1.UserStates.SESSION] + "\n\n";
        text += "InTeach: " + this.userState[Consts_1.UserStates.TEACH] + "\n\n";
        text += "InDebug: " + this.userState[Consts_1.UserStates.TEACH] + "\n\n";
        text += "Memory: {" + memory + "}\n\n";
        text += "EntityLookup: " + JSON.stringify(this.userState[Consts_1.UserStates.ENTITYLOOKUP]) + "\n\n";
        return text;
    };
    return BlisMemory;
}());
exports.BlisMemory = BlisMemory;
//# sourceMappingURL=BlisMemory.js.map