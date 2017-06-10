"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLIS_INTENT_WRAPPER = "BLIS_INTENT_WRAPPER";
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
    LOCAL: "LOCAL",
    INTENT: "INTENT"
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
    RESPONSES: "response",
    APICALLS: "api",
    CHOICES: "choices"
};
// Internal commands. (Not for user)
exports.APICalls = {
    SETTASK: "setTask",
    AZUREFUNCTION: "azureFunction",
    FIREINTENT: "fireIntent"
};
exports.ActionCommand = {
    SUGGEST: "*",
    REQUIRE: "+",
    BLOCK: "-",
    SUBSTITUTE: "$",
    BUCKET: "#",
    NEGATIVE: "~",
    TERMINAL: "WAIT",
    DEBUG: "/d"
};
//# sourceMappingURL=Consts.js.map