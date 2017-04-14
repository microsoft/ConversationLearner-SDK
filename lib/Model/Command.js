"use strict";
// Internal command prefix
var INTPREFIX = "%int%";
// Command the cue user text entry
var CUEPREFIX = "%cue%";
// Command line prefix
exports.COMMANDPREFIX = "!";
// Help commands
var HELPPREFIX = "%help%";
// Internal commands. (Not for user)
exports.CueCommands = {
    ADDAPICALL: CUEPREFIX + "addapicall",
    ADDENTITY: CUEPREFIX + "addentity",
    ADDRESPONSE: CUEPREFIX + "addresponse",
    APPS: CUEPREFIX + "apps",
    CREATEAPP: CUEPREFIX + "createapp",
    ADDAPIAZURE: CUEPREFIX + "addapiazure",
    ADDAPILOCAL: CUEPREFIX + "addapilocal",
    EDITAPICALL: CUEPREFIX + "editapicall",
    EDITENTITY: CUEPREFIX + "editentity",
    EDITRESPONSE: CUEPREFIX + "editresponse",
    ENTITIES: CUEPREFIX + "entities",
    RESPONSES: CUEPREFIX + "responses",
    TRAINDIALOGS: CUEPREFIX + "traindialogs",
};
// Internal commands. (Not for user)
exports.IntCommands = {
    APICALLS: INTPREFIX + "apicalls",
    CANCEL: INTPREFIX + "cancel",
    CHOOSEAPITYPE: INTPREFIX + "chooseapitype",
    DELETEAPP: INTPREFIX + "deleteapp",
    DELETEDIALOG: INTPREFIX + "deletedialog",
    DONETEACH: INTPREFIX + "doneteach",
    EDITAPP: INTPREFIX + "editapp",
    FORGETTEACH: INTPREFIX + "forgetteach",
    SAVETEACH: INTPREFIX + "saveteach",
    TRAINDIALOG_NEXT: INTPREFIX + "nexttraindialogs",
    TRAINDIALOG_PREV: INTPREFIX + "prevtraindialogs"
};
exports.LineCommands = {
    ABANDON: exports.COMMANDPREFIX + "abandon",
    ACTIONS: exports.COMMANDPREFIX + "actions",
    ADDAPICALL: exports.COMMANDPREFIX + "addapicall",
    ADDAPIAZURE: exports.COMMANDPREFIX + "addazureapi",
    ADDAPILOCAL: exports.COMMANDPREFIX + "addlocalapi",
    ADDENTITY: exports.COMMANDPREFIX + "addentity",
    ADDRESPONSE: exports.COMMANDPREFIX + "addresponse",
    CUEAPICALLS: exports.COMMANDPREFIX + "apicalls",
    APPS: exports.COMMANDPREFIX + "apps",
    CREATEAPP: exports.COMMANDPREFIX + "createapp",
    DEBUG: exports.COMMANDPREFIX + "debug",
    DEBUGHELP: exports.COMMANDPREFIX + "debughelp",
    DELETEACTION: exports.COMMANDPREFIX + "deleteaction",
    DELETEALLAPPS: exports.COMMANDPREFIX + "deleteallapps",
    DELETEAPP: exports.COMMANDPREFIX + "deleteapp",
    DELETEENTITY: exports.COMMANDPREFIX + "deleteentity",
    DONE: exports.COMMANDPREFIX + "done",
    DUMP: exports.COMMANDPREFIX + "dump",
    EDITAPICALL: exports.COMMANDPREFIX + "editapicall",
    EDITENTITY: exports.COMMANDPREFIX + "editentity",
    EDITRESPONSE: exports.COMMANDPREFIX + "editresponse",
    ENTITIES: exports.COMMANDPREFIX + "entities",
    EXPORTAPP: exports.COMMANDPREFIX + "exportapp",
    HELP: exports.COMMANDPREFIX + "help",
    IMPORTAPP: exports.COMMANDPREFIX + "importapp",
    LOADAPP: exports.COMMANDPREFIX + "loadapp",
    RESPONSES: exports.COMMANDPREFIX + "responses",
    START: exports.COMMANDPREFIX + "start",
    TEACH: exports.COMMANDPREFIX + "teach",
    TRAINDIALOGS: exports.COMMANDPREFIX + "traindialogs"
};
exports.HelpCommands = {
    ADDAPICALL: HELPPREFIX + "addapicall",
    ADDENTITY: HELPPREFIX + "addentity",
    ADDRESPONSE: HELPPREFIX + "addresponse",
    ADDAZUREAPI: HELPPREFIX + "addazure",
    DELETEACTION: HELPPREFIX + "deleteaction",
    DELETEAPP: HELPPREFIX + "deleteapp",
    EDITAPICALL: HELPPREFIX + "addapicall",
    EDITENTITY: HELPPREFIX + "addentity",
    EDITRESPONSE: HELPPREFIX + "addresponse",
    PICKENTITY: HELPPREFIX + "pickentity"
};
var Command = (function () {
    function Command(name, description, detail, args, examples) {
        this.name = name;
        this.description = description;
        this.detail = detail;
        this.args = args;
        this.examples = examples;
    }
    Command.IsCueCommand = function (text) {
        return text.startsWith(CUEPREFIX);
    };
    Command.IsIntCommand = function (text) {
        return text.startsWith(INTPREFIX);
    };
    Command.IsLineCommand = function (text) {
        return text.startsWith(exports.COMMANDPREFIX);
    };
    Command.IsHelpCommand = function (text) {
        return text.startsWith(HELPPREFIX);
    };
    return Command;
}());
exports.Command = Command;
//# sourceMappingURL=Command.js.map