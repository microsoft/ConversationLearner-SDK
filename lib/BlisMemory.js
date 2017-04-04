"use strict";
var Consts_1 = require("./Model/Consts");
var BlisDebug_1 = require("./BlisDebug");
var Consts_2 = require("./Model/Consts");
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
            return this.userState[Consts_1.UserStates.APILOOKUP][entityName];
        }
        catch (error) {
            BlisDebug_1.BlisDebug.Error(error);
        }
    };
    BlisMemory.prototype.AddAPILookup = function (entityName, apiActionId) {
        this.userState[Consts_1.UserStates.APILOOKUP][entityName] = apiActionId;
    };
    BlisMemory.prototype.RemoveAPILookup = function (entityName) {
        try {
            this.userState[Consts_1.UserStates.APILOOKUP][entityName] = null;
        }
        catch (error) {
            BlisDebug_1.BlisDebug.Error(error);
        }
    };
    BlisMemory.prototype.AddEntityLookup = function (entityName, entityId) {
        this.userState[Consts_1.UserStates.ENTITYLOOKUP][entityName] = entityId;
    };
    BlisMemory.prototype.RemoveEntityLookup = function (entityName) {
        try {
            this.userState[Consts_1.UserStates.ENTITYLOOKUP][entityName] = null;
        }
        catch (error) {
            BlisDebug_1.BlisDebug.Error(error);
        }
    };
    // Does this bot have any entities
    BlisMemory.prototype.HasEntities = function () {
        return (this.userState[Consts_1.UserStates.ENTITYLOOKUP] && Object.keys(this.userState[Consts_1.UserStates.ENTITYLOOKUP]).length > 0);
    };
    BlisMemory.prototype.EntityValue = function (entityName) {
        var entityId = this.EntityName2Id(entityName);
        var value = this.userState[Consts_1.UserStates.MEMORY][entityId];
        if (typeof value == 'string') {
            return value;
        }
        return value; //TODO add and
    };
    /** Convert EntityName to EntityId */
    BlisMemory.prototype.EntityName2Id = function (name) {
        try {
            // Make independant of prefix
            name = name.replace('$', '');
            return this.userState[Consts_1.UserStates.ENTITYLOOKUP][name];
        }
        catch (error) {
            BlisDebug_1.BlisDebug.Error(error);
        }
    };
    /** Convert EntityId to EntityName */
    BlisMemory.prototype.EntityId2Name = function (id) {
        try {
            for (var name_1 in this.userState[Consts_1.UserStates.ENTITYLOOKUP]) {
                var foundId = this.userState[Consts_1.UserStates.ENTITYLOOKUP][name_1];
                if (foundId == id) {
                    return name_1;
                }
            }
            BlisDebug_1.BlisDebug.Error("Missing Entity: " + id);
            return null;
        }
        catch (error) {
            BlisDebug_1.BlisDebug.Error(error);
        }
    };
    /** Convert array entityIds into an array of entityNames */
    BlisMemory.prototype.EntityIds2Names = function (ids) {
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
                    BlisDebug_1.BlisDebug.Error("Missing entity name: " + id);
                }
            }
        }
        catch (error) {
            BlisDebug_1.BlisDebug.Error(error);
        }
        return names;
    };
    /** Remember a EntityName - EntityValue pair */
    BlisMemory.prototype.RememberEntityByName = function (entityName, entityValue) {
        var entityId = this.EntityName2Id(entityName);
        this.RememberEntityById(entityId, entityValue);
    };
    /** Remember a EntityId - EntityValue pair */
    BlisMemory.prototype.RememberEntityById = function (entityId, entityValue) {
        try {
            // Check if entity buckets values
            var entityName = this.EntityId2Name(entityId);
            if (entityName.startsWith(Consts_2.ActionCommand.BUCKET)) {
                if (!this.userState[Consts_1.UserStates.MEMORY][entityId]) {
                    this.userState[Consts_1.UserStates.MEMORY][entityId] = [];
                }
                this.userState[Consts_1.UserStates.MEMORY][entityId].push(entityValue);
            }
            else {
                this.userState[Consts_1.UserStates.MEMORY][entityId] = entityValue;
            }
        }
        catch (error) {
            BlisDebug_1.BlisDebug.Error(error);
        }
    };
    /** Return array of entityIds for which I've remembered something */
    BlisMemory.prototype.EntityIds = function () {
        return Object.keys(this.userState[Consts_1.UserStates.MEMORY]);
    };
    /** Forget an EntityName - EntityValue pair */
    BlisMemory.prototype.ForgetEntityByName = function (entityName, entityValue) {
        var entityId = this.EntityName2Id(entityName);
        this.ForgetEntityById(entityId, entityValue);
    };
    /** Forget the EntityId that I've remembered */
    BlisMemory.prototype.ForgetEntityById = function (entityId, entityValue) {
        try {
            // Check if entity buckets values
            var entityName = this.EntityId2Name(entityId);
            if (entityName.startsWith(Consts_2.ActionCommand.BUCKET)) {
                // Find case insensitive index
                var lowerCaseNames = this.userState[Consts_1.UserStates.MEMORY][entityId].map(function (value) {
                    return value.toLowerCase();
                });
                var index = lowerCaseNames.indexOf(entityValue.toLowerCase());
                if (index > -1) {
                    this.userState[Consts_1.UserStates.MEMORY][entityId].splice(index, 1);
                    if (this.userState[Consts_1.UserStates.MEMORY][entityId].length == 0) {
                        delete this.userState[Consts_1.UserStates.MEMORY][entityId];
                    }
                }
            }
            else {
                delete this.userState[Consts_1.UserStates.MEMORY][entityId];
            }
        }
        catch (error) {
            BlisDebug_1.BlisDebug.Error(error);
        }
    };
    //--------------------------------------------------------
    // SUBSTITUTE
    //--------------------------------------------------------
    BlisMemory.prototype.SubstituteEntities = function (text) {
        var words = BlisMemory.Split(text);
        for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
            var word = words_1[_i];
            if (word.startsWith(Consts_2.ActionCommand.SUBSTITUTE)) {
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
    /** Remove all bracketed text from a string */
    BlisMemory.prototype.IgnoreBrackets = function (text) {
        var start = text.indexOf('[');
        var end = text.indexOf(']');
        // If no legal contingency found
        if (start < 0 || end < 0 || end < start) {
            return text;
        }
        text = text.substring(0, start) + text.substring(end - 1, text.length - 1);
        return this.IgnoreBrackets(text);
    };
    /** Extract contigent phrases (i.e. [,$name]) */
    BlisMemory.prototype.SubstituteBrackets = function (text) {
        var start = text.indexOf('[');
        var end = text.indexOf(']');
        // If no legal contingency found
        if (start < 0 || end < 0 || end < start) {
            return text;
        }
        var phrase = text.substring(start + 1, end);
        // If phrase still contains unmatched entities, cut phrase
        if (phrase.indexOf(Consts_2.ActionCommand.SUBSTITUTE) > 0) {
            text = text.replace("[" + phrase + "]", "");
        }
        else {
            text = text.replace("[" + phrase + "]", phrase);
        }
        return text;
    };
    BlisMemory.Split = function (action) {
        return action.split(/[\s,:.?!\[\]]+/);
    };
    BlisMemory.prototype.Substitute = function (text) {
        // Clear suggestions
        text = text.replace(" " + Consts_2.ActionCommand.SUGGEST, " ");
        // First replace all entities
        text = this.SubstituteEntities(text);
        // Remove contingent entities
        text = this.SubstituteBrackets(text);
        return text;
    };
    //--------------------------------------------------------
    // LAST STEP
    //--------------------------------------------------------
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
    // TRAIN STEPS
    //--------------------------------------------------------
    BlisMemory.prototype.RememberTrainStep = function (saveStep, value) {
        if (!this.userState[Consts_1.UserStates.CURSTEP]) {
            this.userState[Consts_1.UserStates.CURSTEP] = new TrainStep();
        }
        var curStep = this.userState[Consts_1.UserStates.CURSTEP];
        if (saveStep == Consts_1.SaveStep.INPUT) {
            curStep[Consts_1.SaveStep.INPUT] = value;
        }
        else if (saveStep == Consts_1.SaveStep.ENTITY) {
            curStep[Consts_1.SaveStep.ENTITY] = value;
        }
        else if (saveStep == Consts_1.SaveStep.RESPONSE) {
            curStep[Consts_1.SaveStep.RESPONSE] = value;
            // Final step so put onto history stack
            this.FinishTrainStep();
        }
        else if (saveStep = Consts_1.SaveStep.API) {
            // Can be mulitple API steps
            curStep[Consts_1.SaveStep.API].push(value);
        }
        else {
            console.log("Unknown SaveStep value " + saveStep);
        }
    };
    /** Push current training step onto the training step history */
    BlisMemory.prototype.FinishTrainStep = function () {
        if (!this.userState[Consts_1.UserStates.TRAINSTEPS]) {
            this.userState[Consts_1.UserStates.TRAINSTEPS] = [];
        }
        var curStep = this.userState[Consts_1.UserStates.CURSTEP];
        this.userState[Consts_1.UserStates.TRAINSTEPS].push(curStep);
        this.userState[Consts_1.UserStates.CURSTEP] = null;
    };
    /** Returns input of current train step */
    BlisMemory.prototype.TrainStepInput = function () {
        var curStep = this.userState[Consts_1.UserStates.CURSTEP];
        if (curStep) {
            return curStep[Consts_1.SaveStep.INPUT];
        }
        return null;
    };
    BlisMemory.prototype.TrainSteps = function () {
        return this.userState[Consts_1.UserStates.TRAINSTEPS];
    };
    BlisMemory.prototype.ClearTrainSteps = function () {
        this.userState[Consts_1.UserStates.CURSTEP] = null;
        this.userState[Consts_1.UserStates.TRAINSTEPS] = [];
    };
    //--------------------------------------------------------
    // EDIT COMMAND
    //--------------------------------------------------------
    BlisMemory.prototype.SetEditCommand = function (editCommand) {
        this.userState[Consts_1.UserStates.EDITCOMMAND] = editCommand;
    };
    BlisMemory.prototype.EditCommand = function () {
        return this.userState[Consts_1.UserStates.EDITCOMMAND];
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
        text += "SaveLookup: " + JSON.stringify(this.userState[Consts_1.UserStates.APILOOKUP]) + "\n\n";
        return text;
    };
    return BlisMemory;
}());
exports.BlisMemory = BlisMemory;
//# sourceMappingURL=BlisMemory.js.map