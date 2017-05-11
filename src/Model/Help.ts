import * as builder from 'botbuilder';
import { Command, HelpCommands, LineCommands } from './Command';
import { Menu } from '../Menu';
import { ActionCommand } from './Consts';

export class BlisHelp {

    public static Get(name: string) : (string | builder.IIsAttachment | builder.SuggestedActions)[] {
        
        let helptext = "";
        let card = null;
        let command : Command = null;
        switch (name)
        {
            case HelpCommands.ADDAPICALL:
                helptext = this.CommandHelpString(LineCommands.ADDAPICALL);
                card = Menu.ChooseAPICall()
                return [helptext, card];
            case HelpCommands.ADDENTITY:
                helptext = this.CommandHelpString(LineCommands.ADDENTITY);
                card = Menu.AddEntity();
                return [helptext, card];
            case HelpCommands.ADDRESPONSE:
                helptext = this.CommandHelpString(LineCommands.ADDRESPONSE);
                card = Menu.AddResponse();
                return [helptext, card];
            case HelpCommands.ADDAZUREAPI:
                helptext = this.CommandHelpString(LineCommands.ADDRESPONSE);
                card = Menu.AddResponse();
                return [helptext, card];
            case HelpCommands.DELETEACTION:
                command = this.CommandHelp(LineCommands.DELETEAPP);
                helptext += command.description + "\n\n"
                helptext += `>> ${command.name} ${command.args}\n\n`;
                return [helptext];
            case HelpCommands.DELETEAPP:
                command = this.CommandHelp(LineCommands.DELETEAPP);
                helptext += command.description + "\n\n"
                helptext += `>> ${command.name} ${command.args}\n\n`;
                return [helptext];
            case HelpCommands.EDITAPICALL:
                helptext = this.CommandHelpString(LineCommands.EDITAPICALL);
                card = Menu.EditAPICall();
                return [helptext, card];
            case HelpCommands.EDITENTITY:
                helptext = this.CommandHelpString(LineCommands.EDITENTITY);
                card = Menu.AddEntity();
                return [helptext, card];
            case HelpCommands.EDITRESPONSE:
                helptext = this.CommandHelpString(LineCommands.EDITRESPONSE);
                card = Menu.EditResponse();
                return [helptext, card];
            case HelpCommands.PICKENTITY:
                helptext += "Indicate one or more entities by repeating the previous entry and puting entities in brackets:\n\n";
                helptext += ">> [{_entity name_} {_words or phrase_}]\n\n";
                helptext += "For example:\n\n"
                helptext += ">> I want to go to [City New Orleans]\n\n";
                helptext += ">> I like [Food Pizza] and [Dancing Activity]";
                return [helptext];
        }
        return ["Sorry. No help for this topic yet."];
    }

    public static CommandHelpString(name : string, error? : string) : string {
        let command = this.CommandHelp(name);
        let help = `**${command.description}**\n\n`

        help += `    ${command.args}\n\n`;

        if (command.detail && command.detail.length > 0)
        {
            for (let line of command.detail)
            {
                help += `- ${line}\n\n`;
            }
        }

        if (command.examples && command.examples.length > 0)
        {
            help += "\n\nFor example:\n\n"
            for (let example of command.examples)
            {
                help += `     ${example}\n\n`;
            }
        }
        if (error) {
            help = `_${error}_\n\n--------------------------------\n\n${help}`;
        }
        return help;
    }
    
    public static CommandHelp(name: string) : Command {
        
        let info = {};
        switch (name)
        {
            case LineCommands.ABANDON:
                return new Command(
                    name,
                    "Abandon the current teach dialog", null, "",null);
            case LineCommands.RESPONSES:
                return new Command(
                    name,
                    "List Actions in current Application.  If search term provided, filters by serach term",
                    null,
                    "{Search (Optional)}", null);
            case LineCommands.ADDAPICALL:
                return new Command(
                    name,
                    "Add name of API call to add to this Application",
                    null,
                    "{_API Name_}", null);
            case LineCommands.ADDENTITY:
                return new Command(
                    name,
                    "Add a new entity",
                    [
                        "LUIS entities are extracted by LUIS",
                        "LOCAL entities are not extracted by LUIS",
                        "PREBUILT entites are existing pre-programmed LUIS entities",
                        "   (Assumes entity type LUIS if not type given)",
                        `Entities prefixed with a ${ActionCommand.BUCKET} will accumulate values (i.e. sausage, olives and cheese)`,
                        `Entities prefix with a ${ActionCommand.NEGATIVE} will support entity negation / deletion`,
                    ],
                    `${ActionCommand.NEGATIVE}${ActionCommand.BUCKET}{_entitiyName_} {_LUIS | LOCAL | prebuilt name_}`, 
                     [
                        "name luis",
                        `${ActionCommand.BUCKET}pizzatoppings luis`,
                        `${ActionCommand.NEGATIVE}authenticated local`,
                        "when datetime"
                    ]);
            case LineCommands.ADDRESPONSE:
            case LineCommands.EDITRESPONSE:
                return new Command(
                    name,
                    "Add Text response to this Application.",
                    [
                        `Indicate substitution entities with a '${ActionCommand.SUBSTITUTE}' prefix`,
                        `Indicate suggested entities with a '${ActionCommand.SUGGEST}' prefix`,
                        `Text enclosed in brackets will only be displayed if enclosing entities are present`
                    ],
                    `{Response Text [contingent text]} // ${ActionCommand.BLOCK}{Blocking Entity} ${ActionCommand.REQUIRE}{Required Entity} ${ActionCommand.SUGGEST}{Suggested Entity}`, 
                    [
                        `What's your ${ActionCommand.SUGGEST}name?`,
                        `Where are you? // ${ActionCommand.SUGGEST}location`,
                        `What's your favorite ${ActionCommand.SUGGEST}color, ${ActionCommand.SUBSTITUTE}name?`,
                        `Nice to meet you[ ${ActionCommand.SUBSTITUTE}name].`,
                        `What is my account balance? // ${ActionCommand.REQUIRE}authenticated`
                    ]);
            case LineCommands.APPS:
                return new Command(
                    name,
                    "List your Applications.  If search term provided, filters by serach term",
                    null,
                    "{Search (Optional)}", null);
            case LineCommands.CREATEAPP:
                return new Command(
                    name,
                    "Create new application",
                    null,
                    "{_appName_} {_luisKey_}", null);
            case LineCommands.DEBUG:
                return new Command(
                    name,
                    "Toggle debugging mode",
                    null,
                    "", 
                    null);
            case LineCommands.DEBUGHELP:
                return new Command(
                    name,
                    "List debugging commands or help for a specific command",
                    null,
                    "{_command_ (optional)}", null);
            case LineCommands.DELETEAPP:
                return new Command(
                    name,
                    "Provide the ID of the application to delete",
                    null,
                    "{_application id_}", null);
            case LineCommands.DELETEACTION:
                return new Command(
                    name,
                    "Delete an action on current app",
                    null,
                    "{_actionId_}", null);
            case LineCommands.DELETEALLAPPS:
                return new Command(
                    name,
                    "!!WARNING!! Delete all Applications associated with this BLIS account",
                    null,
                    "", null);
            case LineCommands.DELETEENTITY:
                return new Command(
                    name,
                    "Delete an entity on current app",
                    null,
                    "{_entityId_}", null);
            case LineCommands.DUMP:
                return new Command(
                    name,
                    "Show the current state of the Application",
                    null,
                    "", null);
            case LineCommands.EDITAPICALL:
                let acommand = BlisHelp.CommandHelp(LineCommands.ADDAPICALL);
                acommand.description = "Edit a response on current app";
                return acommand;
            case LineCommands.EDITRESPONSE:
                let command = BlisHelp.CommandHelp(LineCommands.ADDRESPONSE);
                command.description = "Edit a response on current app";
                return command;
            case LineCommands.EDITENTITY:
                let eCommand = BlisHelp.CommandHelp(LineCommands.ADDENTITY);
                eCommand.description = "Edit an entity on current app";
                return eCommand;
            case LineCommands.ENTITIES:
                return new Command(
                    name,
                    "List Entities in the Application.  If search term provided, filters by search term",
                    null,
                    "{Search (Optional)}", null);
            case LineCommands.EXPORTAPP:
                return new Command(
                    name,
                    "Export application",
                    null,
                    "", null);
            case LineCommands.HELP:
                return new Command(
                    name,
                    "List commands or help for a specific command",
                    null,
                    "{_command_ (optional)}", null);
            case LineCommands.IMPORTAPP:
                return new Command(
                    name,
                    "Import application by GUID and merge with current application",
                    null,
                    "{_App ID_}", null);
            case LineCommands.LOADAPP:
                return new Command(
                    name,
                    "Load an application",
                    null,
                    "{App ID}", null);
            case LineCommands.START:
                return new Command(
                    name,
                    "Start the bot",
                    null,
                    "", null);
            case LineCommands.TEACH:
                return new Command(
                    name,
                    "Start new teaching session",
                    null,
                    "", null);
            case LineCommands.TRAINDIALOGS:
                return new Command(
                    name,
                    "Show training dialogs for this application",
                    null,
                    "{_search term_ OPTIONAL}", null);
            default:
                 return new Command(
                    name,
                    "MISSING HELP INFO",
                    null,
                    "", null);
        }
    }
}