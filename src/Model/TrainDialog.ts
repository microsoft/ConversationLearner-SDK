import * as builder from 'botbuilder';
import { JsonProperty } from 'json-typescript-mapper';
import { BlisHelp } from '../Model/Help'; 
import { BlisDebug} from '../BlisDebug';
import { BlisClient_v1 } from '../BlisClient';
import { TakeTurnModes, EntityTypes, TeachStep, ActionTypes_v1, APICalls, ActionCommand } from '../Model/Consts';
import { IntCommands, LineCommands, CueCommands, HelpCommands } from './Command';
import { BlisMemory } from '../BlisMemory';
import { Utils } from '../Utils';
import { Action_v1 } from './Action';
import { Entity_v1 } from './Entity';
import { Menu } from '../Menu';
import { Pager } from '../Memory/Pager';
import { BlisContext } from '../BlisContext';
import { EditableResponse } from './EditableResponse';

export class LabeledEntity
{
    @JsonProperty('startCharIndex')
    public startCharIndex : number;

    @JsonProperty('endCharIndex')
    public endCharIndex : number;

    @JsonProperty('entityId')
    public entityId : string;

    @JsonProperty('entityText')
    public entityText : string;

    public constructor(init?:Partial<LabeledEntity>)
    {
        this.startCharIndex = undefined;
        this.endCharIndex = undefined;
        this.entityId = undefined;
        this.entityText = undefined;
        (<any>Object).assign(this, init);
    }
}

export class TextVariation
{
    @JsonProperty('text')
    public text : String;

   @JsonProperty({clazz: LabeledEntity, name: 'labelEntities'})
    public labelEntities : LabeledEntity[];

    public constructor(init?:Partial<TextVariation>)
    {
        this.text = undefined;
        this.labelEntities = undefined;
        (<any>Object).assign(this, init);
    }
}

export class ExtractorStep
{
    @JsonProperty({clazz: TextVariation, name: 'textVariations'})
    public textVariations : TextVariation[];

    public constructor(init?:Partial<ExtractorStep>)
    {
        this.textVariations = undefined;
        (<any>Object).assign(this, init);
    }
}

export class Input
{
    @JsonProperty('filledEntities')
    public filledEntities : string[];

    @JsonProperty('context')
    public context : string;

    @JsonProperty('maskedActions')
    public maskedActions : string[];

    public constructor(init?:Partial<ScorerStep>)
    {
        this.filledEntities = undefined;
        this.context = undefined;
        this.maskedActions = undefined;
        (<any>Object).assign(this, init);
    }
}

export class ScorerStep
{
    @JsonProperty({clazz: Input, name: 'input'})
    public input : Input;

    @JsonProperty('labelAction')
    public labelAction : string;

    public constructor(init?:Partial<ScorerStep>)
    {
        this.input = undefined;
        this.labelAction = undefined;
        (<any>Object).assign(this, init);
    }
}

export class Round
{
    @JsonProperty({clazz: ExtractorStep, name: 'extractorStep'})
    public extractorStep : ExtractorStep;

    @JsonProperty({clazz: ScorerStep, name: 'scorerSteps'})
    public scorerSteps : ScorerStep[];

    public constructor(init?:Partial<Round>)
    {
        this.extractorStep = undefined;
        this.scorerSteps = undefined;
        (<any>Object).assign(this, init);
    }
}

export class TrainDialog
{
    @JsonProperty('trainDialogId')
    public trainDialogId : string;

    @JsonProperty('version')
    public version : number;

    @JsonProperty('packageCreationId')
    public packageCreationId : number;

    @JsonProperty('packageDeletionId')
    public packageDeletionId : number;

    @JsonProperty({clazz: Round, name: 'rounds'})
    public rounds : Round[];

    public constructor(init?:Partial<TrainDialog>)
    {
        this.trainDialogId = undefined;
        this.version = undefined;
        this.packageCreationId = undefined;
        this.packageDeletionId = undefined;
        this.rounds = undefined;
        (<any>Object).assign(this, init);
    }
}

// ================== V1 ===============================================
export class TextEntity_v1
{
    @JsonProperty('EndToken')  
    public endToken : number;

    @JsonProperty('EntityType')  
    public entityId : string;

    @JsonProperty('StartToken')  
    public startToken : number;

    public constructor(init?:Partial<Input_v1>)
    {
        this.endToken = undefined;
        this.entityId = undefined;
        this.startToken = undefined;
        (<any>Object).assign(this, init);
    }
}

export class AltText_v1
{
    @JsonProperty('text')  
    public text : string;
        
    @JsonProperty({clazz: TextEntity_v1, name: 'text-entities'})
    public textEntities : TextEntity_v1[];

    public constructor(init?:Partial<Input_v1>)
    {
        this.text = undefined;
        this.textEntities = undefined;
        (<any>Object).assign(this, init);
    }
}

export class Input_v1
{
    @JsonProperty('context')  
    public context : {};

    @JsonProperty('entities')
    public entityIds : string[];

    @JsonProperty('masked-actions')
    public maskedActionIds : string[];

    @JsonProperty('text')  
    public text : string;

    @JsonProperty({clazz: AltText_v1, name: 'text-alts'})
    public textAlts : AltText_v1[];

    @JsonProperty({clazz: TextEntity_v1, name: 'text-entities'})
    public textEntities : TextEntity_v1[];

    public async toText(appId : string) : Promise<string>
    {
        // TODO = add masked-actions and context
        if (this.text)
        {
            let text = `${this.text}`;
            for (let entityId of this.entityIds)
            {
                let entityName = await Entity_v1.toText(appId, entityId)
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

    public constructor(init?:Partial<Input_v1>)
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

export class Turn_v1
{
    @JsonProperty({clazz: Input_v1, name: 'input'})  
    public input : Input_v1;

    @JsonProperty('output')  
    public actionId : string;
    
    public async toText(appId : string) : Promise<string>
    {
        let inputText = await this.input.toText(appId);
        let actionText = await Action_v1.toText(appId, this.actionId);
        if (inputText)
        {
            return `${inputText}\n\n     ${actionText}`;
        }
        return `     ${actionText}`
    }

    public constructor(init?:Partial<Turn_v1>) 
    {
        this.input = undefined;
        this.actionId = undefined;
        (<any>Object).assign(this, init);
    }
}

export class Dialog_v1
{
    @JsonProperty({clazz: Turn_v1, name: 'turns'})
    public turns : Turn_v1[];
    
    public async toText(appId : string) : Promise<string>
    {
        let text = "";
        for (let i in this.turns)
        {
            let turn = this.turns[i];
            let turnText = await turn.toText(appId);
            let index = `(${(+i+1)}) `;
            text += `${index}${turnText}\n\n`;
        }
        return text;
    }

    public constructor(init?:Partial<Dialog_v1>)
    {
        this.turns = undefined;
        (<any>Object).assign(this, init);
    }
}

export class TrainDialog_v1
{
    @JsonProperty('id')
    public id : string;

    @JsonProperty({clazz: Dialog_v1, name: 'dialog'})
    public dialog : Dialog_v1;

    public async toText(appId : string, number = false) : Promise<string>
    {
        let dialogText = await this.dialog.toText(appId);
        return `${dialogText}`;
    }

    public constructor(init?:Partial<TrainDialog_v1>)
    {
        this.id = undefined;
        this.dialog = undefined;
        (<any>Object).assign(this, init);
    }

    public static async Edit(context : BlisContext, args : any, cb : (responses: (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]) => void) : Promise<void>
    {
        // Extract args
        let [dialogId, turnNum] = args.split(" ");
        let input = Utils.RemoveWords(args, 2);
        turnNum = +turnNum-1;  // 0-based array

        let memory = context.Memory() 
        let appId = await memory.BotState().AppId()

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
            let trainDialog = await BlisClient_v1.client.GetTrainDialog(appId, dialogId);

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
                let nextText = new AltText_v1({text: input});
                altTexts.push(nextText);
                trainDialog.dialog.turns[turnNum].input.textAlts = altTexts;
        
                // Save
                await BlisClient_v1.client.EditTrainDialog(appId, dialogId, trainDialog);

                // Show item with new content
                TrainDialog_v1.Get(context, true, (responses) => {
                    cb(responses);
                });
            }
        }
        if (error)
        {
            let cards = [];
            cards.push(Utils.ErrorCard(error, "Expected input format {turn number} {new input text}"));
            TrainDialog_v1.Get(context, true, (responses) => {
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
            let memory = context.Memory() 
            let appId = await memory.BotState().AppId()

            await BlisClient_v1.client.DeleteTrainDialog(appId, dialogId)
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
            let memory = context.Memory() 
            let appId = await memory.BotState().AppId()

            if (refreshCache)
            {
                BlisClient_v1.client.ClearExportCache(appId)
            }
            let blisApp = await BlisClient_v1.client.ExportApp(appId);
            let dialogs = await blisApp.FindTrainDialogs(appId, await Pager.SearchTerm(context));

            if (dialogs.length == 0)
            {
                cb(Menu.AddEditCards(context,["No dialogs found."]));
                return;
            }
            
            await Pager.SetLength(context, dialogs.length);
            let index = await Pager.Index(context);
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
    
