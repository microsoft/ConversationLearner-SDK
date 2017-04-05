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
    ABANDON: "!abandon",
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
    DELETEENTITY: "!deleteentity",
    DUMP: "!dump",
    EDITACTION: "!editaction",
    EDITENTITY: "!editentity",
    ENTITIES: "!entities",
    EXPORTAPP: "!exportapp",
    HELP: "!help",
    IMPORTAPP: "!importapp",
    LOADAPP: "!loadapp",
    START: "!start",
    TEACH: "!teach",
    TRAINDIALOGS: "!traindialogs"
};
// Internal commands. (Not for user)
exports.IntCommands = {
    DELETEAPP: '~deleteapp',
    DELETEDIALOG: '~deletedialog',
    DONETEACH: "~doneteach",
    EDITACTION: "~editaction",
    EDITENTITY: "~editentity",
    FORGETTEACH: "~forgetteach",
    SAVETEACH: "~saveteach",
};
// Internal commands. (Not for user)
exports.APICalls = {
    SAVEENTITY: "saveEntity"
};
exports.ActionCommand = {
    SUGGEST: "*",
    REQUIRE: "++",
    BLOCK: "--",
    SUBSTITUTE: "$",
    BUCKET: "#",
    NEGATIVE: "~",
    DEBUG: "/d"
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
    APILOOKUP: "APILOOKUP",
    CURSTEP: "CURSTEP",
    TRAINSTEPS: "TRAINSTEPS",
    EDITCOMMAND: "EDITCOMMAND"
};
//# sourceMappingURL=Consts.js.map