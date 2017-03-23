import { JsonProperty } from 'json-typescript-mapper';
import { BlisUserState } from '../BlisUserState';
import { BlisClient } from '../BlisClient';
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
        let text = `${this.text}`;
        for (let entityId of this.entityIds)
        {
            let entityName = await Entity.toText(client, appId, entityId)
            let entityValue = this.EntityValue(entityId);
            text += ` [${entityName} ${entityValue}]`;
        }
        return text;
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
        let text = `${inputText}\n\n     ${actionText}`;
        return text;
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
        return `**${this.id}**\n\n${dialogText}`;
    }

    public constructor(init?:Partial<TrainDialog>)
    {
        this.id = undefined;
        this.dialog = undefined;
        (<any>Object).assign(this, init);
    }
}
    
