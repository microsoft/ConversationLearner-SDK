import * as builder from 'botbuilder';
import { Test} from './Test';
import { Menu} from './Menu';
import { BlisClient_v1 } from './BlisClient';
import { TrainDialog_v1 } from './Model/TrainDialog';
import { BlisApp_v1 } from './Model/BlisApp'
import { BlisMemory } from './BlisMemory';
import { BlisDebug} from './BlisDebug';
import { BlisSession} from './Model/BlisSession';
import { CueCommand } from './Memory/CueCommand';
import { BlisHelp } from './Model/Help';
import { Action_v1 } from './Model/Action';
import { Entity_v1 } from './Model/Entity';
import { Pager } from './Memory/Pager';
import { BlisContext } from './BlisContext';
import { BlisAppContent } from './Model/BlisAppContent'
import { Utils } from './Utils';
import { ActionCommand, ActionTypes_v1, TeachAction, APITypes_v1 } from './Model/Consts';
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
            let cueCommand = new CueCommand({commandName : command, args : args});
            let memory = context.Memory();
            await memory.CueCommand().Set(cueCommand);

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
                let appId = await context.Memory().BotState().AppId();
                let action = await BlisClient_v1.client.GetAction_v1(appId, args);
                cb([Menu.EditAPICall(action)]);
            }
            else if (command == LineCommands.EDITENTITY)
            {
                let appId = await context.Memory().BotState().AppId();
                let entity = await BlisClient_v1.client.GetEntity_v1(appId, args);
                cb([Menu.EditEntity(entity)]);
            }
            else if (command == LineCommands.EDITRESPONSE)
            {
                let appId = await context.Memory().BotState().AppId();
                let action = await BlisClient_v1.client.GetAction_v1(appId, args);
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

    public static async HandleIntCommand(context : BlisContext, input : string, cb: (responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], teachAction? : string, actionData? : string) => void) : Promise<void> {
    
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
        let memory = context.Memory();
        let inTeach = await memory.BotState().InTeach();
        if (inTeach) {
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
                let steps = await BlisSession.TrainStepText(context);
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
                BlisApp_v1.Delete_v1(context, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == IntCommands.DELETEDIALOG) {
                // Delete
                TrainDialog_v1.Delete(context, arg, (dreponses) => {
                    // Continue displaying remaining dialogs
                    TrainDialog_v1.Get(context, true, (responses) => {
                        responses = dreponses.concat(responses);
                        cb(responses);
                    });
                });
            }
            else if (command == IntCommands.EDITDIALOG) {
                TrainDialog_v1.Edit(context, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == IntCommands.EDITAPP) {
                cb(Menu.EditCards());
            }
            else if (command == IntCommands.TRAINDIALOG_NEXT)
            {
                // Next page
                await Pager.Next(context);
                TrainDialog_v1.Get(context, false, (responses) => {
                    cb(responses);
                });
            }
            else if (command == IntCommands.TRAINDIALOG_PREV)
            {
                // Next page
                await Pager.Prev(context);
                TrainDialog_v1.Get(context, false, (responses) => {
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

    private static async ProcessCommand(context : BlisContext, command : string, args : string, cb: (responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], teachAction? : string, actionData? : string) => void) : Promise<void>
    {
        let memory = context.Memory();
        let inTeach = await memory.BotState().InTeach();

        //---------------------------------------------------
        // Commands allowed at any time
        if (command == LineCommands.ACTIONS)
        {
            Action_v1.GetAll_v1(context, null, args, (responses) => {
                cb(responses);
            });
        }
        else if (command == LineCommands.ADDAPICALL)
        {
            Action_v1.Add_v1(context, null, ActionTypes_v1.API, null, args, (responses, actionId) => {
                cb(responses, TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == LineCommands.ADDAPIAZURE)
        {
            Action_v1.Add_v1(context, null, ActionTypes_v1.API, APITypes_v1.AZURE, args, (responses, actionId) => {
                cb(responses, TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == LineCommands.ADDAPILOCAL)
        {
            Action_v1.Add_v1(context, null, ActionTypes_v1.API, APITypes_v1.LOCAL, args, (responses, actionId) => {
                cb(responses, TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == LineCommands.ADDRESPONSE)
        {         
            Action_v1.Add_v1(context, null, ActionTypes_v1.TEXT, null, args, (responses, actionId) => {
                cb(responses, TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == LineCommands.ADDRESPONSETEXT)
        {
            Action_v1.Add_v1(context, null, ActionTypes_v1.TEXT, null, args, (responses, actionId) => {
                cb(responses, TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == LineCommands.ADDRESPONSEINTENT)
        {
            // NOTE: Response Type INTENT are actuall API calls
            Action_v1.Add_v1(context, null, ActionTypes_v1.API, APITypes_v1.INTENT, args, (responses, actionId) => {
                cb(responses, TeachAction.PICKACTION, actionId);
            });
        }
        else if (command == LineCommands.ADDENTITY)
        {
            let [content, type] = args.split(' ');
            Entity_v1.Add_v1(context, null, type, content, (responses) => {
                cb(responses, TeachAction.RETRAIN);
            });
        }
        else if (command == LineCommands.CUEAPICALLS)
        {
            Action_v1.GetAll_v1(context, ActionTypes_v1.API, args, (responses) => {
                cb(responses);
            });
        }
        else if (command == LineCommands.DEBUG)
        {
            let inDebug = <boolean> await  memory.BotState().InDebug();
            await memory.BotState().SetInDebug(!inDebug);
            BlisDebug.enabled = !inDebug;
            cb(["Debug " + (BlisDebug.enabled ? "Enabled" : "Disabled")]);
        }
        else if (command == LineCommands.DEBUGHELP)
        {
            cb([this.DebugHelp()]);
        }
        else if (command == LineCommands.DUMP)
        {
            let memory = context.Memory();
            let msg = await memory.Dump();
            cb([msg]);
        }
        else if (command == LineCommands.ENTITIES)
        { 
            Entity_v1.Get_v1(context, args, (responses) => {
                cb(responses);
            });
        }
        else if (command == LineCommands.HELP)
        {
            cb([this.Help(args)]);
        }
        else if (command == LineCommands.RESPONSES)
        {
            Action_v1.GetAll_v1(context, ActionTypes_v1.TEXT, args, (responses) => {
                cb(responses);
            });
        }
        else if (command == LineCommands.TEST)
        {
            let result = await Test.RunTest(args);
            cb([result.message]);
        }
        //---------------------------------------------------
        // Command only allowed in TEACH
        else if (inTeach)
        {
            if (command == LineCommands.ABANDON)
            {
                  await this.HandleIntCommand(context, IntCommands.FORGETTEACH, cb);
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
                TrainDialog_v1.Edit(context, args, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.APPS)
            {
                BlisApp_v1.GetAll_v1(context, args, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.CREATEAPP)
            {
                let [appname, luiskey] = args.split(' ');
                BlisApp_v1.Create_v1(context, appname, luiskey, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.DELETEALLAPPS)
            {
                BlisApp_v1.DeleteAll_v1(context, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.DELETEACTION)
            {
                let [actionId] = args.split(' ');
                Action_v1.Delete_v1(context, actionId, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.DELETEAPP)
            {
                Utils.SendMessage(context, "Deleting app...");
                let [appid] = args.split(' ');
                BlisApp_v1.Delete_v1(context, appid, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.DELETEENTITY)
            {
                let [entityId] = args.split(' ');
                Entity_v1.Delete_v1(context, entityId, (responses) => {
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
                Action_v1.Add_v1(context, actionId, ActionTypes_v1.API, null, content, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.EDITRESPONSE)  
            {   
                let [actionId] = args.split(' '); 
                let content = Utils.RemoveWords(args, 1);
                Action_v1.Add_v1(context, actionId, ActionTypes_v1.TEXT, null, content, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.EDITENTITY)  
            {         
                let [entityId, content] = args.split(' ');     
                Entity_v1.Add_v1(context, entityId, null, content, (responses) => {
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
                let responses = await BlisAppContent.Load(context, appId);
                cb(responses);
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
                await memory.TrainHistory().Clear();
                BlisSession.NewSession(context, true, (responses) => {
                    cb(responses);
                });
            }
            else if (command == LineCommands.TRAINDIALOGS)
            {
                let [search] = args.split(' ');

                // Set up pager
                await memory.Pager().Init(search);
                TrainDialog_v1.Get(context, true, (responses) => {
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
    public static async ProcessCueCommand(context : BlisContext, input : string, cb: (responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], teachAction? : string, actionData? : string) => void) : Promise<void> {
        
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
            let cueCommand = await memory.CueCommand().Get();

            // Clear cue command
            await memory.CueCommand().Clear();

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