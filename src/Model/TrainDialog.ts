import * as builder from 'botbuilder';
import { JsonProperty } from 'json-typescript-mapper';
import { BlisHelp } from '../Model/Help'; 
import { BlisDebug} from '../BlisDebug';
import { BlisClient } from '../BlisClient';
import { TakeTurnModes, EntityTypes, UserStates, TeachStep, ActionTypes, SaveStep, APICalls, ActionCommand } from '../Model/Consts';
import { IntCommands, LineCommands, CueCommands, HelpCommands } from './Command';
import { BlisMemory } from '../BlisMemory';
import { Utils } from '../Utils';
import { Action } from './Action';
import { Entity } from './Entity';
import { Menu } from '../Menu';
import { Pager } from './Pager';
import { BlisContext } from '../BlisContext';
import { EditableResponse } from './EditableResponse';

export class TextEntity
{
    @JsonProperty('EndToken')  
    public endToken : number;

    @JsonProperty('EntityType')  
    public entityId : string;

    @JsonProperty('StartToken')  
    public startToken : number;

    public constructor(init?:Partial<Input>)
    {
        this.endToken = undefined;
        this.entityId = undefined;
        this.startToken = undefined;
        (<any>Object).assign(this, init);
    }
}

export class AltText
{
    @JsonProperty('text')  
    public text : string;
        
    @JsonProperty({clazz: TextEntity, name: 'text-entities'})
    public textEntities : TextEntity[];

    public constructor(init?:Partial<Input>)
    {
        this.text = undefined;
        this.textEntities = undefined;
        (<any>Object).assign(this, init);
    }
}

export class Input
{
    @JsonProperty('context')  
    public context : {};

    @JsonProperty('entities')
    public entityIds : string[];

    @JsonProperty('masked-actions')
    public maskedActionIds : string[];

    @JsonProperty('text')  
    public text : string;

    @JsonProperty({clazz: AltText, name: 'text-alts'})
    public textAlts : AltText[];

    @JsonProperty({clazz: TextEntity, name: 'text-entities'})
    public textEntities : TextEntity[];

    public async toText(client : BlisClient, appId : string) : Promise<string>
    {
        // TODO = add masked-actions and context
        if (this.text)
        {
            let text = `${this.text}`;
            for (let entityId of this.entityIds)
            {
                let entityName = await Entity.toText(client, appId, entityId)
                let entityValue = this.EntityValue(entityId);
                if (entityValue)
                {
                    text += ` [${entityName} ${entityValue}]`;
                }
                else
                {
                    text += ` [${entityName}]`;
                }       
            }

            for (let alt of this.textAlts)
            {
                text +=`\n\n-- ${alt.text}`;
            }
            return text;
        }
        return null;
    }

    private EntityValue(entityId)
    {
        for (let textEntity of this.textEntities)
        {
            if (textEntity.entityId == entityId)
            {
                return this.text.slice(textEntity.startToken, textEntity.endToken+1);
            }
        }
    }

    public constructor(init?:Partial<Input>)
    {
        this.context = undefined;
        this.entityIds = undefined;
        this.maskedActionIds = undefined;
        this.text = undefined;
        this.textAlts = undefined;
        this.textEntities = undefined;

        (<any>Object).assign(this, init);
    }
}

export class Turn
{
    @JsonProperty({clazz: Input, name: 'input'})  
    public input : Input;

    @JsonProperty('output')  
    public actionId : string;
    
    public async toText(client : BlisClient, appId : string) : Promise<string>
    {
        let inputText = await this.input.toText(client, appId);
        let actionText = await Action.toText(client, appId, this.actionId);
        if (inputText)
        {
            return `${inputText}\n\n     ${actionText}`;
        }
        return `     ${actionText}`
    }

    public constructor(init?:Partial<Turn>) 
    {
        this.input = undefined;
        this.actionId = undefined;
        (<any>Object).assign(this, init);
    }
}

export class Dialog
{
    @JsonProperty({clazz: Turn, name: 'turns'})
    public turns : Turn[];
    
    public async toText(client : BlisClient, appId : string) : Promise<string>
    {
        let text = "";
        for (let i in this.turns)
        {
            let turn = this.turns[i];
            let turnText = await turn.toText(client, appId);
            let index = `(${(+i+1)}) `;
            text += `${index}${turnText}\n\n`;
        }
        return text;
    }

    public constructor(init?:Partial<Dialog>)
    {
        this.turns = undefined;
        (<any>Object).assign(this, init);
    }
}

export class TrainDialog
{
    @JsonProperty('id')
    public id : string;

    @JsonProperty({clazz: Dialog, name: 'dialog'})
    public dialog : Dialog;

    public async toText(client : BlisClient, appId : string, number = false) : Promise<string>
    {
        let dialogText = await this.dialog.toText(client, appId);
        return `${dialogText}`;
    }

    public constructor(init?:Partial<TrainDialog>)
    {
        this.id = undefined;
        this.dialog = undefined;
        (<any>Object).assign(this, init);
    }

    public static async Edit(context : BlisContext, args : any, cb : (responses: (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]) => void) : Promise<void>
    {
        // Extract args
        let appId = context.State(UserStates.APP);
        let [dialogId, turnNum] = args.split(" ");
        let input = Utils.RemoveWords(args, 2);
        turnNum = +turnNum-1;  // 0-based array

        // Error checking
        let error = null;
        if (!dialogId) {
            error = "Must specify dialogId";
        }
        else if (turnNum < 0)
        {
            error = "Expecting turn number";
        }
        else if (!input)
        {
            error = "Expecting input text";
        }
        else
        {
            // Get train dialog
            let trainDialog = await context.client.GetTrainDialog(appId, dialogId);

            if (turnNum >= trainDialog.dialog.turns.length)
            {
                error = "Invalid turn number";
            }
            else
            {
                // Get corre}ct turn
                let turn = trainDialog.dialog.turns[turnNum];
                let altTexts = turn.input.textAlts;
                if (!altTexts) altTexts = [];
                
                // Add new text
                let nextText = new AltText({text: input});
                altTexts.push(nextText);
                trainDialog.dialog.turns[turnNum].input.textAlts = altTexts;
        
                // Save
                await context.client.EditTrainDialog(context.State(UserStates.APP), dialogId, trainDialog);

                // Show item with new content
                TrainDialog.Get(context, true, (responses) => {
                    cb(responses);
                });
            }
        }
        if (error)
        {
            let cards = [];
            cards.push(Utils.ErrorCard(error, "Expected input format {turn number} {new input text}"));
            TrainDialog.Get(context, true, (responses) => {
                cards = cards.concat(responses);
                cb(cards);
            });
        }    
    }

    public static async Delete(context : BlisContext, dialogId : string, cb : (responses: (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Training Dialog`);

        if (!dialogId)
        {
            let msg = `You must provide the ID of the dialog to delete.\n\n     ${IntCommands.DELETEDIALOG} {dialogId}`;
            cb([msg]);
            return;
        }

        try
        {        
            // TODO clear savelookup
            await context.client.DeleteTrainDialog(context.State(UserStates.APP), dialogId)
            let card = Utils.MakeHero(`Deleted TrainDialog`, null, dialogId, null);
            cb([card]);
        }
        catch (error) {
            let errMsg = BlisDebug.Error(error); 
            cb([errMsg]);
        }
    }

    public static async Get(context : BlisContext, refreshCache: boolean, cb : (responses: (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]) => void) : Promise<void>
    {
        try 
        {
            let appId = context.State(UserStates.APP);
            if (refreshCache)
            {
                context.client.ClearExportCache(appId)
            }
            let blisApp = await context.client.ExportApp(appId);
            let dialogs = await blisApp.FindTrainDialogs(context.client, appId, Pager.SearchTerm(context.session));

            if (dialogs.length == 0)
            {
                cb(Menu.AddEditCards(context,["No dialogs found."]));
                return;
            }
            
            Pager.SetLength(context.session, dialogs.length);
            let index = Pager.Index(context.session);
            // Show result
            let responses = [];
            for (let i in dialogs) {
                let cur = +i;
                if (cur == index)
                {
                    let dialog = dialogs[i];
                    responses.push(dialog.text);

                    let buttons = 
                    {
                        "Prev" : IntCommands.TRAINDIALOG_PREV,
                        "Next" : IntCommands.TRAINDIALOG_NEXT,
                        "Done" : IntCommands.EDITAPP,
                        "Delete" : `${IntCommands.DELETEDIALOG} ${dialog.dialogId}`,
                        "Edit" : `${CueCommands.ADDALTTEXT} ${dialog.dialogId}`,
                    };
                    responses.push(Utils.MakeHero(null, `${index+1} of ${dialogs.length}`, null, buttons));
                    break;
                }
            }
            cb(responses);
        }
        catch (error)
        {
            let errMsg = BlisDebug.Error(error); 
            cb([errMsg]);
        }
    }
}
    
