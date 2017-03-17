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

    public static CommandHelpString(name : string) : string {
        let command = this.CommandHelp(name);
        let help = command.description + "\n\n"
        help += `>> ${command.args}\n\n`;
        if (command.examples && command.examples.length > 0)
        {
            help += "For example:\n\n"
            for (let example of command.examples)
            {
                help += `     ${example}\n\n`;
            }
        }
        return help;
    }
    
    public static CommandHelp(name: string) : Command {
        
        let info = {};
        switch (name)
        {
            case Commands.ACTIONS:
                return new Command(
                    name,
                    "List Actions on the Application.  If 'Verbose' option provided, include Action IDs",
                    "{_Verbose_ (Optional)}",null);
            case Commands.ADDAPIACTION:
                return new Command(
                    name,
                    "Add API Action to this Application",
                    "{_API Name_}", null);
            case Commands.ADDENTITY:
                return new Command(
                    name,
                    "Add a new entity",
                    "{_entitiyName_} {_LUIS | LOCAL_} {_prebuildName?_}", 
                     ["!addentity name luis", 
                    "!addentity color local"]);
            case Commands.ADDTEXTACTION:
                return new Command(
                    name,
                    "Add Text Action to this Application.  Indicate entities with a '$' prefix",
                    "{_Action Text_} --{Entity that blocks action} ++{Entity required for action}", 
                    ["What's your name? --name", 
                    "What's your favorite color, $name? --color ++name",
                    "$color is a nice color, $name ++name ++color"]);
            case Commands.APPS:
                return new Command(
                    name,
                    "List all Applications associated with this BLIS account",
                    "", null);
            case Commands.CREATEAPP:
                return new Command(
                    name,
                    "Create new application",
                    "{_appName_} {_luisKey_}", null);
            case Commands.DEBUG:
                return new Command(
                    name,
                    "Toggle debugging mode",
                    "", null);
            case Commands.DEBUGHELP:
                return new Command(
                    name,
                    "List debugging commands or help for a specific command",
                    "{_command_ (optional)}", null);
            case Commands.DELETEAPP:
                return new Command(
                    name,
                    "Provide the ID of the application to delete",
                    "{_application id_}", null);
            case Commands.DELETEACTION:
                return new Command(
                    name,
                    "Delete an action on current app",
                    "{_actionId_}", null);
            case Commands.DELETEALLAPPS:
                return new Command(
                    name,
                    "!!WARNING!! Delete all Applications associated with this BLIS account",
                    "", null);
            case Commands.DUMP:
                return new Command(
                    name,
                    "Show the current state of the Application",
                    "", null);
            case Commands.ENTITIES:
                return new Command(
                    name,
                    "List Entities on the Application.  If 'Verbose' option provided, include Entity IDs",
                    "{_Verbose_ (Optional)}", null);
            case Commands.HELP:
                return new Command(
                    name,
                    "List commands or help for a specific command",
                    "{_command_ (optional)}", null);
            case Commands.LOADAPP:
                return new Command(
                    name,
                    "Load an application",
                    "{App ID}", null);
            case Commands.START:
                return new Command(
                    name,
                    "Start the bot",
                    "", null);
            case Commands.TEACH:
                return new Command(
                    name,
                    "Start new teaching session",
                    "", null);
            case Commands.TRAINDIALOGS:
                return new Command(
                    name,
                    "Train in dialogs at given url",
                    "{file url}", null);
            default:
                 return new Command(
                    name,
                    "MISSING HELP INFO",
                    "", null);
        }
    }
}