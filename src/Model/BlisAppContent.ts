import * as builder from 'botbuilder';
import { deserialize, serialize } from 'json-typescript-mapper';
import { BlisDebug} from '../BlisDebug';
import { BlisClient_v1 } from '../BlisClient';
import { TakeTurnModes, EntityTypes, TeachStep, ActionTypes_v1, APICalls, ActionCommand } from '../Model/Consts';
import { BlisMemory } from '../BlisMemory';
import { Action_v1 } from './Action';
import { Utils } from '../Utils';import { JsonProperty } from 'json-typescript-mapper';
import { Entity_v1 } from './Entity';
import { Menu } from '../Menu';
import { TrainDialog_v1 } from './TrainDialog';
import { BlisContext } from '../BlisContext';
import { EditableResponse } from './EditableResponse';


export class BlisAppContent
{
    @JsonProperty({clazz: Action_v1, name: 'actions'})
    public actions : Action_v1[];

    @JsonProperty({clazz: Entity_v1, name: 'entities'})
    public entities : Entity_v1[];

    @JsonProperty({clazz: TrainDialog_v1, name: 'traindialogs'})
    public trainDialogs : TrainDialog_v1[];

    @JsonProperty('blis-app-version')
    public appVersion : string;

    public constructor(init?:Partial<BlisAppContent>)
    {
        this.actions = undefined;
        this.entities = undefined;
        this.trainDialogs = undefined;
        this.appVersion = undefined;
        (<any>Object).assign(this, init);
    }

    public async FindTrainDialogs(appId : string, searchTerm : string) : Promise<{'dialogId': string, 'text': string}[]>
    {
        let dialogs = [];
        searchTerm = searchTerm.toLowerCase();
        for (let trainDialog of this.trainDialogs)
        {
            let dialog = await trainDialog.toText(appId);
            if (!searchTerm || dialog.toLowerCase().indexOf(searchTerm) > 0)
            {
                dialogs.push({'dialogId' : trainDialog.id, 'text' : dialog});
            }
        }
        return dialogs;
    }

    public static async Export(context : BlisContext, cb : (responses: (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]) => void) : Promise<void>
    {
        BlisDebug.Log(`Exporting App`);

        try
        {        
            let memory = context.Memory();
            let appId = await memory.BotState().AppId();

            // Get actions
            let dialogIds = [];
            let BlisAppContent = await BlisClient_v1.client.ExportApp(appId)
            let msg = JSON.stringify(serialize(BlisAppContent));
            if (context.Address().channelId == "emulator")
            {
                cb([msg]);
            }
            else
            {
                Utils.SendAsAttachment(context, msg);
                cb([""]);
            }
        }
        catch (error) {
            let errMsg = BlisDebug.Error(error);      
            cb([errMsg]);
        }
    }


    /** Import (and merge) application with given appId */
    public static async Import(context : BlisContext, appId : string, cb : (responses: (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]) => void) : Promise<void>
    {
        try
        {
            let memory = context.Memory();
            let curAppId = await memory.BotState().AppId();

            // Get current app
            let currentApp = await BlisClient_v1.client.ExportApp(curAppId);

            // Get imported app
            let mergeApp = await BlisClient_v1.client.ExportApp(appId);

            // Merge any duplicate entities
            mergeApp = this.MergeEntities(currentApp, mergeApp);

            // Merge any duplicate actions
            mergeApp = this.MergeActions(currentApp, mergeApp);

            // Upload merged app to currentApp
            let finalApp = await BlisClient_v1.client.ImportApp(curAppId, mergeApp);

            // reload
            let responses = await this.Load(context, curAppId);
            cb(responses);
        }
        catch (error)
        {
            let errMsg = BlisDebug.Error(error); 
            cb([errMsg]);
        }
    }

    /** Import application from sent attachment */  
    public static async ImportAttachment(context : BlisContext, attachment : builder.IAttachment, cb : (text) => void) : Promise<void>
    {
        if (attachment.contentType != "text/plain")
        {
            cb("Expected a text file for import.");
            return;
        }

        try 
        {
            var text = await Utils.ReadFromFile(attachment.contentUrl)

            // Import new training data
            let json = JSON.parse(text);
            let blisApp = deserialize(BlisAppContent, json);
            let memory = context.Memory();
            let appId = await memory.BotState().AppId();
            let newApp = await BlisClient_v1.client.ImportApp(appId, blisApp)
            
            // Reload the app
            let reponses = await BlisAppContent.Load(context, appId);
            cb(reponses);
        }
        catch (error) 
        {
            let errMsg = BlisDebug.Error(error); 
            cb(error);
        }
    }

    public static async Load(context : BlisContext, appId : string) : Promise<(string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]>
    {
        try {
            let memory = context.Memory();

            if (!appId)
            {
                return [Menu.Home(`You must provide the ID of the application to load.`)];
            }

            try
            {            
                // Validate appId, will fail if handed a bad appId
                let app = await BlisClient_v1.client.GetApp_v1(appId)
                await  memory.BotState().SetAppId(app.id);  
                BlisDebug.Log(`Loaded App: ${app.id}`);
            }
            catch (error)
            {
                // Bad App
                await  memory.BotState().SetAppId(null);  
                throw error;
            }

            // Load entities to generate lookup table
            await Entity_v1.Get_v1(context, null, (text) =>
            {
                BlisDebug.Log(`Entity lookup generated`);
            }); 

            // Load actions to generate lookup table
            let numActions = await Action_v1.GetAll_v1(context, null, null, (text) =>
            {
                BlisDebug.Log(`Action lookup generated`);
            }); 

            if (!numActions)
            {
                return [Menu.Home("Application loaded.  No Actions found.")];
            }

            //------------------ Model ------------------------------
            let modelId = null;
            try
            {
                // Load or train a new modelId
                modelId = await BlisClient_v1.client.GetModel(appId);
                if (!modelId)
                {        
                    Utils.SendMessage(context, `Training the model...`);

                    modelId = await BlisClient_v1.client.TrainModel(appId); 
                    await memory.BotState().SetModelId(modelId);

                    BlisDebug.Log(`Model trained: ${modelId}`);
                }
            }
            catch (error)
            {
                // Bad model try retraining from scratch
                let errMsg = Utils.ErrorString(error);
                Utils.SendMessage(context, `${errMsg}\n\n\n\nFailed. Retraining the model from scratch...`);    

                modelId = await BlisClient_v1.client.TrainModel(appId, true);
                await memory.BotState().SetModelId(modelId);

                BlisDebug.Log(`Model trained: ${modelId}`);
            }
            BlisDebug.Log(`Loaded Model: ${modelId}`);
            await memory.BotState().SetModelId(modelId);

            return [Menu.Home("Application loaded.")];
        }
        catch (error)
        {
            let errMsg = BlisDebug.Error(error); 
            return [errMsg];
        }
    }

    /** Swap matched items in swapList */
    private static SwapMatches(ids : string[], swapList : {})
    {
        if (Object.keys(swapList).length == 0)
        {
            return ids;
        }
        let items = [];
        for (let id of ids)
        {
            if (swapList[id])
            {
                items.push(swapList[id]);
            }
            else
            {
                items.push(id);
            }
        }
        return items;
    }

    /** Merge entites */
    private static MergeEntities(app1 : BlisAppContent, app2 : BlisAppContent) : BlisAppContent
    {
        // Find duplicate entities, use originals from app1
        let mergedEntities = [];
        let swapList = {};
        for (let entity2 of app2.entities)
        {
            let swap = false;
            for (let entity1 of app1.entities)
            {
                // If entity name is same, use original entity
                if (entity1.Equal(entity2)) 
                {
                    swapList[entity2.id] = entity1.id;
                    swap = true;
                    break;
                }
            }
            if (!swap) {
                mergedEntities.push(entity2);
            }
        }
        app2.entities = mergedEntities;

        // Make sure all other entity references are correct
        for (let action of app2.actions)
        {
            // Swap entities
            action.negativeEntities = this.SwapMatches(action.negativeEntities, swapList);
            action.requiredEntities = this.SwapMatches(action.requiredEntities, swapList);
        }
        
        // Now swap entities for training dialogs
        for (let trainDialog of app2.trainDialogs)
        {
            for (let turn of trainDialog.dialog.turns)
            {
                turn.input.entityIds = this.SwapMatches(turn.input.entityIds, swapList);
            }       
        }
        return app2;
    }

    /** Merge actions */
    private static MergeActions(app1 : BlisAppContent, app2 : BlisAppContent) : BlisAppContent
    {
        // Find duplicate actions, use originals from app1
        let mergedActions = [];
        let swapList = {};
        for (let action2 of app2.actions)
        {
            let swap = false;
            for (let action1 of app1.actions)
            {
                // If entity name is same, use original entity
                if (action1.Equal_v1(action2)) 
                {
                    swapList[action2.id] = action1.id;
                    swap = true;
                    break;
                }
            }
            if (!swap) {
                mergedActions.push(action2);
            }
        }
        app2.actions = mergedActions;

        // Now swap actions in training dialogs
        for (let trainDialog of app2.trainDialogs)
        {
            for (let turn of trainDialog.dialog.turns)
            {
                let swapAction = swapList[turn.actionId];
                if (swapAction)
                {
                    turn.actionId = swapAction;
                }
                turn.input.maskedActionIds = this.SwapMatches(turn.input.maskedActionIds, swapList);
            }       
        }
        return app2;
    }
}