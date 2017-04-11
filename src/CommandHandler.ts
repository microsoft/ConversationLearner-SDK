import * as builder from 'botbuilder';
import { BlisUserState} from './BlisUserState';
import { Menu} from './Menu';
import { BlisClient } from './BlisClient';
import { TrainDialog } from './Model/TrainDialog';
import { BlisApp } from './Model/BlisApp'
import { BlisMemory } from './BlisMemory';
import { BlisDebug} from './BlisDebug';
import { BlisSession} from './Model/BlisSession';
import { CueCommand } from './Model/CueCommand';
import { BlisHelp, Help } from './Model/Help';
import { Action } from './Model/Action';
import { Entity } from './Model/Entity';
import { BlisContext } from './BlisContext';
import { BlisAppContent } from './Model/BlisAppContent'
import { Utils } from './Utils';
import { UserStates, Commands, IntCommands, ActionCommand, ActionTypes, TeachAction } from './Model/Consts';

export class CommandHandler
{ 

    /** Next incoming text from user is a command.  Send cue card */
    private static async CueCommand(context : BlisContext, command : string, args : string,  cb : (text) => void) : Promise<void>
    {
        try
        {         
            // Store edit command so I can capture the next user input as the edit
            let cueCommand = new CueCommand(command, args);
            let memory = new BlisMemory(context);
            memory.SetCueCommand(cueCommand);

            if (command == Commands.ADDAPICALL)
            {
                let card = Utils.MakeHero(`Add API Call`, null, "Enter new API Call",  
                    {  
                    //      "Help" : Commands.HELP,   TODO
                         "Cancel" : IntCommands.CANCEL
                    });
                cb([card]);
            }
            else if (command == Commands.ADDENTITY)
            {
                let card = Utils.MakeHero(`Add Entity`, null, "Enter new Entity", 
                {  
                //      "Help" : Commands.HELP,   TODO
                     "Cancel" : IntCommands.CANCEL
                });
                cb([card]);
            }
            else if (command == Commands.ADDRESPONSE)
            {
                let card = Utils.MakeHero(`Add Response`, null, "Enter new Response",  
                {  
                //      "Help" : Commands.HELP,   TODO
                     "Cancel" : IntCommands.CANCEL
                });
                cb([card]);
            }
            else if (command == Commands.APICALLS)
            {
                let card = Utils.MakeHero(`Find API call`, null, "Enter search term", 
                {  
                     "Cancel" : IntCommands.CANCEL
                });
                cb([card]);
            }
            else if (command == Commands.APPS)
            {
                let card = Utils.MakeHero(`Find App`, null, "Enter search term", 
                {  
                     "Cancel" : IntCommands.CANCEL
                });
                cb([card]);
            }
            else if (command == Commands.CREATEAPP)
            {
                let card = Utils.MakeHero(`Create App`, '{appName} {LUIS key}', "Enter new App name and Luis Key",
                {  
                     "Cancel" : IntCommands.CANCEL
                });
                cb([card]);
            }
            else if (command == Commands.EDITACTION)
            {
                let action = await context.client.GetAction(context.state[UserStates.APP], args);
                let card = Utils.MakeHero(`Edit Action`, action.content, "Enter new Action context", 
                {  
                     "Cancel" : IntCommands.CANCEL
                });
                cb([card]);
            }
            else if (command == Commands.EDITENTITY)
            {
                let entity = await context.client.GetEntity(context.state[UserStates.APP], args);
                let type = entity.luisPreName ? entity.luisPreName : entity.entityType;
                let card = Utils.MakeHero(`Edit: (${entity.name})`, type, "Enter new Entity name",
                {  
                     "Cancel" : IntCommands.CANCEL
                });
                cb([card]);
            }
            else if (command == Commands.ENTITIES)
            {
                let card = Utils.MakeHero(`Find Entity`, null, "Enter search term", 
                {  
                     "Cancel" : IntCommands.CANCEL
                });
                cb([card]);
            }
            else if (command == Commands.RESPONSES)
            {
                let card = Utils.MakeHero(`Find Response`, null, "Enter search term", 
                {  
                     "Cancel" : IntCommands.CANCEL
                });
                cb([card]);
            }
            else if (command == IntCommands.TRAINDIALOGS)
            {
                let card = Utils.MakeHero(`Find Training Dialog`, null, "Enter search term", 
                {  
                     "Cancel" : IntCommands.CANCEL
                });
                cb([card]);
            }
        }
        catch (error)
        {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
    }

    public static HandleIntCommand(context : BlisContext, input : string, cb: (responses : (string|builder.IIsAttachment)[], teachAction? : string, actionData? : string) => void) : void {
    
        let [command, arg, arg2, arg3] = input.split(' ');
        command = command.toLowerCase();

        //-------- Only valid in Teach ------------------//
        if (context.state[UserStates.TEACH]) {
            if (command == IntCommands.ADDRESPONSE) {
                this.CueCommand(context, Commands.ADDRESPONSE, null, (responses) => {
                    cb(responses);
                });
            }
            else if (command == IntCommands.APICALLS) {
                this.CueCommand(context, Commands.APICALLS, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == IntCommands.SAVETEACH) {
                let cards = Menu.Home("Dialog Trained");
                BlisSession.EndSession(context, (text) => {
                    cb(cards);
                });
            }
            else if (command == IntCommands.FORGETTEACH) {
                // TODO: flag to not save training
                let cards = Menu.Home("Dialog Abandoned");
                BlisSession.EndSession(context, (text) => {
                    cb(cards);
                });
            }
            else if (command == IntCommands.DONETEACH) {
                let steps = BlisSession.TrainStepText(context);
                let card = Utils.MakeHero("", "", "Does this look good?", 
                    { "Save" : IntCommands.SAVETEACH , "Abandon" : IntCommands.FORGETTEACH});

                cb([steps, card]);
            }
            else 
            {
                cb([`Action can't be performed while teaching.`]);
            }
        }
        //-------- Valid not in Teach ------------------//
        else if (command == IntCommands.ADDAPICALL) {
            this.CueCommand(context, Commands.ADDAPICALL, null, (responses) => {
                cb(responses);
            });
        }
        else if (command == IntCommands.ADDENTITY) {
            this.CueCommand(context, Commands.ADDENTITY, null, (responses) => {
                cb(responses);
            });
        }
        else if (command == IntCommands.APPS) {
            this.CueCommand(context, Commands.APPS, arg, (responses) => {
                cb(responses);
            });
        }
        else if (command == IntCommands.CREATEAPP) {
            this.CueCommand(context, Commands.CREATEAPP, null, (responses) => {
                cb(responses);
            });
        }
        else if (command == IntCommands.DELETEAPP) {
            BlisApp.Delete(context, arg, (responses) => {
                cb(responses);
            });
        }
        else if (command == IntCommands.DELETEDIALOG) {
            TrainDialog.Delete(context, arg, (responses) => {
                cb(responses);
            });
        }
        else if (command == IntCommands.EDITACTION) {
            this.CueCommand(context, Commands.EDITACTION, arg, (responses) => {
                cb(responses);
            });
        }
        else if (command == IntCommands.EDITAPP) {
            cb(Menu.EditApp());
        }
        else if (command == IntCommands.EDITENTITY) {
            this.CueCommand(context, Commands.EDITENTITY, arg, (responses) => {
                cb(responses);
            });
        }
        else if (command == IntCommands.ENTITIES) {
            this.CueCommand(context, Commands.ENTITIES, arg, (responses) => {
                cb(responses);
            });
        }
        else if (command == IntCommands.HOME) {
            cb(Menu.Home(""));
        }
        else if (command == IntCommands.RESPONSES) {
            this.CueCommand(context, Commands.RESPONSES, arg, (responses) => {
                cb(responses);
            });
        }
        else if (command == IntCommands.TRAINDIALOGS) {
            this.CueCommand(context, Commands.TRAINDIALOGS, arg, (responses) => {
                cb(responses);
            });
        }
        else 
        {   
            let text = "_Not a valid command._\n\n\n\n" + this.Help(null);
            cb([text]);
        }
    }

    public static HandleCommandLine(context : BlisContext, input : string, cb: (responses : (string|builder.IIsAttachment)[], teachAction? : string, actionData? : string) => void) : void 
    {
        let [command] = input.split(' ');
        let args = this.RemoveCommandWord(input); 
        this.ProcessCommand(context, command, args, cb);
    }

    private static ProcessCommand(context : BlisContext, command : string, args : string, cb: (responses : (string|builder.IIsAttachment)[], teachAction? : string, actionData? : string) => void) : void 
    {
        //---------------------------------------------------
        // Commands allowed at any time
        if (command == Commands.ACTIONS)
        {
            Action.GetAll(context, null, args, (responses) => {
                cb(responses);
            });
        }
        else if (command == Commands.ADDAPICALL)
        {
            Action.Add(context, null, ActionTypes.API, args, (responses, actionId) => {
                cb(responses, TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == Commands.ADDRESPONSE)
        {
            
            Action.Add(context, null, ActionTypes.TEXT, args, (responses, actionId) => {
                cb(responses, TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == Commands.ADDENTITY)
        {
            let [content, type] = args.split(' ');
            Entity.Add(context, null, type, content, (responses) => {
                cb(responses, TeachAction.RETRAIN);
            });
        }
        else if (command == Commands.APICALLS)
        {
            Action.GetAll(context, ActionTypes.API, args, (responses) => {
                cb(responses);
            });
        }
        else if (command == Commands.DEBUG)
        {
            context.state[UserStates.DEBUG] = !context.state[UserStates.DEBUG];
            BlisDebug.enabled = context.state[UserStates.DEBUG];
            cb(["Debug " + (BlisDebug.enabled ? "Enabled" : "Disabled")]);
        }
        else if (command == Commands.DEBUGHELP)
        {
            cb([this.DebugHelp()]);
        }
        else if (command == Commands.DUMP)
        {
            let memory = new BlisMemory(context);
            cb([memory.Dump()]);
        }
        else if (command == Commands.ENTITIES)
        { 
            Entity.Get(context, args, (responses) => {
                cb(responses);
            });
        }
        else if (command == Commands.HELP)
        {
            cb([this.Help(args)]);
        }
        else if (command == Commands.RESPONSES)
        {
            Action.GetAll(context, ActionTypes.TEXT, args, (responses) => {
                cb(responses);
            });
        }
        //---------------------------------------------------
        // Command only allowed in TEACH
        else if (context.state[UserStates.TEACH])
        {
            if (command == Commands.ABANDON)
            {
                  this.HandleIntCommand(context, IntCommands.FORGETTEACH, cb);
            }
            else
            {
                cb([`_Command not valid while in Teach mode_`]);
            }
        }
        //---------------------------------------------------
        // Commands only allowed when not in TEACH mode
        else {
            if (command == Commands.APPS)
            {
                BlisApp.GetAll(context, args, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.CREATEAPP)
            {
                let [appname, luiskey] = args.split(' ');
                BlisApp.Create(context, appname, luiskey, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.DELETEALLAPPS)
            {
                BlisApp.DeleteAll(context, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.DELETEACTION)
            {
                let [actionId] = args.split(' ');
                Action.Delete(context, actionId, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.DELETEAPP)
            {
                Utils.SendMessage(context, "Deleting app...");
                let [appid] = args.split(' ');
                BlisApp.Delete(context, appid, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.DELETEENTITY)
            {
                let [entityId] = args.split(' ');
                Entity.Delete(context, entityId, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.EDITACTION)  // TODO text or API
            {   
                let [actionId, content] = args.split(' ');         
                Action.Add(context, actionId, ActionTypes.TEXT, content, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.EDITENTITY)  
            {         
                let [entityId, content] = args.split(' ');     
                Entity.Add(context, entityId, null, content, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.EXPORTAPP)
            {
                BlisAppContent.Export(context, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.IMPORTAPP)
            {
                Utils.SendMessage(context, "Importing app...");
                let [appId] = args.split(' ');   
                BlisAppContent.Import(context, appId, (responses) => {
                    cb(responses); 
                });
            }
            else if (command == Commands.LOADAPP)
            {
                Utils.SendMessage(context, "Loading app...");
                let [appId] = args.split(' ');
                BlisAppContent.Load(context, appId, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.START)
            {
                BlisSession.NewSession(context, false, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.TEACH)
            {
                let memory = new BlisMemory(context);
                memory.ClearTrainSteps();
                BlisSession.NewSession(context, true, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.TRAINDIALOGS)
            {
                let [search] = args.split(' ');
                TrainDialog.Get(context, search, (responses) => {
                    cb(responses);
                });
            }
            else 
            {
                let text = "_Command unrecognized or not valid in Teach mode_\n\n\n\n" + this.Help(null);
                cb([text]);
            }
        }
    }
       
    // For handling buttons that require subsequent text input
    public static HandleCueCommand(context : BlisContext, input : string, cb: (responses : (string|builder.IIsAttachment)[], teachAction? : string, actionData? : string) => void) : void {
        
        let memory =  new BlisMemory(context);
        try
        {         
            // Check for cancel action
            if (input == IntCommands.CANCEL) {
                let responses = [];
                responses.push("Cancelled...");
                cb(Menu.EditApp(true));
                return;
            }   
            let cueCommand = memory.CueCommand();
            let args = cueCommand.args ? `${cueCommand.args} ` : "";
            this.ProcessCommand(context, cueCommand.commandName, `${args}${input}` , cb);
         }
        catch (error) 
        {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
        finally 
        {
            // Clear cue command
            memory.SetCueCommand(null);
        }
    }

    private static Help(command : string) : string
    {
        if (command) 
        {
            // Don't require user to put ! in front of command
            if (!command.startsWith('!'))
            {
                command = "!"+command;
            }
            let helpmsg = BlisHelp.CommandHelpString(command);
            return helpmsg;
        }
        let text = "";
        for (let item in Commands)
        {
            let key = Commands[item];
            let comObj = BlisHelp.CommandHelp(key);
            text += `${key} ${comObj.args}\n\n     ${comObj.description}\n\n\n\n`;
        }
        return text;
    }

    /** Remove first work (i.e. command) from command string */
    private static RemoveCommandWord(text : string) : string 
    {
       let firstSpace = text.indexOf(' ');
       return (firstSpace > 0) ? text.slice(firstSpace+1) : ""; 
    }

    /** Remove words from start from command string */
    private static RemoveWords(text : string, numWords : number) : string 
    {
       let firstSpace = text.indexOf(' ');
       let remaining = (firstSpace > 0) ? text.slice(firstSpace+1) : "";
       numWords--; 
       if (numWords == 0)
       {
           return remaining;
       }
       return this.RemoveWords(remaining, numWords); 
    }

    private static DebugHelp() : string
    {
        let text = "";
        text += `${Commands.DEBUG}\n\n       Toggle debug mode\n\n`
        text += `${Commands.DELETEAPP} {appId}\n\n       Delete specified application\n\n`
        text += `${Commands.DUMP}\n\n       Show client state\n\n`
        text += `${Commands.ENTITIES}\n\n       Return list of entities\n\n`
        text += `${Commands.RESPONSES} {y/n}\n\n       Return list of actions. If 'Y' show IDs\n\n`
        text += `${Commands.TRAINDIALOGS}\n\n       Return list of training dialogs\n\n`
        text += `${Commands.HELP}\n\n       General help`
        return text;
    }
}