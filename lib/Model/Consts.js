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
exports.APITypes = {
    AZURE: "AZURE",
    LOCAL: "LOCAL"
};
exports.EntityTypes = {
    LOCAL: "LOCAL",
    LUIS: "LUIS"
};
exports.TeachStep = {
    LABELENTITY: "label_entity",
    LABELACTION: "label_action"
};
exports.TeachAction = {
    RETRAIN: "retrain",
    PICKACTION: "pickaction"
};
exports.SaveStep = {
    INPUT: "input",
    ENTITY: "entity",
    RESPONSE: "response",
    API: "api",
    CHOICES: "choices"
};
// Internal commands. (Not for user)
exports.APICalls = {
    SAVEENTITY: "saveEntity",
    SETTASK: "setTask",
    AZUREFUNCTION: "azureFunction"
};
exports.ActionCommand = {
    SUGGEST: "*",
    REQUIRE: "+",
    BLOCK: "-",
    SUBSTITUTE: "$",
    BUCKET: "#",
    NEGATIVE: "~",
    DEBUG: "/d"
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
    CURSTEP: "CURSTEP",
    TRAINSTEPS: "TRAINSTEPS",
    CUECOMMAND: "CUECOMMAND",
    PAGE: "PAGE",
    POSTS: "POSTS" // Array of last messages sent to user
};
//# sourceMappingURL=Consts.js.map