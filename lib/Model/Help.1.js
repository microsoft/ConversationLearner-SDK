"use strict";
var Consts_1 = require("./Consts");
exports.Help = {
    PICKENTITY: "#pickentity",
    NEWAPP: "#newapp"
};
var BlisHelp = (function () {
    function BlisHelp() {
    }
    BlisHelp.Get = function (name) {
        var help = "";
        switch (name) {
            case exports.Help.PICKENTITY:
                help += "Indicate one or more entities by repeating the previous entry and puting entities in brackets:\n\n";
                help += ">> [{_entity name_} {_words or phrase_}]\n\n";
                help += "For example:\n\n";
                help += ">> I want to go to [City New Orleans]\n\n";
                help += ">> I like [Food Pizza] and [Dancing Activity]";
                return help;
            case exports.Help.NEWAPP:
                help += "First add entities and actions to your application using:\n\n";
                help += ">> " + Consts_1.Commands.ADDENTITY + "\n\n";
                help += ">> " + Consts_1.Commands.ADDTEXTACTION + "\n\n";
                help += ">> " + Consts_1.Commands.ADDAPIACTION + "\n\n";
                help += "Then train your app using:\n\n";
                help += ">> " + Consts_1.Commands.TEACH + "\n\n";
                help += "For help with any command type:\n\n";
                help += ">> " + Consts_1.Commands.HELP + " {command name}\n\n";
                help += "To see all commands type:\n\n";
                help += ">> " + Consts_1.Commands.HELP + " {command name}\n\n";
                return help;
        }
        return "Sorry. No help for this topic yet.";
    };
    return BlisHelp;
}());
exports.BlisHelp = BlisHelp;
//# sourceMappingURL=Help.1.js.map