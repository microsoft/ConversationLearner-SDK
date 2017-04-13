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
import { Page } from './Model/Page';
import { BlisContext } from './BlisContext';
import { BlisAppContent } from './Model/BlisAppContent'
import { Utils } from './Utils';
import { UserStates, ActionCommand, ActionTypes, TeachAction } from './Model/Consts';

// Internal command prefix
const INTPREFIX = "%~"

// Command line prefix
const COMMANDPREFIX = "!"

// Internal commands. (Not for user)
export const IntCommands =
{
    ADDAPICALL : INTPREFIX + "addapicall",
    ADDENTITY : INTPREFIX + "addentity",
    ADDRESPONSE : INTPREFIX + "addresponse",
    APICALLS : INTPREFIX + "apicalls",
    APPS : INTPREFIX + "apps",
    CANCEL : INTPREFIX + "cancel",
    CREATEAPP : INTPREFIX + "createapp",
    DELETEAPP : INTPREFIX + "deleteapp",
    DELETEDIALOG : INTPREFIX + "deletedialog",
    DONETEACH : INTPREFIX + "doneteach",
    EDITAPP : INTPREFIX + "editapp",
    EDITAPICALL : INTPREFIX + "editapicall",
    EDITENTITY : INTPREFIX + "editentity",
    EDITRESPONSE : INTPREFIX + "editresponse",
    ENTITIES: INTPREFIX + "entities",
    FORGETTEACH : INTPREFIX + "forgetteach",
    RESPONSES: INTPREFIX + "responses",
    SAVETEACH: INTPREFIX + "saveteach",
    TRAINDIALOGS: INTPREFIX + "traindialogs",
    TRAINDIALOG_NEXT: INTPREFIX + "nexttraindialogs",
    TRAINDIALOG_PREV: INTPREFIX + "prevtraindialogs"
}

export const LineCommands =
{
    ABANDON: COMMANDPREFIX + "abandon",
    ACTIONS: COMMANDPREFIX + "actions",
    ADDENTITY : COMMANDPREFIX + "addentity",
    ADDAPICALL : COMMANDPREFIX + "addapicall",   
    ADDRESPONSE: COMMANDPREFIX + "addresponse",  
    APICALLS: COMMANDPREFIX + "apicalls",
    APPS : COMMANDPREFIX + "apps",
    CREATEAPP : COMMANDPREFIX + "createapp",
    DEBUG : COMMANDPREFIX + "debug",
    DEBUGHELP : COMMANDPREFIX + "debughelp",
    DELETEACTION : COMMANDPREFIX + "deleteaction",
    DELETEALLAPPS: COMMANDPREFIX + "deleteallapps",
    DELETEAPP : COMMANDPREFIX + "deleteapp",
    DELETEENTITY : COMMANDPREFIX + "deleteentity",
    DONE : COMMANDPREFIX + "done",
    DUMP : COMMANDPREFIX + "dump",
    EDITAPICALL : COMMANDPREFIX + "editapicall",
    EDITENTITY : COMMANDPREFIX + "editentity",
    EDITRESPONSE : COMMANDPREFIX + "editresponse",
    ENTITIES : COMMANDPREFIX + "entities",
    EXPORTAPP : COMMANDPREFIX + "exportapp",
    HELP : COMMANDPREFIX + "help",
    IMPORTAPP : COMMANDPREFIX + "importapp",
    LOADAPP: COMMANDPREFIX + "loadapp",
    RESPONSES : COMMANDPREFIX + "responses",
    START: COMMANDPREFIX + "start",
    TEACH : COMMANDPREFIX + "teach",
    TRAINDIALOGS : COMMANDPREFIX + "traindialogs"
}

export class CommandHandler
{ 

    public static IsIntCommand(text : string) 
    {
        return text.startsWith(INTPREFIX);
    }

    public static IsCommandLine(text : string) 
    {
        return text.startsWith(COMMANDPREFIX);
    }

    /** Next incoming text from user is a command.  Send cue card */
    private static async CueCommand(context : BlisContext, command : string, args : string,  cb : (cards : (string | builder.IIsAttachment)[]) => void) : Promise<void>
    {
        try
        {         
            // Store edit command so I can capture the next user input as the edit
            let cueCommand = new CueCommand(command, args);
            let memory = context.Memory();
            memory.SetCueCommand(cueCommand);

            if (command == LineCommands.ADDAPICALL)
            {
                cb([Menu.AddAPICall()]);
            }
            else if (command == LineCommands.ADDENTITY)
            {
                cb([Menu.AddEntity()]);
            }
            else if (command == LineCommands.ADDRESPONSE)
            {
                cb([Menu.AddResponse()]);
            }
            else if (command == LineCommands.APICALLS)
            {
                cb([Menu.APICalls()]);
            }
            else if (command == LineCommands.APPS)
            {
                cb([Menu.Apps()]);
            }
            else if (command == LineCommands.CREATEAPP)
            {
                cb([Menu.CreateApp()]);
            }
            else if (command == LineCommands.EDITAPICALL)
            {
                let action = await context.client.GetAction(context.state[UserStates.APP], args);
                cb([Menu.EditAPICall(action)]);
            }
            else if (command == LineCommands.EDITENTITY)
            {
                let entity = await context.client.GetEntity(context.state[UserStates.APP], args);
                cb([Menu.EditEntity(entity)]);
            }
            else if (command == LineCommands.EDITRESPONSE)
            {
                let action = await context.client.GetAction(context.state[UserStates.APP], args);
                cb([Menu.EditResponse(action)]);
            }
            else if (command == LineCommands.ENTITIES)
            {
                cb([Menu.Entities()]);
            }
            else if (command == LineCommands.RESPONSES)
            {
                cb([Menu.Responses()]);
            }
            else if (command == LineCommands.TRAINDIALOGS)
            {
                cb([Menu.TrainDialogs()]);
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

        //-------- Valid any time -----------------------//
        if (command == IntCommands.ADDRESPONSE) {
            this.CueCommand(context, LineCommands.ADDRESPONSE, null, (responses) => {
                cb(responses);
            });
            return;
        } 
        else if (command == IntCommands.ADDAPICALL) {
            this.CueCommand(context, LineCommands.ADDAPICALL, null, (responses) => {
                cb(responses);
            });
            return;
        }
        //-------- Only valid in Teach ------------------//
        if (context.state[UserStates.TEACH]) {
            if (command == IntCommands.APICALLS) {
                this.CueCommand(context, LineCommands.APICALLS, arg, (responses) => {
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
                    { 
                        "Save" : IntCommands.SAVETEACH , 
                        "Abandon" : IntCommands.FORGETTEACH
                    });
                cb([steps, card]);
            }
            else 
            {
                cb([`Action can't be performed while teaching.`]);
            }
        }
        //-------- Valid not in Teach ------------------//
        else 
        { 
            if (command == IntCommands.ADDENTITY) {
                this.CueCommand(context, LineCommands.ADDENTITY, null, (responses) => {
                    cb(responses);
                });
            }
            else if (command == IntCommands.APPS) {
                this.CueCommand(context, LineCommands.APPS, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == IntCommands.CREATEAPP) {
                this.CueCommand(context, LineCommands.CREATEAPP, null, (responses) => {
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
            else if (command == IntCommands.EDITAPICALL) {
                this.CueCommand(context, LineCommands.EDITAPICALL, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == IntCommands.EDITAPP) {
                cb(Menu.EditApp());
            }
            else if (command == IntCommands.EDITENTITY) {
                this.CueCommand(context, LineCommands.EDITENTITY, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == IntCommands.EDITRESPONSE) {
                this.CueCommand(context, LineCommands.EDITRESPONSE, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == IntCommands.ENTITIES) {
                this.CueCommand(context, LineCommands.ENTITIES, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == IntCommands.RESPONSES) {
                this.CueCommand(context, LineCommands.RESPONSES, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == IntCommands.TRAINDIALOGS) {
                this.CueCommand(context, LineCommands.TRAINDIALOGS, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == IntCommands.TRAINDIALOG_NEXT)
            {
                // Next page
                let page = context.Memory().NextPage();
                TrainDialog.Get(context, page.search, page.index, false, (responses) => {
                    cb(responses);
                });
            }
            else if (command == IntCommands.TRAINDIALOG_PREV)
            {
                // Next page
                let page = context.Memory().PrevPage();
                TrainDialog.Get(context, page.search, page.index, false, (responses) => {
                    cb(responses);
                });
            }
            else 
            {   
                cb(["Not a valid command or only available in Teach mode."]);
            }
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
        if (command == LineCommands.ACTIONS)
        {
            Action.GetAll(context, null, args, (responses) => {
                cb(responses);
            });
        }
        else if (command == LineCommands.ADDAPICALL)
        {
            Action.Add(context, null, ActionTypes.API, args, (responses, actionId) => {
                cb(responses, TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == LineCommands.ADDRESPONSE)
        {
            
            Action.Add(context, null, ActionTypes.TEXT, args, (responses, actionId) => {
                cb(responses, TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == LineCommands.ADDENTITY)
        {
            let [content, type] = args.split(' ');
            Entity.Add(context, null, type, content, (responses) => {
                cb(responses, TeachAction.RETRAIN);
            });
        }
        else if (command == LineCommands.APICALLS)
        {
            Action.GetAll(context, ActionTypes.API, args, (responses) => {
                cb(responses);
            });
        }
        else if (command == LineCommands.DEBUG)
        {
            context.state[UserStates.DEBUG] = !context.state[UserStates.DEBUG];
            BlisDebug.enabled = context.state[UserStates.DEBUG];
            cb(["Debug " + (BlisDebug.enabled ? "Enabled" : "Disabled")]);
        }
        else if (command == LineCommands.DEBUGHELP)
        {
            cb([this.DebugHelp()]);
        }
        else if (command == LineCommands.DUMP)
        {
            let memory = context.Memory();
            cb([memory.Dump()]);
        }
        else if (command == LineCommands.ENTITIES)
        { 
            Entity.Get(context, args, (responses) => {
                cb(responses);
            });
        }
        else if (command == LineCommands.HELP)
        {
            cb([this.Help(args)]);
        }
        else if (command == LineCommands.RESPONSES)
        {
            Action.GetAll(context, ActionTypes.TEXT, args, (responses) => {
                cb(responses);
            });
        }
        //---------------------------------------------------
        // Command only allowed in TEACH
        else if (context.state[UserStates.TEACH])
        {
            if (command == LineCommands.ABANDON)
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
            if (command == LineCommands.APPS)
            {
                BlisApp.GetAll(context, args, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.CREATEAPP)
            {
                let [appname, luiskey] = args.split(' ');
                BlisApp.Create(context, appname, luiskey, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.DELETEALLAPPS)
            {
                BlisApp.DeleteAll(context, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.DELETEACTION)
            {
                let [actionId] = args.split(' ');
                Action.Delete(context, actionId, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.DELETEAPP)
            {
                Utils.SendMessage(context, "Deleting app...");
                let [appid] = args.split(' ');
                BlisApp.Delete(context, appid, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.DELETEENTITY)
            {
                let [entityId] = args.split(' ');
                Entity.Delete(context, entityId, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.DONE)
            {
                cb(Menu.Home(" "));
            }
            else if (command == LineCommands.EDITAPICALL)  
            {   
                let [actionId] = args.split(' '); 
                let content = this.RemoveWords(args, 1);
                Action.Add(context, actionId, ActionTypes.API, content, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.EDITRESPONSE)  
            {   
                let [actionId] = args.split(' '); 
                let content = this.RemoveWords(args, 1);
                Action.Add(context, actionId, ActionTypes.TEXT, content, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.EDITENTITY)  
            {         
                let [entityId, content] = args.split(' ');     
                Entity.Add(context, entityId, null, content, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.EXPORTAPP)
            {
                BlisAppContent.Export(context, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.IMPORTAPP)
            {
                Utils.SendMessage(context, "Importing app...");
                let [appId] = args.split(' ');   
                BlisAppContent.Import(context, appId, (responses) => {
                    cb(responses); 
                });
            }
            else if (command == LineCommands.LOADAPP)
            {
                Utils.SendMessage(context, "Loading app...");
                let [appId] = args.split(' ');
                BlisAppContent.Load(context, appId, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.START)
            {
                BlisSession.NewSession(context, false, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.TEACH)
            {
                let memory = context.Memory();
                memory.ClearTrainSteps();
                BlisSession.NewSession(context, true, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.TRAINDIALOGS)
            {
                let [search] = args.split(' ');
                // Reset paging
                let page = new Page(0, search);
                context.state[UserStates.PAGE] = page;
                TrainDialog.Get(context, page.search, page.index, true, (responses) => {
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
        
        let memory =  context.Memory();
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
            if (!command.startsWith(COMMANDPREFIX))
            {
                command = COMMANDPREFIX+command;
            }
            let helpmsg = BlisHelp.CommandHelpString(command);
            return helpmsg;
        }
        let text = "";
        for (let item in LineCommands)
        {
            let key = LineCommands[item];
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
        text += `${LineCommands.DEBUG}\n\n       Toggle debug mode\n\n`
        text += `${LineCommands.DELETEAPP} {appId}\n\n       Delete specified application\n\n`
        text += `${LineCommands.DUMP}\n\n       Show client state\n\n`
        text += `${LineCommands.ENTITIES}\n\n       Return list of entities\n\n`
        text += `${LineCommands.RESPONSES} {y/n}\n\n       Return list of actions. If 'Y' show IDs\n\n`
        text += `${LineCommands.TRAINDIALOGS}\n\n       Return list of training dialogs\n\n`
        text += `${LineCommands.HELP}\n\n       General help`
        return text;
    }
}