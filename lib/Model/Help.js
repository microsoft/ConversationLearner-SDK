"use strict";
var CommandHandler_1 = require("../CommandHandler");
var Command_1 = require("./Command");
var Menu_1 = require("../Menu");
var Consts_1 = require("./Consts");
var PREFIX = "%?";
exports.Help = {
    ADDAPICALL: PREFIX + "addapicall",
    ADDENTITY: PREFIX + "addentity",
    ADDRESPONSE: PREFIX + "addresponse",
    DELETEACTION: PREFIX + "deleteaction",
    DELETEAPP: PREFIX + "deleteapp",
    EDITAPICALL: PREFIX + "addapicall",
    EDITENTITY: PREFIX + "addentity",
    EDITRESPONSE: PREFIX + "addresponse",
    PICKENTITY: PREFIX + "pickentity"
};
var BlisHelp = (function () {
    function BlisHelp() {
    }
    BlisHelp.IsHelpCommand = function (text) {
        return text.startsWith(PREFIX);
    };
    BlisHelp.Get = function (name) {
        var helptext = "";
        var card = null;
        var command = null;
        switch (name) {
            case exports.Help.ADDAPICALL:
                helptext = this.CommandHelpString(CommandHandler_1.LineCommands.ADDAPICALL);
                card = Menu_1.Menu.AddAPICall();
                return [helptext, card];
            case exports.Help.ADDENTITY:
                helptext = this.CommandHelpString(CommandHandler_1.LineCommands.ADDENTITY);
                card = Menu_1.Menu.AddEntity();
                return [helptext, card];
            case exports.Help.ADDRESPONSE:
                helptext = this.CommandHelpString(CommandHandler_1.LineCommands.ADDRESPONSE);
                card = Menu_1.Menu.AddResponse();
                return [helptext, card];
            case exports.Help.DELETEACTION:
                command = this.CommandHelp(CommandHandler_1.LineCommands.DELETEAPP);
                helptext += command.description + "\n\n";
                helptext += ">> " + command.name + " " + command.args + "\n\n";
                return [helptext];
            case exports.Help.DELETEAPP:
                command = this.CommandHelp(CommandHandler_1.LineCommands.DELETEAPP);
                helptext += command.description + "\n\n";
                helptext += ">> " + command.name + " " + command.args + "\n\n";
                return [helptext];
            case exports.Help.EDITAPICALL:
                helptext = this.CommandHelpString(CommandHandler_1.LineCommands.EDITAPICALL);
                card = Menu_1.Menu.EditAPICall();
                return [helptext, card];
            case exports.Help.EDITENTITY:
                helptext = this.CommandHelpString(CommandHandler_1.LineCommands.EDITENTITY);
                card = Menu_1.Menu.AddEntity();
                return [helptext, card];
            case exports.Help.EDITRESPONSE:
                helptext = this.CommandHelpString(CommandHandler_1.LineCommands.EDITRESPONSE);
                card = Menu_1.Menu.EditResponse();
                return [helptext, card];
            case exports.Help.PICKENTITY:
                helptext += "Indicate one or more entities by repeating the previous entry and puting entities in brackets:\n\n";
                helptext += ">> [{_entity name_} {_words or phrase_}]\n\n";
                helptext += "For example:\n\n";
                helptext += ">> I want to go to [City New Orleans]\n\n";
                helptext += ">> I like [Food Pizza] and [Dancing Activity]";
                return [helptext];
        }
        return ["Sorry. No help for this topic yet."];
    };
    BlisHelp.CommandHelpString = function (name, error) {
        var command = this.CommandHelp(name);
        var help = "**" + command.description + "**\n\n";
        help += "    " + command.args + "\n\n";
        if (command.detail && command.detail.length > 0) {
            for (var _i = 0, _a = command.detail; _i < _a.length; _i++) {
                var line = _a[_i];
                help += "- " + line + "\n\n";
            }
        }
        if (command.examples && command.examples.length > 0) {
            help += "\n\nFor example:\n\n";
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
            case CommandHandler_1.LineCommands.ABANDON:
                return new Command_1.Command(name, "Abandon the current teach dialog", null, "", null);
            case CommandHandler_1.LineCommands.RESPONSES:
                return new Command_1.Command(name, "List Actions in current Application.  If search term provided, filters by serach term", null, "{Search (Optional)}", null);
            case CommandHandler_1.LineCommands.ADDAPICALL:
                return new Command_1.Command(name, "Add name of API call to add to this Application", null, "{_API Name_}", null);
            case CommandHandler_1.LineCommands.ADDENTITY:
                return new Command_1.Command(name, "Add a new entity", [
                    "LUIS entities are extracted by LUIS",
                    "LOCAL entities are not extracted by LUIS",
                    "PREBUILT entites are existing pre-programmed LUIS entities",
                    "   (Assumes entity type LUIS if not type given)",
                    "Entities prefixed with a " + Consts_1.ActionCommand.BUCKET + " will accumulate values (i.e. sausage, olives and cheese)",
                    "Entities prefix with a " + Consts_1.ActionCommand.NEGATIVE + " will support entity negation / deletion",
                ], "" + Consts_1.ActionCommand.NEGATIVE + Consts_1.ActionCommand.BUCKET + "{_entitiyName_} {_LUIS | LOCAL | prebuilt name_}", [
                    "name luis",
                    Consts_1.ActionCommand.BUCKET + "pizzatoppings luis",
                    Consts_1.ActionCommand.NEGATIVE + "authenticated local",
                    "when datetime"
                ]);
            case CommandHandler_1.LineCommands.ADDRESPONSE:
            case CommandHandler_1.LineCommands.EDITRESPONSE:
                return new Command_1.Command(name, "Add Text response to this Application.", [
                    "Indicate substitution entities with a '" + Consts_1.ActionCommand.SUBSTITUTE + "' prefix",
                    "Indicate suggested entities with a '" + Consts_1.ActionCommand.SUGGEST + "' prefix",
                    "Text enclosed in brackets will only be displayed if enclosing entities are present"
                ], "{Response Text [contingent text]} // " + Consts_1.ActionCommand.BLOCK + "{Blocking Entity} " + Consts_1.ActionCommand.REQUIRE + "{Required Entity} " + Consts_1.ActionCommand.SUGGEST + "{Suggested Entity}", [
                    "What's your " + Consts_1.ActionCommand.SUGGEST + "name?",
                    "Where are you? // " + Consts_1.ActionCommand.SUGGEST + "location",
                    "What's your favorite " + Consts_1.ActionCommand.SUGGEST + "color, " + Consts_1.ActionCommand.SUBSTITUTE + "name?",
                    "Nice to meet you[ " + Consts_1.ActionCommand.SUBSTITUTE + "name].",
                    "What is my account balance? // " + Consts_1.ActionCommand.REQUIRE + "authenticated"
                ]);
            case CommandHandler_1.LineCommands.APPS:
                return new Command_1.Command(name, "List your Applications.  If search term provided, filters by serach term", null, "{Search (Optional)}", null);
            case CommandHandler_1.LineCommands.CREATEAPP:
                return new Command_1.Command(name, "Create new application", null, "{_appName_} {_luisKey_}", null);
            case CommandHandler_1.LineCommands.DEBUG:
                return new Command_1.Command(name, "Toggle debugging mode", null, "", null);
            case CommandHandler_1.LineCommands.DEBUGHELP:
                return new Command_1.Command(name, "List debugging commands or help for a specific command", null, "{_command_ (optional)}", null);
            case CommandHandler_1.LineCommands.DELETEAPP:
                return new Command_1.Command(name, "Provide the ID of the application to delete", null, "{_application id_}", null);
            case CommandHandler_1.LineCommands.DELETEACTION:
                return new Command_1.Command(name, "Delete an action on current app", null, "{_actionId_}", null);
            case CommandHandler_1.LineCommands.DELETEALLAPPS:
                return new Command_1.Command(name, "!!WARNING!! Delete all Applications associated with this BLIS account", null, "", null);
            case CommandHandler_1.LineCommands.DELETEENTITY:
                return new Command_1.Command(name, "Delete an entity on current app", null, "{_entityId_}", null);
            case CommandHandler_1.LineCommands.DUMP:
                return new Command_1.Command(name, "Show the current state of the Application", null, "", null);
            case CommandHandler_1.LineCommands.EDITAPICALL:
                var acommand = BlisHelp.CommandHelp(CommandHandler_1.LineCommands.ADDAPICALL);
                acommand.description = "Edit a response on current app";
                return acommand;
            case CommandHandler_1.LineCommands.EDITRESPONSE:
                var command = BlisHelp.CommandHelp(CommandHandler_1.LineCommands.ADDRESPONSE);
                command.description = "Edit a response on current app";
                return command;
            case CommandHandler_1.LineCommands.EDITENTITY:
                var eCommand = BlisHelp.CommandHelp(CommandHandler_1.LineCommands.ADDENTITY);
                eCommand.description = "Edit an entity on current app";
                return eCommand;
            case CommandHandler_1.LineCommands.ENTITIES:
                return new Command_1.Command(name, "List Entities in the Application.  If search term provided, filters by search term", null, "{Search (Optional)}", null);
            case CommandHandler_1.LineCommands.EXPORTAPP:
                return new Command_1.Command(name, "Export application", null, "", null);
            case CommandHandler_1.LineCommands.HELP:
                return new Command_1.Command(name, "List commands or help for a specific command", null, "{_command_ (optional)}", null);
            case CommandHandler_1.LineCommands.IMPORTAPP:
                return new Command_1.Command(name, "Import application by GUID and merge with current application", null, "{_App ID_}", null);
            case CommandHandler_1.LineCommands.LOADAPP:
                return new Command_1.Command(name, "Load an application", null, "{App ID}", null);
            case CommandHandler_1.LineCommands.START:
                return new Command_1.Command(name, "Start the bot", null, "", null);
            case CommandHandler_1.LineCommands.TEACH:
                return new Command_1.Command(name, "Start new teaching session", null, "", null);
            case CommandHandler_1.LineCommands.TRAINDIALOGS:
                return new Command_1.Command(name, "Show training dialogs for this application", null, "{_search term_ OPTIONAL}", null);
            default:
                return new Command_1.Command(name, "MISSING HELP INFO", null, "", null);
        }
    };
    return BlisHelp;
}());
exports.BlisHelp = BlisHelp;
//# sourceMappingURL=Help.js.map