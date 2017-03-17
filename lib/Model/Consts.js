"use strict";
exports.TakeTurnModes = {
    CALLBACK: "lu_callback",
    TEACH: "teach",
    ACTION: "action",
    ERROR: "error"
};
exports.ActionTypes = {
    TEXT: "text",
    API: "api"
};
exports.EntityTypes = {
    LOCAL: "LOCAL",
    LUIS: "LUIS"
};
exports.TeachStep = {
    LABELENTITY: "label_entity",
    LABELACTION: "label_action"
};
exports.SaveStep = {
    INPUT: "input",
    ENTITY: "entity",
    RESPONSE: "response"
};
exports.Commands = {
    ACTIONS: "!actions",
    ADDENTITY: "!addentity",
    ADDTEXTACTION: "!addtextaction",
    ADDAPIACTION: "!addapiaction",
    APPS: "!apps",
    CREATEAPP: "!createapp",
    DEBUG: "!debug",
    DEBUGHELP: "!debughelp",
    DELETEACTION: "!deleteaction",
    DELETEALLAPPS: "!deleteallapps",
    DELETEAPP: "!deleteapp",
    DUMP: "!dump",
    ENTITIES: "!entities",
    HELP: "!help",
    LOADAPP: "!loadapp",
    START: "!start",
    TEACH: "!teach",
    TRAINDIALOGS: "!traindialogs",
    TRAINFROMURL: "!trainfromurl"
};
// Internal commands. (Not for user)
exports.IntCommands = {
    FORGETTRAIN: "~forgettrain",
    DONETRAIN: "~donetrain",
    SAVETRAIN: "~savetrain",
};
exports.Help = {
    NEWAPP: "#newapp"
};
exports.UserStates = {
    APP: "APP",
    SESSION: "SESSION",
    MODEL: "MODEL",
    TEACH: "TEACH",
    DEBUG: "DEBUG",
    MEMORY: "MEMORY",
    ENTITYLOOKUP: "ENTITYLOOKUP",
    LASTINPUT: "LASTINPUT",
    TRAINSTEPS: "TRAINSTEPS"
};
//# sourceMappingURL=Consts.js.map