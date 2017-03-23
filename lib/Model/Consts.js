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
    RESPONSE: "response",
    API: "api"
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
    EXPORTAPP: "!exportapp",
    HELP: "!help",
    LOADAPP: "!loadapp",
    START: "!start",
    TEACH: "!teach",
    TRAINDIALOGS: "!traindialogs"
};
// Internal commands. (Not for user)
exports.IntCommands = {
    FORGETTEACH: "~forgetteach",
    DONETEACH: "~doneteach",
    SAVETEACH: "~saveteach",
};
// Internal commands. (Not for user)
exports.APICalls = {
    SAVEENTITY: "saveEntity"
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
    LASTSTEP: "LASTSTEP",
    SAVELOOKUP: "SAVELOOKUP",
    TRAINSTEPS: "TRAINSTEPS"
};
//# sourceMappingURL=Consts.js.map