import * as builder from 'botbuilder';
import { Menu} from './Menu';
import { BlisClient } from './BlisClient';
import { TrainDialog } from './Model/TrainDialog';
import { BlisApp } from './Model/BlisApp'
import { BlisMemory } from './BlisMemory';
import { BlisDebug} from './BlisDebug';
import { BlisSession} from './Model/BlisSession';
import { CueCommand } from './Model/CueCommand';
import { BlisHelp } from './Model/Help';
import { Action } from './Model/Action';
import { Entity } from './Model/Entity';
import { Pager } from './Model/Pager';
import { BlisContext } from './BlisContext';
import { BlisAppContent } from './Model/BlisAppContent'
import { Utils } from './Utils';
import { UserStates, ActionCommand, ActionTypes, TeachAction, APITypes } from './Model/Consts';
import { COMMANDPREFIX, LineCommands, IntCommands, CueCommands, HelpCommands } from './Model/Command';
import { EditableResponse } from './Model/EditableResponse';

export class CommandHandler
{ 

    /** Next incoming text from user is a command.  Send cue card */
    private static async CueCommand(context : BlisContext, command : string, args : string,  cb : (cards : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]) => void) : Promise<void>
    {
        try
        {         
            // Store edit command so I can capture the next user input as the edit
            let cueCommand = new CueCommand(command, args);
            let memory = context.Memory();
            memory.SetCueCommand(cueCommand);

            if (command == LineCommands.ADDALTTEXT)
            {
                let card = Utils.MakeHero("Enter Step Number and New User Text", "{turn number} {new input text}", null, []);
                cb([card]);
            }
            else if (command == LineCommands.ADDAPIAZURE)
            {
                cb([Menu.AddAzureApi()]);
            }
            else if (command == LineCommands.ADDAPILOCAL)
            {
                cb([Menu.AddLocalApi()]);
            }
            else if (command == LineCommands.ADDENTITY)
            {
                cb([Menu.AddEntity()]);
            }
            else if (command == LineCommands.ADDRESPONSETEXT)
            {
                cb([Menu.AddResponseText()]);
            }
            else if (command == LineCommands.ADDRESPONSEINTENT)
            {
                cb([Menu.AddResponseIntent()]);
            }
            else if (command == LineCommands.CUEAPICALLS)
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
                let action = await context.client.GetAction(context.State(UserStates.APP), args);
                cb([Menu.EditAPICall(action)]);
            }
            else if (command == LineCommands.EDITENTITY)
            {
                let entity = await context.client.GetEntity(context.State(UserStates.APP), args);
                cb([Menu.EditEntity(entity)]);
            }
            else if (command == LineCommands.EDITRESPONSE)
            {
                let action = await context.client.GetAction(context.State(UserStates.APP), args);
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
            let errMsg = BlisDebug.Error(error); 
            cb([errMsg]);
        }
    }

    public static HandleCueCommand(context : BlisContext, input : string, cb: (responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], teachAction? : string, actionData? : string) => void) : void {
    
        let [command, arg, arg2, arg3] = input.split(' ');
        command = command.toLowerCase();

        // Update editable buttons
        EditableResponse.Replace(context.session, command);

        //-------- Valid any time -----------------------//
        if (command == CueCommands.ADDRESPONSE) {
            this.CueCommand(context, LineCommands.ADDRESPONSE, null, (responses) => {
                cb(responses);
            });
            return;
        } 
        else if (command == CueCommands.ADDRESPONSETEXT) {
            this.CueCommand(context, LineCommands.ADDRESPONSETEXT, null, (responses) => {
                cb(responses);
            });
            return;
        }
        else if (command == CueCommands.ADDRESPONSEINTENT) {
            this.CueCommand(context, LineCommands.ADDRESPONSEINTENT, null, (responses) => {
                cb(responses);
            });
            return;
        }
        else if (command == CueCommands.ADDAPILOCAL) {
            this.CueCommand(context, LineCommands.ADDAPILOCAL, null, (responses) => {
                cb(responses);
            });
            return;
        }
        else if (command == CueCommands.ADDAPIAZURE) {
            this.CueCommand(context, LineCommands.ADDAPIAZURE, null, (responses) => {
                cb(responses);
            });
            return;
        }
        //-------- Only valid in Teach ------------------//

        //-------- Valid not in Teach ------------------//
        else 
        { 
            if (command == CueCommands.ADDALTTEXT) {
                this.CueCommand(context, LineCommands.ADDALTTEXT, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == CueCommands.ADDENTITY) {
                this.CueCommand(context, LineCommands.ADDENTITY, null, (responses) => {
                    cb(responses);
                });
            }
            else if (command == CueCommands.APPS) {
                this.CueCommand(context, LineCommands.APPS, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == CueCommands.CREATEAPP) {
                this.CueCommand(context, LineCommands.CREATEAPP, null, (responses) => {
                    cb(responses);
                });
            }
            else if (command == CueCommands.EDITAPICALL) {
                this.CueCommand(context, LineCommands.EDITAPICALL, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == CueCommands.EDITENTITY) {
                this.CueCommand(context, LineCommands.EDITENTITY, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == CueCommands.EDITRESPONSE) {
                this.CueCommand(context, LineCommands.EDITRESPONSE, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == CueCommands.ENTITIES) {
                this.CueCommand(context, LineCommands.ENTITIES, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == CueCommands.RESPONSES) {
                this.CueCommand(context, LineCommands.RESPONSES, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == CueCommands.TRAINDIALOGS) {
                this.CueCommand(context, LineCommands.TRAINDIALOGS, arg, (responses) => {
                    cb(responses);
                });
            }
            else 
            {   
                cb([`${command} isn't a valid cue command or can't be performed while teaching.`]);
            }
        }
    }

    public static HandleIntCommand(context : BlisContext, input : string, cb: (responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], teachAction? : string, actionData? : string) => void) : void {
    
        let [command, arg, arg2, arg3] = input.split(' ');
        command = command.toLowerCase();

        //-------- Valid any time -----------------------//
        if (command == IntCommands.CHOOSEAPITYPE) {
            cb([Menu.ChooseAPICall()]);
            return;
        }
        else if (command == IntCommands.CHOOSERESPONSETYPE) {
            cb([Menu.ChooseResponse(context.session)]);
            return;
        }
        //-------- Only valid in Teach ------------------//
        if (context.State(UserStates.TEACH)) {
            if (command == IntCommands.APICALLS) {
                this.CueCommand(context, LineCommands.CUEAPICALLS, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == IntCommands.SAVETEACH) {
                BlisSession.EndSession(context, (text) => {
                    cb([Menu.Home("Dialog Trained")]);
                });
            }
            else if (command == IntCommands.FORGETTEACH) {
                // TODO: flag to not save training
                BlisSession.EndSession(context, (text) => {
                    cb([Menu.Home("Dialog Abandoned")]);
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
                cb([`${command} isn't a valid Int command or can only be performed while teaching.`]);
            }
        }
        //-------- Valid not in Teach ------------------//
        else 
        { 
            if (command == IntCommands.DELETEAPP) {
                BlisApp.Delete(context, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == IntCommands.DELETEDIALOG) {
                // Delete
                TrainDialog.Delete(context, arg, (dreponses) => {
                    // Continue displaying remaining dialogs
                    TrainDialog.Get(context, true, (responses) => {
                        responses = dreponses.concat(responses);
                        cb(responses);
                    });
                });
            }
            else if (command == IntCommands.EDITDIALOG) {
                TrainDialog.Edit(context, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == IntCommands.EDITAPP) {
                cb(Menu.EditCards());
            }
            else if (command == IntCommands.TRAINDIALOG_NEXT)
            {
                // Next page
                Pager.Next(context.session);
                TrainDialog.Get(context, false, (responses) => {
                    cb(responses);
                });
            }
            else if (command == IntCommands.TRAINDIALOG_PREV)
            {
                // Next page
                Pager.Prev(context.session);
                TrainDialog.Get(context, false, (responses) => {
                    cb(responses);
                });
            }
            else if (command == IntCommands.CANCEL)
            {
                cb(Menu.EditCards(true));
            } 
            else 
            {   
                cb([`${command} is not a valid Int command or only available in Teach mode.`]);
            }
        }
    }

    public static HandleLineCommand(context : BlisContext, input : string, cb: (responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], teachAction? : string, actionData? : string) => void) : void 
    {
        let [command] = input.split(' ');
        let args = this.RemoveCommandWord(input); 
        this.ProcessCommand(context, command, args, cb);
    }

    private static ProcessCommand(context : BlisContext, command : string, args : string, cb: (responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], teachAction? : string, actionData? : string) => void) : void 
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
            Action.Add(context, null, ActionTypes.API, null, args, (responses, actionId) => {
                cb(responses, TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == LineCommands.ADDAPIAZURE)
        {
            Action.Add(context, null, ActionTypes.API, APITypes.AZURE, args, (responses, actionId) => {
                cb(responses, TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == LineCommands.ADDAPILOCAL)
        {
            Action.Add(context, null, ActionTypes.API, APITypes.LOCAL, args, (responses, actionId) => {
                cb(responses, TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == LineCommands.ADDRESPONSE)
        {         
            Action.Add(context, null, ActionTypes.TEXT, null, args, (responses, actionId) => {
                cb(responses, TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == LineCommands.ADDRESPONSETEXT)
        {
            Action.Add(context, null, ActionTypes.TEXT, null, args, (responses, actionId) => {
                cb(responses, TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == LineCommands.ADDRESPONSEINTENT)
        {
            // NOTE: Response Type INTENT are actuall API calls
            Action.Add(context, null, ActionTypes.API, APITypes.INTENT, args, (responses, actionId) => {
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
        else if (command == LineCommands.CUEAPICALLS)
        {
            Action.GetAll(context, ActionTypes.API, args, (responses) => {
                cb(responses);
            });
        }
        else if (command == LineCommands.DEBUG)
        {
            context.SetState(UserStates.DEBUG, !context.State(UserStates.DEBUG));
            BlisDebug.enabled = context.State(UserStates.DEBUG);
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
        else if (context.State(UserStates.TEACH))
        {
            if (command == LineCommands.ABANDON)
            {
                  this.HandleIntCommand(context, IntCommands.FORGETTEACH, cb);
            }
            else 
            {
                let card = Utils.MakeHero("Not allowed while teaching", null, "Complete teaching first or Abandon teaching session.", 
                    {
                        "Abandon" : IntCommands.FORGETTEACH
                    }
                )
                cb([card]); 
            }
        }
        //---------------------------------------------------
        // Commands only allowed when not in TEACH mode
        else {
            if (command == LineCommands.ADDALTTEXT)
            {
                TrainDialog.Edit(context, args, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.APPS)
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
                // End any open session
                BlisSession.EndSession(context, (responses) => {
                    cb([Menu.Home()]);
                });
            }
            else if (command == LineCommands.EDIT)
            {
                cb(Menu.EditCards());
            }
            else if (command == LineCommands.EDITAPICALL)    // TODO handle local vs azure
            {   
                let [actionId] = args.split(' '); 
                let content = Utils.RemoveWords(args, 1);
                Action.Add(context, actionId, ActionTypes.API, null, content, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.EDITRESPONSE)  
            {   
                let [actionId] = args.split(' '); 
                let content = Utils.RemoveWords(args, 1);
                Action.Add(context, actionId, ActionTypes.TEXT, null, content, (responses) => {
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

                // Set up pager
                Pager.Init(context.session, search);
                TrainDialog.Get(context, true, (responses) => {
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
       
    // Response to cued text
    public static ProcessCueCommand(context : BlisContext, input : string, cb: (responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], teachAction? : string, actionData? : string) => void) : void {
        
        let memory =  context.Memory();
        try
        {         
            // Check for cancel action
            if (input == IntCommands.CANCEL) {
                let responses = [];
                responses.push("Cancelled...");
                cb(Menu.EditCards(true));
                return;
            }   
            let cueCommand = memory.CueCommand();

            // Clear cue command
            memory.SetCueCommand(null);

            let args = cueCommand.args ? `${cueCommand.args} ` : "";
            this.ProcessCommand(context, cueCommand.commandName, `${args}${input}` , cb);
         }
        catch (error) 
        {
            let errMsg = BlisDebug.Error(error); 
            cb([errMsg]);
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

    // TOOD GET RID OF THIS
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