"use strict";
var Consts_1 = require("./Model/Consts");
var BlisDebug_1 = require("./BlisDebug");
var TrainStep = (function () {
    function TrainStep() {
        this.input = null;
        this.entity = null;
        this.api = [];
        this.response = null;
    }
    return TrainStep;
}());
exports.TrainStep = TrainStep;
var BlisMemory = (function () {
    function BlisMemory(userState) {
        this.userState = userState;
    }
    /** Clear memory associated with a session */
    BlisMemory.prototype.EndSession = function () {
        this.userState[Consts_1.UserStates.SESSION] = null;
        this.userState[Consts_1.UserStates.TEACH] = false;
        this.userState[Consts_1.UserStates.LASTSTEP] = null;
        this.userState[Consts_1.UserStates.MEMORY] = {};
    };
    /** Init memory for a session */
    BlisMemory.prototype.StartSession = function (sessionId, inTeach) {
        this.EndSession();
        this.userState[Consts_1.UserStates.SESSION] = sessionId;
        this.userState[Consts_1.UserStates.TEACH] = inTeach;
    };
    /** Return ActionId for saveEntity API for the given name */
    BlisMemory.prototype.APILookup = function (entityName) {
        try {
            return this.userState[Consts_1.UserStates.SAVELOOKUP][entityName];
        }
        catch (Error) {
            BlisDebug_1.BlisDebug.Log(Error);
        }
    };
    BlisMemory.prototype.AddAPILookup = function (entityName, apiActionId) {
        this.userState[Consts_1.UserStates.SAVELOOKUP][entityName] = apiActionId;
    };
    BlisMemory.prototype.RemoveAPILookup = function (entityName) {
        try {
            this.userState[Consts_1.UserStates.SAVELOOKUP][entityName] = null;
        }
        catch (Error) {
            BlisDebug_1.BlisDebug.Log(Error);
        }
    };
    BlisMemory.prototype.AddEntityLookup = function (entityName, entityId) {
        this.userState[Consts_1.UserStates.ENTITYLOOKUP][entityName] = entityId;
    };
    BlisMemory.prototype.RemoveEntityLookup = function (entityName) {
        try {
            this.userState[Consts_1.UserStates.ENTITYLOOKUP][entityName] = null;
        }
        catch (Error) {
            BlisDebug_1.BlisDebug.Log(Error);
        }
    };
    // Does this bot have any entities
    BlisMemory.prototype.HasEntities = function () {
        return (this.userState[Consts_1.UserStates.ENTITYLOOKUP] && Object.keys(this.userState[Consts_1.UserStates.ENTITYLOOKUP]).length > 0);
    };
    BlisMemory.prototype.EntityValue = function (entityName) {
        var entityId = this.EntityName2Id(entityName);
        return this.userState[Consts_1.UserStates.MEMORY][entityId];
    };
    BlisMemory.prototype.EntityName2Id = function (name) {
        try {
            // Made independant of prefix
            name = name.replace('$', '');
            return this.userState[Consts_1.UserStates.ENTITYLOOKUP][name];
        }
        catch (Error) {
            BlisDebug_1.BlisDebug.Log(Error);
        }
    };
    BlisMemory.prototype.EntityId2Name = function (id) {
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
    // Converst array entity IDs into an array of entity Names
    BlisMemory.prototype.EntityNames = function (ids) {
        var names = [];
        try {
            for (var _i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
                var id = ids_1[_i];
                var found = false;
                for (var name_2 in this.userState[Consts_1.UserStates.ENTITYLOOKUP]) {
                    var foundId = this.userState[Consts_1.UserStates.ENTITYLOOKUP][name_2];
                    if (foundId == id) {
                        names.push(name_2);
                        found = true;
                    }
                }
                if (!found) {
                    names.push("{UNKNOWN}");
                    BlisDebug_1.BlisDebug.Log("Missing entity name: " + id);
                }
            }
        }
        catch (Error) {
            BlisDebug_1.BlisDebug.Log(Error);
        }
        return names;
    };
    /** Remember a EntityId / value */
    BlisMemory.prototype.RememberEntity = function (entityId, value) {
        try {
            this.userState[Consts_1.UserStates.MEMORY][entityId] = value;
        }
        catch (Error) {
            BlisDebug_1.BlisDebug.Log(Error);
        }
    };
    // Return array of entityIds for which I've remembered something
    BlisMemory.prototype.EntityIds = function () {
        return Object.keys(this.userState[Consts_1.UserStates.MEMORY]);
    };
    BlisMemory.prototype.ForgetEntity = function (key) {
        try {
            this.userState[Consts_1.UserStates.MEMORY].delete[key];
        }
        catch (Error) {
            BlisDebug_1.BlisDebug.Log(Error);
        }
    };
    BlisMemory.prototype.Substitute = function (text) {
        var words = text.split(/[\s,:.?]+/);
        for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
            var word = words_1[_i];
            if (word.startsWith("$")) {
                // Key is in form of $entityName
                var entityName = word.substr(1, word.length - 1);
                var entityValue = this.EntityValue(entityName);
                if (entityValue) {
                    text = text.replace(word, entityValue);
                }
            }
        }
        return text;
    };
    BlisMemory.prototype.RememberLastStep = function (saveStep, input) {
        if (this.userState[Consts_1.UserStates.LASTSTEP] == null) {
            this.userState[Consts_1.UserStates.LASTSTEP] = new TrainStep();
        }
        this.userState[Consts_1.UserStates.LASTSTEP][saveStep] = input;
    };
    BlisMemory.prototype.LastStep = function (saveStep) {
        if (!this.userState[Consts_1.UserStates.LASTSTEP]) {
            return null;
        }
        return this.userState[Consts_1.UserStates.LASTSTEP][saveStep];
    };
    //--------------------------------------------------------
    BlisMemory.prototype.RememberTrainStep = function (saveStep, value) {
        if (!this.userState[Consts_1.UserStates.TRAINSTEPS]) {
            this.userState[Consts_1.UserStates.TRAINSTEPS] = [];
            this.userState[Consts_1.UserStates.TRAINSTEPS][Consts_1.SaveStep.API] = [];
        }
        var curStep = null;
        if (saveStep == Consts_1.SaveStep.INPUT) {
            curStep = new TrainStep();
            curStep[Consts_1.SaveStep.INPUT] = value;
            this.userState[Consts_1.UserStates.TRAINSTEPS].push(curStep);
        }
        else {
            var lastIndex = this.userState[Consts_1.UserStates.TRAINSTEPS].length - 1;
            curStep = this.userState[Consts_1.UserStates.TRAINSTEPS][lastIndex];
            if (saveStep == Consts_1.SaveStep.ENTITY) {
                curStep[Consts_1.SaveStep.ENTITY] = value;
            }
            else if (saveStep == Consts_1.SaveStep.RESPONSE) {
                curStep[Consts_1.SaveStep.RESPONSE] = value;
            }
            else if (saveStep = Consts_1.SaveStep.API) {
                // Can be mulitple API steps
                curStep[Consts_1.SaveStep.API].push(value);
            }
            else {
                console.log("Unknown SaveStep value " + saveStep);
            }
        }
    };
    BlisMemory.prototype.TrainSteps = function () {
        return this.userState[Consts_1.UserStates.TRAINSTEPS];
    };
    BlisMemory.prototype.ClearTrainSteps = function () {
        this.userState[Consts_1.UserStates.TRAINSTEPS] = [];
    };
    //--------------------------------------------------------
    BlisMemory.prototype.AppId = function () {
        return this.userState[Consts_1.UserStates.APP];
    };
    BlisMemory.prototype.ModelId = function () {
        return this.userState[Consts_1.UserStates.MODEL];
    };
    BlisMemory.prototype.DumpEntities = function () {
        var memory = "";
        for (var entityId in this.userState[Consts_1.UserStates.MEMORY]) {
            if (memory)
                memory += ", ";
            var entityName = this.EntityId2Name(entityId);
            var entityValue = this.userState[Consts_1.UserStates.MEMORY][entityId];
            memory += "[$" + entityName + " : " + entityValue + "]";
        }
        if (memory == "") {
            memory = '[ - none - ]';
        }
        return memory;
    };
    BlisMemory.prototype.Dump = function () {
        var text = "";
        text += "App: " + this.userState[Consts_1.UserStates.APP] + "\n\n";
        text += "Model: " + this.userState[Consts_1.UserStates.MODEL] + "\n\n";
        text += "Session: " + this.userState[Consts_1.UserStates.SESSION] + "\n\n";
        text += "InTeach: " + this.userState[Consts_1.UserStates.TEACH] + "\n\n";
        text += "InDebug: " + this.userState[Consts_1.UserStates.TEACH] + "\n\n";
        text += "LastStep: " + JSON.stringify(this.userState[Consts_1.UserStates.LASTSTEP]) + "\n\n";
        text += "Memory: {" + this.DumpEntities() + "}\n\n";
        text += "EntityLookup: " + JSON.stringify(this.userState[Consts_1.UserStates.ENTITYLOOKUP]) + "\n\n";
        text += "SaveLookup: " + JSON.stringify(this.userState[Consts_1.UserStates.SAVELOOKUP]) + "\n\n";
        return text;
    };
    return BlisMemory;
}());
exports.BlisMemory = BlisMemory;
//# sourceMappingURL=BlisMemory.js.map