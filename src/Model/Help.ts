import { Commands } from './Consts';
import { Command } from './Command';

export const Help =
{
    ADDACTION: "#addaction",
    DELETEACTION: "#deleteaction",
    DELETEAPP : "#deleteapp",
    PICKENTITY : "#pickentity",
    NEWAPP : "#newapp"
}

export class BlisHelp {

    public static Get(name: string) : string {
        
        let help = "";
        let command : Command = null;
        switch (name)
        {
            case Help.ADDACTION:
                help = this.CommandHelpString(Commands.ADDTEXTACTION) + "\n\n";
                help += this.CommandHelpString(Commands.ADDAPIACTION);
                return help;
            case Help.DELETEACTION:
                command = this.CommandHelp(Commands.DELETEAPP);
                help += command.description + "\n\n"
                help += `>> ${command.name} ${command.args}\n\n`;
                return help;
            case Help.DELETEAPP:
                command = this.CommandHelp(Commands.DELETEAPP);
                help += command.description + "\n\n"
                help += `>> ${command.name} ${command.args}\n\n`;
                return help;
            case Help.PICKENTITY:
                help += "Indicate one or more entities by repeating the previous entry and puting entities in brackets:\n\n";
                help += ">> [{_entity name_} {_words or phrase_}]\n\n";
                help += "For example:\n\n"
                help += ">> I want to go to [City New Orleans]\n\n";
                help += ">> I like [Food Pizza] and [Dancing Activity]";
                return help;
            case Help.NEWAPP:
                help += `Add entities and actions to your application using:\n\n`;
                help += `>> ${Commands.ADDENTITY}\n\n`;
                help += `>> ${Commands.ADDTEXTACTION}\n\n`;
                help += `>> ${Commands.ADDAPIACTION}\n\n`;
                help += `Then train your app using:\n\n`;
                help += `>> ${Commands.TEACH}\n\n`;
                help += `For help with any command type:\n\n`;
                help += `>> ${Commands.HELP} {command name}\n\n`;
                help += `To see all commands type:\n\n`;
                help += `>> ${Commands.HELP}\n\n`;
                return help;
        }
        return "Sorry. No help for this topic yet.";
    }

    public static CommandHelpString(name : string, error? : string) : string {
        let command = this.CommandHelp(name);
        let help = `**${command.description}**\n\n`

        help += `>> ${command.args}\n\n`;

        if (command.detail && command.detail.length > 0)
        {
            for (let line of command.detail)
            {
                help += `- ${line}\n\n`;
            }
        }

        if (command.examples && command.examples.length > 0)
        {
            help += "For example:\n\n"
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
            case Commands.ABANDON:
                return new Command(
                    name,
                    "Abandon the current teach dialog", null, "",null);
            case Commands.ACTIONS:
                return new Command(
                    name,
                    "List Actions in current Application.  If search term provided, filters by serach term",
                    null,
                    "{Search (Optional)}", null);
            case Commands.ADDAPIACTION:
                return new Command(
                    name,
                    "Add API call to this Application",
                    null,
                    "{_API Name_}", null);
            case Commands.ADDENTITY:
                return new Command(
                    name,
                    "Add a new entity",
                    [
                        "LUIS entities are extracted by LUIS",
                        "LOCAL entities are not procesed by LUIS",
                        "PREBUILD entites are existing pre-programmed LUIS entities",
                        "Assumes entity type LUIS if not type given",
                        "Entities prefixed with a # will accumulate values (i.e. sausage, olives and cheese)",
                        "Entities prefix with a ~ will support entity negation",
                    ],
                    "!addentity ~#{_entitiyName_} {_LUIS | LOCAL | prebuilt name_}", 
                     [
                        "!addentity name luis",
                        "!addentity #pizzatoppings luis",
                        "!addentity ~authenticated local",
                        "!addentity when datetime"
                    ]);
            case Commands.ADDTEXTACTION:
                return new Command(
                    name,
                    "Add Text response to this Application.",
                    [
                        "Indicate substitution entities with a '$' prefix",
                        "Indicate suggested entities with a '*' prefix",
                        "Text enclosed in brackets will only be displayed if enclosing entities are present"
                    ],
                    "!addtextaction {_Action Text_} --{Entity that blocks action} ++{Entity required for action}", 
                    [
                        "!addtextaction What's your *name?", 
                        "!addtextaction What's your favorite *color, $name?",
                        "!addtextaction Nice to meet you[ $name].",
                    ]);
            case Commands.APPS:
                return new Command(
                    name,
                    "List your Applications.  If search term provided, filters by serach term",
                    null,
                    "{Search (Optional)}", null);
            case Commands.CREATEAPP:
                return new Command(
                    name,
                    "Create new application",
                    null,
                    "{_appName_} {_luisKey_}", null);
            case Commands.DEBUG:
                return new Command(
                    name,
                    "Toggle debugging mode",
                    null,
                    "", 
                    null);
            case Commands.DEBUGHELP:
                return new Command(
                    name,
                    "List debugging commands or help for a specific command",
                    null,
                    "{_command_ (optional)}", null);
            case Commands.DELETEAPP:
                return new Command(
                    name,
                    "Provide the ID of the application to delete",
                    null,
                    "{_application id_}", null);
            case Commands.DELETEACTION:
                return new Command(
                    name,
                    "Delete an action on current app",
                    null,
                    "{_actionId_}", null);
            case Commands.DELETEALLAPPS:
                return new Command(
                    name,
                    "!!WARNING!! Delete all Applications associated with this BLIS account",
                    null,
                    "", null);
            case Commands.DELETEENTITY:
                return new Command(
                    name,
                    "Delete an entity on current app",
                    null,
                    "{_entityId_}", null);
            case Commands.DUMP:
                return new Command(
                    name,
                    "Show the current state of the Application",
                    null,
                    "", null);
            case Commands.EDITACTION:
                let command = BlisHelp.CommandHelp(Commands.ADDTEXTACTION);
                command.description = "Edit an action on current app";
                return command;
            case Commands.EDITENTITY:
                let eCommand = BlisHelp.CommandHelp(Commands.ADDENTITY);
                eCommand.description = "Edit an entity on current app";
                return eCommand;
            case Commands.ENTITIES:
                return new Command(
                    name,
                    "List Entities in the Application.  If search term provided, filters by search term",
                    null,
                    "{Search (Optional)}", null);
            case Commands.EXPORTAPP:
                return new Command(
                    name,
                    "Export application",
                    null,
                    "", null);
            case Commands.HELP:
                return new Command(
                    name,
                    "List commands or help for a specific command",
                    null,
                    "{_command_ (optional)}", null);
            case Commands.IMPORTAPP:
                return new Command(
                    name,
                    "Import application by GUID and merge with current application",
                    null,
                    "{_App ID_}", null);
            case Commands.LOADAPP:
                return new Command(
                    name,
                    "Load an application",
                    null,
                    "{App ID}", null);
            case Commands.START:
                return new Command(
                    name,
                    "Start the bot",
                    null,
                    "", null);
            case Commands.TEACH:
                return new Command(
                    name,
                    "Start new teaching session",
                    null,
                    "", null);
            case Commands.TRAINDIALOGS:
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