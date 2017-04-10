"use strict";
var Consts_1 = require("./Consts");
var Command_1 = require("./Command");
exports.Help = {
    ADDACTION: "#addaction",
    DELETEACTION: "#deleteaction",
    DELETEAPP: "#deleteapp",
    PICKENTITY: "#pickentity",
    NEWAPP: "#newapp"
};
var BlisHelp = (function () {
    function BlisHelp() {
    }
    BlisHelp.Get = function (name) {
        var help = "";
        var command = null;
        switch (name) {
            case exports.Help.ADDACTION:
                help = this.CommandHelpString(Consts_1.Commands.ADDRESPONSE) + "\n\n";
                help += this.CommandHelpString(Consts_1.Commands.ADDAPICALL);
                return help;
            case exports.Help.DELETEACTION:
                command = this.CommandHelp(Consts_1.Commands.DELETEAPP);
                help += command.description + "\n\n";
                help += ">> " + command.name + " " + command.args + "\n\n";
                return help;
            case exports.Help.DELETEAPP:
                command = this.CommandHelp(Consts_1.Commands.DELETEAPP);
                help += command.description + "\n\n";
                help += ">> " + command.name + " " + command.args + "\n\n";
                return help;
            case exports.Help.PICKENTITY:
                help += "Indicate one or more entities by repeating the previous entry and puting entities in brackets:\n\n";
                help += ">> [{_entity name_} {_words or phrase_}]\n\n";
                help += "For example:\n\n";
                help += ">> I want to go to [City New Orleans]\n\n";
                help += ">> I like [Food Pizza] and [Dancing Activity]";
                return help;
            case exports.Help.NEWAPP:
                help += "Add entities and actions to your application using:\n\n";
                help += ">> " + Consts_1.Commands.ADDENTITY + "\n\n";
                help += ">> " + Consts_1.Commands.ADDRESPONSE + "\n\n";
                help += ">> " + Consts_1.Commands.ADDAPICALL + "\n\n";
                help += "Then train your app using:\n\n";
                help += ">> " + Consts_1.Commands.TEACH + "\n\n";
                help += "For help with any command type:\n\n";
                help += ">> " + Consts_1.Commands.HELP + " {command name}\n\n";
                help += "To see all commands type:\n\n";
                help += ">> " + Consts_1.Commands.HELP + "\n\n";
                return help;
        }
        return "Sorry. No help for this topic yet.";
    };
    BlisHelp.CommandHelpString = function (name, error) {
        var command = this.CommandHelp(name);
        var help = "**" + command.description + "**\n\n";
        help += ">> " + command.args + "\n\n";
        if (command.detail && command.detail.length > 0) {
            for (var _i = 0, _a = command.detail; _i < _a.length; _i++) {
                var line = _a[_i];
                help += "- " + line + "\n\n";
            }
        }
        if (command.examples && command.examples.length > 0) {
            help += "For example:\n\n";
            for (var _b = 0, _c = command.examples; _b < _c.length; _b++) {
                var example = _c[_b];
                help += "     " + example + "\n\n";
            }
        }
        if (error) {
            help = "_" + error + "_\n\n--------------------------------\n\n" + help;
        }
        return help;
    };
    BlisHelp.CommandHelp = function (name) {
        var info = {};
        switch (name) {
            case Consts_1.Commands.ABANDON:
                return new Command_1.Command(name, "Abandon the current teach dialog", null, "", null);
            case Consts_1.Commands.RESPONSES:
                return new Command_1.Command(name, "List Actions in current Application.  If search term provided, filters by serach term", null, "{Search (Optional)}", null);
            case Consts_1.Commands.ADDAPICALL:
                return new Command_1.Command(name, "Add API call to this Application", null, "{_API Name_}", null);
            case Consts_1.Commands.ADDENTITY:
                return new Command_1.Command(name, "Add a new entity", [
                    "LUIS entities are extracted by LUIS",
                    "LOCAL entities are not procesed by LUIS",
                    "PREBUILD entites are existing pre-programmed LUIS entities",
                    "Assumes entity type LUIS if not type given",
                    "Entities prefixed with a # will accumulate values (i.e. sausage, olives and cheese)",
                    "Entities prefix with a ~ will support entity negation",
                ], "!addentity ~#{_entitiyName_} {_LUIS | LOCAL | prebuilt name_}", [
                    "!addentity name luis",
                    "!addentity #pizzatoppings luis",
                    "!addentity ~authenticated local",
                    "!addentity when datetime"
                ]);
            case Consts_1.Commands.ADDRESPONSE:
                return new Command_1.Command(name, "Add Text response to this Application.", [
                    "Indicate substitution entities with a '$' prefix",
                    "Indicate suggested entities with a '*' prefix",
                    "Text enclosed in brackets will only be displayed if enclosing entities are present"
                ], "!addtextaction {_Action Text_} --{Entity that blocks action} ++{Entity required for action}", [
                    "!addtextaction What's your *name?",
                    "!addtextaction What's your favorite *color, $name?",
                    "!addtextaction Nice to meet you[ $name].",
                ]);
            case Consts_1.Commands.APPS:
                return new Command_1.Command(name, "List your Applications.  If search term provided, filters by serach term", null, "{Search (Optional)}", null);
            case Consts_1.Commands.CREATEAPP:
                return new Command_1.Command(name, "Create new application", null, "{_appName_} {_luisKey_}", null);
            case Consts_1.Commands.DEBUG:
                return new Command_1.Command(name, "Toggle debugging mode", null, "", null);
            case Consts_1.Commands.DEBUGHELP:
                return new Command_1.Command(name, "List debugging commands or help for a specific command", null, "{_command_ (optional)}", null);
            case Consts_1.Commands.DELETEAPP:
                return new Command_1.Command(name, "Provide the ID of the application to delete", null, "{_application id_}", null);
            case Consts_1.Commands.DELETEACTION:
                return new Command_1.Command(name, "Delete an action on current app", null, "{_actionId_}", null);
            case Consts_1.Commands.DELETEALLAPPS:
                return new Command_1.Command(name, "!!WARNING!! Delete all Applications associated with this BLIS account", null, "", null);
            case Consts_1.Commands.DELETEENTITY:
                return new Command_1.Command(name, "Delete an entity on current app", null, "{_entityId_}", null);
            case Consts_1.Commands.DUMP:
                return new Command_1.Command(name, "Show the current state of the Application", null, "", null);
            case Consts_1.Commands.EDITACTION:
                var command = BlisHelp.CommandHelp(Consts_1.Commands.ADDRESPONSE);
                command.description = "Edit an action on current app";
                return command;
            case Consts_1.Commands.EDITENTITY:
                var eCommand = BlisHelp.CommandHelp(Consts_1.Commands.ADDENTITY);
                eCommand.description = "Edit an entity on current app";
                return eCommand;
            case Consts_1.Commands.ENTITIES:
                return new Command_1.Command(name, "List Entities in the Application.  If search term provided, filters by search term", null, "{Search (Optional)}", null);
            case Consts_1.Commands.EXPORTAPP:
                return new Command_1.Command(name, "Export application", null, "", null);
            case Consts_1.Commands.HELP:
                return new Command_1.Command(name, "List commands or help for a specific command", null, "{_command_ (optional)}", null);
            case Consts_1.Commands.IMPORTAPP:
                return new Command_1.Command(name, "Import application by GUID and merge with current application", null, "{_App ID_}", null);
            case Consts_1.Commands.LOADAPP:
                return new Command_1.Command(name, "Load an application", null, "{App ID}", null);
            case Consts_1.Commands.START:
                return new Command_1.Command(name, "Start the bot", null, "", null);
            case Consts_1.Commands.TEACH:
                return new Command_1.Command(name, "Start new teaching session", null, "", null);
            case Consts_1.Commands.TRAINDIALOGS:
                return new Command_1.Command(name, "Show training dialogs for this application", null, "{_search term_ OPTIONAL}", null);
            default:
                return new Command_1.Command(name, "MISSING HELP INFO", null, "", null);
        }
    };
    return BlisHelp;
}());
exports.BlisHelp = BlisHelp;
//# sourceMappingURL=Help.js.map