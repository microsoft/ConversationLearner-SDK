import * as builder from 'botbuilder';
import { JsonProperty } from 'json-typescript-mapper';
import { BlisHelp } from '../Model/Help'; 
import { BlisDebug} from '../BlisDebug';
import { BlisClient } from '../BlisClient';
import { TakeTurnModes, EntityTypes, UserStates, TeachStep, ActionTypes, SaveStep, APICalls, ActionCommand } from '../Model/Consts';
import { IntCommands, LineCommands, HelpCommands } from './Command';
import { BlisMemory } from '../BlisMemory';
import { Utils } from '../Utils';
import { Action } from './Action';
import { Entity } from './Entity';
import { Menu } from '../Menu';
import { BlisContext } from '../BlisContext';

export class AltText
{
    @JsonProperty('text')  
    public text : string;
        
    public constructor(init?:Partial<Input>)
    {
        this.text = undefined;
        (<any>Object).assign(this, init);
    }
}

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
        for (let turn of this.turns)
        {
            let turnText = await turn.toText(client, appId);
            text += `${turnText}\n\n`;
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

    public async toText(client : BlisClient, appId : string) : Promise<string>
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
    
    public static async Delete(context : BlisContext, dialogId : string, cb : (responses: (string | builder.IIsAttachment | builder.SuggestedActions)[]) => void) : Promise<void>
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
            cb(Menu.AddEditCards(context,[card]));
        }
        catch (error) {
            let errMsg = BlisDebug.Error(error); 
            cb([errMsg]);
        }
    }

    public static async Get(context : BlisContext, searchTerm : string, index: number, refreshCache: boolean, cb : (responses: (string | builder.IIsAttachment | builder.SuggestedActions)[]) => void) : Promise<void>
    {
        try 
        {
            let appId = context.State(UserStates.APP);
            if (refreshCache)
            {
                context.client.ClearExportCache(appId)
            }
            let blisApp = await context.client.ExportApp(appId);
            let dialogs = await blisApp.FindTrainDialogs(context.client, appId, searchTerm);

            if (dialogs.length == 0)
            {
                cb(Menu.AddEditCards(context,["No dialogs found."]));
                return;
            }
            
            // Show result
            let responses = [];
            for (let i in dialogs) {
                let cur = +i;
                if (cur == index)
                {
                    let dialog = dialogs[i];
                    responses.push(dialog.text);

                    let buttons = null;
                    if (cur==0)
                    {
                        buttons = 
                        {
                            "Next" : IntCommands.TRAINDIALOG_NEXT,
                            "Done" : IntCommands.EDITAPP,
                            "Delete" : `${IntCommands.DELETEDIALOG} ${dialog.dialogId}`,
                        };
                    }
                    else if (cur == dialogs.length-1)
                    {
                        buttons = 
                        {
                            "Prev" : IntCommands.TRAINDIALOG_PREV,
                            "Done" : IntCommands.EDITAPP,
                            "Delete" : `${IntCommands.DELETEDIALOG} ${dialog.dialogId}`,
                        };
                    }
                    else
                    {
                        buttons = 
                        {
                            "Prev" : IntCommands.TRAINDIALOG_PREV,
                            "Next" : IntCommands.TRAINDIALOG_NEXT,
                            "Done" : IntCommands.EDITAPP,
                            "Delete" : `${IntCommands.DELETEDIALOG} ${dialog.dialogId}`,
                        };
                    }
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
    
