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
                help = this.CommandHelpString(Consts_1.Commands.ADDTEXTACTION) + "\n\n";
                help += this.CommandHelpString(Consts_1.Commands.ADDAPIACTION);
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
                help += ">> " + Consts_1.Commands.ADDTEXTACTION + "\n\n";
                help += ">> " + Consts_1.Commands.ADDAPIACTION + "\n\n";
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
        var help = command.description + "\n\n";
        help += ">> " + command.args + "\n\n";
        if (command.examples && command.examples.length > 0) {
            help += "For example:\n\n";
            for (var _i = 0, _a = command.examples; _i < _a.length; _i++) {
                var example = _a[_i];
                help += "     " + example + "\n\n";
            }
        }
        if (error) {
            help = "$**{error}**\n\n\n\n" + help;
        }
        return help;
    };
    BlisHelp.CommandHelp = function (name) {
        var info = {};
        switch (name) {
            case Consts_1.Commands.ABANDON:
                return new Command_1.Command(name, "Abandon the current teach dialog", "", null);
            case Consts_1.Commands.ACTIONS:
                return new Command_1.Command(name, "List Actions on the Application.  If 'Verbose' option provided, include Action IDs", "{_Verbose_ (Optional)}", null);
            case Consts_1.Commands.ADDAPIACTION:
                return new Command_1.Command(name, "Add API Action to this Application", "{_API Name_}", null);
            case Consts_1.Commands.ADDENTITY:
                return new Command_1.Command(name, "Add a new entity", "{_entitiyName_} {_LUIS | LOCAL_} {_prebuildName?_}", ["!addentity name luis",
                    "!addentity color local"]);
            case Consts_1.Commands.ADDTEXTACTION:
                return new Command_1.Command(name, "Add Text Action to this Application.  Indicate entities with a '$' prefix", "{_Action Text_} --{Entity that blocks action} ++{Entity required for action}", ["What's your name? --name",
                    "What's your favorite color, $name? --color ++name",
                    "$color is a nice color, $name ++name ++color"]);
            case Consts_1.Commands.APPS:
                return new Command_1.Command(name, "List all Applications associated with this BLIS account", "", null);
            case Consts_1.Commands.CREATEAPP:
                return new Command_1.Command(name, "Create new application", "{_appName_} {_luisKey_}", null);
            case Consts_1.Commands.DEBUG:
                return new Command_1.Command(name, "Toggle debugging mode", "", null);
            case Consts_1.Commands.DEBUGHELP:
                return new Command_1.Command(name, "List debugging commands or help for a specific command", "{_command_ (optional)}", null);
            case Consts_1.Commands.DELETEAPP:
                return new Command_1.Command(name, "Provide the ID of the application to delete", "{_application id_}", null);
            case Consts_1.Commands.DELETEACTION:
                return new Command_1.Command(name, "Delete an action on current app", "{_actionId_}", null);
            case Consts_1.Commands.DELETEALLAPPS:
                return new Command_1.Command(name, "!!WARNING!! Delete all Applications associated with this BLIS account", "", null);
            case Consts_1.Commands.DUMP:
                return new Command_1.Command(name, "Show the current state of the Application", "", null);
            case Consts_1.Commands.ENTITIES:
                return new Command_1.Command(name, "List Entities on the Application.  If 'Verbose' option provided, include Entity IDs", "{_Verbose_ (Optional)}", null);
            case Consts_1.Commands.EXPORTAPP:
                return new Command_1.Command(name, "Export application", "", null);
            case Consts_1.Commands.HELP:
                return new Command_1.Command(name, "List commands or help for a specific command", "{_command_ (optional)}", null);
            case Consts_1.Commands.IMPORTAPP:
                return new Command_1.Command(name, "Import application by GUID and merge with current application", "{_App ID_}", null);
            case Consts_1.Commands.LOADAPP:
                return new Command_1.Command(name, "Load an application", "{App ID}", null);
            case Consts_1.Commands.START:
                return new Command_1.Command(name, "Start the bot", "", null);
            case Consts_1.Commands.TEACH:
                return new Command_1.Command(name, "Start new teaching session", "", null);
            case Consts_1.Commands.TRAINDIALOGS:
                return new Command_1.Command(name, "Show training dialogs for this application", "{_search term_ OPTIONAL}", null);
            default:
                return new Command_1.Command(name, "MISSING HELP INFO", "", null);
        }
    };
    return BlisHelp;
}());
exports.BlisHelp = BlisHelp;
//# sourceMappingURL=Help.js.map