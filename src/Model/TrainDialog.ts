import * as builder from 'botbuilder';
import { JsonProperty } from 'json-typescript-mapper';
import { BlisHelp, Help } from '../Model/Help'; 
import { BlisUserState} from '../BlisUserState';
import { BlisDebug} from '../BlisDebug';
import { BlisClient } from '../BlisClient';
import { TakeTurnModes, EntityTypes, UserStates, TeachStep, Commands, IntCommands, ActionTypes, SaveStep, APICalls, ActionCommand } from '../Model/Consts';
import { BlisMemory } from '../BlisMemory';
import { Utils } from '../Utils';
import { Action } from './Action';
import { Entity } from './Entity';

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
    
    public static async Delete(blisClient : BlisClient, userState : BlisUserState, dialogId : string, cb : (text) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Training Dialog`);

        if (!dialogId)
        {
            let msg = `You must provide the ID of the dialog to delete.\n\n     ${IntCommands.DELETEDIALOG} {dialogId}`;
            cb(msg);
            return;
        }

        try
        {        
            // TODO clear savelookup
            await blisClient.DeleteTrainDialog(userState[UserStates.APP], dialogId)
            cb(`Deleted TrainDialog ${dialogId}`);
        }
        catch (error) {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(errMsg);
        }
    }

    public static async Get(blisClient : BlisClient, userState : BlisUserState, 
        address : builder.IAddress, searchTerm : string, cb : (text) => void) : Promise<void>
    {
        try 
        {
            let blisApp = await blisClient.ExportApp(userState[UserStates.APP]);
            let dialogs = await blisApp.FindTrainDialogs(blisClient, userState[UserStates.APP], searchTerm);

            if (dialogs.length == 0)
            {
                cb(["No maching dialogs found."]);
                return;
            }
            // Add delete buttons
            let responses = [];
            for (let dialog of dialogs) {
                responses.push(dialog.text);
                responses.push(Utils.MakeHero(null, dialog.dialogId, null, { "Delete" : `${IntCommands.DELETEDIALOG} ${dialog.dialogId}`}));
            }

            cb(responses);
        }
        catch (error)
        {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(errMsg);
        }
    }
}
    
