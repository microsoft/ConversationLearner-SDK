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
    SAVEENTITY: "saveEntity"
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
    APILOOKUP: "APILOOKUP",
    CURSTEP: "CURSTEP",
    TRAINSTEPS: "TRAINSTEPS",
    CUECOMMAND: "CUECOMMAND"
};
//# sourceMappingURL=Consts.js.map