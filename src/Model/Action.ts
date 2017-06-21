import * as builder from 'botbuilder';
import { JsonProperty } from 'json-typescript-mapper';
import { BlisHelp } from '../Model/Help'; 
import { BlisApp_v1 } from '../Model/BlisApp'; 
import { AdminResponse } from '../Model/AdminResponse'; 
import { BlisDebug} from '../BlisDebug';
import { BlisClient } from '../BlisClient';
import { TakeTurnModes, EntityTypes, TeachStep, ActionTypes, ActionTypes_v1, APICalls, ActionCommand, APITypes_v1 } from '../Model/Consts';
import { IntCommands, LineCommands, CueCommands } from './Command';
import { BlisMemory } from '../BlisMemory';
import { Utils } from '../Utils';
import { Menu } from '../Menu';
import { BlisContext } from '../BlisContext';
import { EditableResponse } from './EditableResponse';

export class ActionMetaData
{
    // APIType
    @JsonProperty('actionType')  
    public actionType : string;

    public constructor(init?:Partial<ActionMetaData>)
    {
        this.actionType = undefined;
        (<any>Object).assign(this, init);
    }

    public Equal(metaData : ActionMetaData) : boolean
    {
        if (this.actionType != metaData.actionType) return false;
        return true;
    }
}

export class ActionMetaData_v1
{
    // APIType
    @JsonProperty('type')  
    public type : string;

    @JsonProperty('version')  
    public version : number;

    @JsonProperty('packageCreationId')  
    public packageCreationId : number;

    @JsonProperty('packageDeletionId')  
    public packageDeletionId : number;

    public constructor(init?:Partial<ActionMetaData_v1>)
    {
        this.type = undefined;
        this.version = undefined;
        this.packageCreationId = undefined;
        this.packageDeletionId = undefined;
        (<any>Object).assign(this, init);
    }

    public Equal(metaData : ActionMetaData_v1) : boolean
    {
        if (this.type != metaData.type) return false;
        return true;
    }
}

class ActionSet
{
    public negIds : string[] = [];
    public posIds : string[] = [];
    public negNames : string[] = [];
    public posNames : string[] = [];
    public saveId : string;
    public saveName : string;
    public waitAction : boolean;

    constructor(public actionType : string)
    {}
}


export class Action
{
    @JsonProperty('actionId')
    public actionId : string;

    @JsonProperty('payload')
    public payload : string;

    @JsonProperty('isTerminal')
    public isTerminal : boolean;

    @JsonProperty('requiredEntities')
    public requiredEntities : string[];

    @JsonProperty('negativeEntities')
    public negativeEntities : string[];

    @JsonProperty('version')
    public version : number;

    @JsonProperty('packageCreationId')
    public packageCreationId : number;

    @JsonProperty('packageDeletionId')
    public packageDeletionId : number;

    @JsonProperty({clazz: ActionMetaData, name: 'metadata'})
    public metadata : ActionMetaData;

    public constructor(init?:Partial<Action>)
    {
        this.actionId = undefined;
        this.payload = undefined;
        this.isTerminal = undefined;
        this.requiredEntities = undefined;
        this.negativeEntities = undefined;
        this.version = undefined;
        this.packageCreationId = undefined;
        this.packageDeletionId = undefined;
        this.metadata = new ActionMetaData();
        (<any>Object).assign(this, init);
    } 

    /** Returns true if content of action is equal */
    /** ID, version and package do not matter      */
    public Equal(action : Action) : boolean
    {
        if (this.payload != action.payload) return false;
        if (this.isTerminal != action.isTerminal) return false;
        if (this.negativeEntities.length != action.negativeEntities.length) return false;
        if (this.requiredEntities.length != action.requiredEntities.length) return false;
        for (var negEntity of this.negativeEntities)
        {
            if (action.negativeEntities.indexOf(negEntity) < 0) return false;
        }
        for (var reqEntity of this.requiredEntities)
        {
            if (action.requiredEntities.indexOf(reqEntity) < 0) return false;
        }
        return this.metadata.Equal(action.metadata);
    }

    public static async Add(appId : string, action : Action) : Promise<AdminResponse>
    {
        let actionId = await BlisClient.client.AddAction(appId, action); 
        return AdminResponse.Result(actionId);
    }

    public static async Edit(appId : string, action : Action) : Promise<AdminResponse>
    {
        let actionId = await BlisClient.client.EditAction(appId, action); 
        return AdminResponse.Result(actionId);
    }

    /** Delete Action with the given actionId */
    public static async Delete(appId : string, actionId : string) : Promise<AdminResponse>
    {
        BlisDebug.Log(`Trying to Delete Action`);

        try
        {    
            if (!actionId)
            {
                return AdminResponse.Error(`You must provide the ID of the action to delete.`);
            }

            let action = await BlisClient.client.GetAction(appId, actionId);  
            let inUse = await action.InUse(appId);

            if (inUse)
            {
                let msg = `Delete Failed ${action.payload} is being used by App`;
                return AdminResponse.Error(msg);
            }

            // TODO clear savelookup
            await BlisClient.client.DeleteAction(appId, actionId)
        }
        catch (error)
        {
            let errMsg = BlisDebug.Error(error); 
            return AdminResponse.Error(errMsg);
        }
    }

    /** Get actions. */
    public static async GetAll(key : string, actionType : string, search : string) : Promise<AdminResponse>
    {
        BlisDebug.Log(`Getting actions`);

        try
        {  
            let memory = BlisMemory.GetMemory(key);
            let appId = await memory.BotState().AppId();

            if (!appId)
            {
                return AdminResponse.Error("No app in memory");
            }

            let debug = false;
            if (search && search.indexOf(ActionCommand.DEBUG) > -1)
            {
                debug = true;
                search = search.replace(ActionCommand.DEBUG, "");
            }

            // Get actions
            let actionIds = [];
            let json = await BlisClient.client.GetActions(appId)
            actionIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${actionIds.length} actions`);

            if (actionIds.length == 0)
            {
                return AdminResponse.Result([]);
            }

            let textactions = "";
            let apiactions = "";
            let actions : Action[] = [];

            if (search) search = search.toLowerCase();

            for (let actionId of actionIds)
            {
                let action = await BlisClient.client.GetAction(appId, actionId)

                if ((!search || action.payload.toLowerCase().indexOf(search) > -1) && (!actionType || action.metadata.actionType == actionType))
                { 
                    actions.push(action);
                    BlisDebug.Log(`Action lookup: ${action.payload} : ${action.metadata.actionType}`);
                }
            }

            // Sort
            actions = Action.Sort(actions);

            return AdminResponse.Result(actions);
        }
        catch (error) {
            let errMsg = BlisDebug.Error(error); 
            return AdminResponse.Error(errMsg);
        }
    }

    public static Sort(actions : Action[]) : Action[]
    {
        return actions.sort((n1, n2) => {
            let c1 = n1.payload.toLowerCase();
            let c2 = n2.payload.toLowerCase();
            if (c1 > c2) {
                return 1;
            }
            if (c1 < c2){
                return -1;
            }
            return 0;
        });
    }

    /** Is the Activity used anywhere */
    private async InUse(appId : string) : Promise<boolean>
    {
        let appContent = await BlisClient.client.ExportApp(appId);

        // Clear actions
        appContent.actions = null;
        
        // Fast search by converting to string and looking for ID
        let appString = JSON.stringify(appContent);

        // Negative also can't be in use
        return (appString.indexOf(this.actionId) > -1);
    }
}

export class Action_v1
{ 
    @JsonProperty('id')
    public id : string;

    @JsonProperty('action_type')
    public actionType : string;

    @JsonProperty('content')
    public content : string;

    @JsonProperty('NegativeEntities')
    public negativeEntities : string[];
    
    @JsonProperty('RequiredEntities')
    public requiredEntities : string[];

    // When true RNN will pause for input
    // Defaults: text action = true / api action = false
    @JsonProperty('sequence_terminal')
    public waitAction : boolean;

    @JsonProperty({clazz: ActionMetaData_v1, name: 'metadata'})
    public metadata : ActionMetaData_v1;

    public constructor(init?:Partial<Action_v1>)
    {
        this.id = undefined;
        this.actionType = undefined;
        this.content = undefined;
        this.negativeEntities = undefined;
        this.requiredEntities = undefined;
        this.waitAction = undefined;
        this.metadata = new ActionMetaData_v1();
        (<any>Object).assign(this, init);
    }

    public TOV2() : Action
    {
        let metadataV2 = new ActionMetaData();
        if (this.actionType == ActionTypes_v1.API)
        {
            if (this.metadata.type == APITypes_v1.AZURE)
            {
                metadataV2.actionType = ActionTypes.API_AZURE;
            }
            else if (this.metadata.type == APITypes_v1.INTENT)
            {
                metadataV2.actionType = ActionTypes.INTENT;
            }
            else
            {
                metadataV2.actionType = ActionTypes.API_LOCAL;
            }
        } 
        else if (this.actionType == ActionTypes_v1.CARD)
        {
            metadataV2.actionType = ActionTypes.CARD;
        }
        else
        {
            metadataV2.actionType = ActionTypes.INTENT;
        }
        
        return new Action
        ({
            actionId : this.id,
            payload : this.content,
            isTerminal : this.waitAction,
            requiredEntities : this.requiredEntities,
            negativeEntities : this.negativeEntities,
            version : this.metadata.version,
            packageCreationId : this.metadata.packageCreationId,
            packageDeletionId : this.metadata.packageDeletionId,
            metadata : metadataV2
        });
    }

    static TOV1(action : Action) : Action_v1
    {
        let metadataV1 = new ActionMetaData_v1();
        let actionType = undefined;
        switch (action.metadata.actionType)
        {
            case (ActionTypes.API_AZURE):
                actionType = ActionTypes_v1.API;
                metadataV1.type = APITypes_v1.AZURE;
                break;
            case (ActionTypes.API_LOCAL):
                actionType = ActionTypes_v1.API;
                metadataV1.type = APITypes_v1.LOCAL;
                break;
            case (ActionTypes.CARD):
                actionType = ActionTypes_v1.CARD;
                metadataV1.type = undefined;
                break;
            case (ActionTypes.INTENT):
                actionType = ActionTypes_v1.API;
                metadataV1.type = APITypes_v1.INTENT;
                break;
            case (ActionTypes.TEXT):
                actionType = ActionTypes_v1.TEXT;
                metadataV1.type = undefined;
                break;
        }
        metadataV1.version = action.version;
        metadataV1.packageCreationId = action.packageCreationId;
        metadataV1.packageDeletionId = action.packageDeletionId;
       
        return new Action_v1
        ({
            id : action.actionId,
            actionType : actionType,
            content : action.payload,
            negativeEntities : action.negativeEntities,
            requiredEntities : action.requiredEntities,
            waitAction : action.isTerminal,
            metadata : metadataV1
        });
    }

    public Equal_v1(action : Action_v1) : boolean
    {
        if (this.actionType != action.actionType) return false;
        if (this.content != action.content) return false;
        if (this.negativeEntities.length != action.negativeEntities.length) return false;
        if (this.requiredEntities.length != action.requiredEntities.length) return false;
        for (var negEntity of this.negativeEntities)
        {
            if (action.negativeEntities.indexOf(negEntity) < 0) return false;
        }
        for (var reqEntity of this.requiredEntities)
        {
            if (action.requiredEntities.indexOf(reqEntity) < 0) return false;
        }
        return true;
    }

    /** Convert into display type */
    public DisplayType_v1() : string
    {
        // INTENTs are APIs internally but shown as TEXT responses in UI
        if (this.actionType == ActionTypes_v1.API)
        {
            return (this.metadata.type != APITypes_v1.INTENT) ? ActionTypes_v1.API : ActionTypes_v1.TEXT;
        }
        else
        {
            return ActionTypes_v1.TEXT;
        }
    }
    /** Look for entity suggestions in the last action taken */
    // For example: "What is your *name?" suggests user response is likely to be a name
    public static GetEntitySuggestion(actions : string[]) : string
    {
        if (!actions || actions.length == 0) return null;

        // Looks for suggestions in the last action
        let words = this.Split(actions[actions.length-1]);
        for (let word of words) 
        {
            if (word.startsWith(ActionCommand.SUGGEST))
            {
                // Key is in form of $entityName
                let entityName = word.substr(1, word.length-1);
                return entityName;
            }
        }
        return null;
    }
    
    public static async toText(appId : string, actionId : string) : Promise<string>
    {
        try
        {            
            let action = await BlisClient.client.GetAction_v1(appId, actionId);
            let msg = action.content;
            if (action.waitAction) 
            {
                msg += " (WAIT)";
            }
            return msg;
        }
        catch (error)
        {
            BlisDebug.Error(error);
            throw(error);
        }
    }

    public static Split(action : string) : string[] {
        return action.split(/[\[\]\s,:.?!]+/);
    }

    public static Sort_v1(actions : Action_v1[]) : Action_v1[]
    {
        return actions.sort((n1, n2) => {
            let c1 = n1.content.toLowerCase();
            let c2 = n2.content.toLowerCase();
            if (c1 > c2) {
                return 1;
            }
            if (c1 < c2){
                return -1;
            }
            return 0;
        });
    }

    /** Is the Activity used anywhere */
    private async InUse_v1(appId : string) : Promise<boolean>
    {
        let appContent = await BlisClient.client.ExportApp(appId);

        // Clear actions
        appContent.actions = null;
        
        // Fast search by converting to string and looking for ID
        let appString = JSON.stringify(appContent);

        // Negative also can't be in use
        return (appString.indexOf(this.id) > -1);
    }

    private static Buttons(id : string, actionType : string) : {}
    {
        let editCommand = (actionType == ActionTypes_v1.API) ? CueCommands.EDITAPICALL : CueCommands.EDITRESPONSE;
        let buttons = 
        { 
            "Edit" : `${editCommand} ${id}`,
            "Delete" : `${LineCommands.DELETEACTION} ${id}`,
        };
        return buttons;
    }

    private static async ProcessCommandString(context: BlisContext, actionSet : ActionSet, commandString : string) : Promise<string>
    {
        if (!commandString) return;
        
        // Process any command words
        let memory = context.Memory();
        let commandWords = Action_v1.Split(commandString);
        for (let word of commandWords)
        {
            if (word.startsWith(ActionCommand.BLOCK))
            {
                let negName = word.slice(ActionCommand.BLOCK.length);

                // Is terminal action
                if (negName == ActionCommand.TERMINAL)
                {
                    actionSet.waitAction = false;
                }
                else
                {
                    let negID = await memory.EntityLookup().ToId(negName);
                    if (negID) {
                        actionSet.negIds.push(negID);
                        actionSet.negNames.push(negName);
                    }  
                    else
                    {
                        return `Entity ${negName} not found.`;
                    }
                }
            }
            else if (word.startsWith(ActionCommand.REQUIRE)) {
                let posName = word.slice(ActionCommand.REQUIRE.length);

                // Is terminal action
                if (posName == ActionCommand.TERMINAL)
                {
                    actionSet.waitAction = true;
                }
                else if (actionSet.posNames.indexOf(posName) < 0)
                {
                    let posID = await memory.EntityLookup().ToId(posName);
                    if (posID) {
                        actionSet.posIds.push(posID);
                        actionSet.posNames.push(posName);
                    }  
                    else
                    {
                        return `Entity $${posName} not found.`;
                    }
                }
            }
            // Process suggested entities
            else if (word.startsWith(ActionCommand.SUGGEST))
            {
                await this.ProcessSuggestion(context, actionSet, word);
            }
        }
    }

    private static async ProcessResponse(context: BlisContext, actionSet : ActionSet, responseString : string) : Promise<string>
    {
        // Ignore bracketed text
        responseString = Action_v1.IgnoreBrackets(responseString);

        let memory = context.Memory();
        let words = Action_v1.Split(responseString);
        for (let word of words)
        {
            // Add requirement for entity when used for substitution
            if (word.startsWith(ActionCommand.SUBSTITUTE))
            {
                let posName = word.slice(ActionCommand.SUBSTITUTE.length);
                if (actionSet.posNames.indexOf(posName) < 0)
                {
                    let posID = await memory.EntityLookup().ToId(posName);
                    if (posID)
                    {
                        actionSet.posIds.push(posID);
                        actionSet.posNames.push(posName);
                    }
                    else
                    {
                        return `Entity $${posName} not found.`;
                    }
                }
            }
            // Extract suggested entities
            else if (word.startsWith(ActionCommand.SUGGEST))
            {
                await this.ProcessSuggestion(context, actionSet, word);
            }
        }
    }

    private static async ProcessSuggestion(context: BlisContext, actionSet : ActionSet, word : string) : Promise<string>
    {
        let memory = context.Memory();

        // Only allow one suggested entity
        if (actionSet.saveName) 
        {
            return `Only one entity suggestion (denoted by "!_ENTITY_") allowed per Action`;
        } 
        if (actionSet.actionType == ActionTypes_v1.API)
        {
            return `Suggested entities can't be added to API Actions`;
        }
        actionSet.saveName = word.slice(ActionCommand.SUGGEST.length);
        actionSet.saveId = await memory.EntityLookup().ToId(actionSet.saveName);
        if (!actionSet.saveId)
        {
            return `Entity $${actionSet.saveName} not found.`;
        }
        
        // Add to negative entities
        if (actionSet.negNames.indexOf(actionSet.saveName) < 0)
        {
            actionSet.negIds.push(actionSet.saveId);
            actionSet.negNames.push(actionSet.saveName);
        }
    }

    /** Remove all bracketed text from a string */
    private static IgnoreBrackets(text : string) : string 
    {
        let start = text.indexOf('[');
        let end = text.indexOf(']');

        // If no legal contingency found
        if (start < 0 || end < 0 || end < start) 
        {
            return text;
        }
        text = text.substring(0, start) + text.substring(end+1, text.length);
        return this.IgnoreBrackets(text);
    }

    public static async Add_v1(context : BlisContext, actionId : string, actionType : string,  apiType : string, 
        content : string, cb : (responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], actionId : string) => void) : Promise<void>
    {
        BlisDebug.Log(`AddAction`);

        let memory = context.Memory();
        let appId = await memory.BotState().AppId();
        
        if (!BlisApp_v1.HaveApp_v1(appId, context, cb))
        {
            return;
        }

        if (!content)
        {  
            cb(Menu.AddEditCards(context,[`You must provide action text for the action.`]), null);
            return;
        }
        else if (!actionType && !actionId)
        {
            cb(Menu.AddEditCards(context,[`You must provide the actionType.`]), null);
            return;
        }

        try
        {     
            // Handle Azure calls
            if (actionType == ActionTypes_v1.API)
            {
                if (apiType == APITypes_v1.AZURE)   
                { 
                    content = `${APICalls.AZUREFUNCTION} ${content}`;
                }
                else if (apiType == APITypes_v1.INTENT)
                {
                    content = `${APICalls.FIREINTENT} ${content}`;
                }
                // TODO : user should be able to specify on command line
                if (!apiType)
                {
                    apiType == APITypes_v1.LOCAL;
                }
            }

            let actionSet = new ActionSet(actionType);

            // Non INTENT API actions default to not-wait, TEXT actions to wait for user input
            actionSet.waitAction = (actionType == ActionTypes_v1.API && apiType != APITypes_v1.INTENT) ? false : true;

            // Extract response and commands
            let [action, commands] = content.split('//');
 
            let error = await this.ProcessCommandString(context, actionSet, commands);
            if (error)
            {
                cb(Menu.AddEditCards(context, [error]), null);
               return;
            }

            error = await this.ProcessResponse(context, actionSet, action);
            if (error)
            {
            cb(Menu.AddEditCards(context, [error]), null);
               return;
            }

            let changeType = (actionType == ActionTypes_v1.TEXT) ? "Response" : (apiType = APITypes_v1.INTENT) ? "Intent Call" : "API Call"
            if (actionId) 
            {
                let metaData = new ActionMetaData(
                    {
                        actionType : actionType
                    }
                )
                let editAction = new Action({
                    actionId : actionId,
                    payload : action,
                    negativeEntities : actionSet.negIds,
                    requiredEntities : actionSet.posIds,
                    isTerminal : actionSet.waitAction,
                    metadata : metaData
                });

                actionId = await BlisClient.client.EditAction(appId, editAction);
                changeType = changeType + ` Edited`;
            }
            else 
            {
                let metadata = new ActionMetaData({actionType : apiType});

                let newAction = new Action({
                    payload : action,
                    negativeEntities : actionSet.negIds,
                    requiredEntities : actionSet.posIds,
                    isTerminal : actionSet.waitAction,
                    metadata : metadata
                });
                actionId = await BlisClient.client.AddAction(appId, newAction);
                changeType = changeType + ` Created`;
            }
            let substr = actionSet.waitAction ? " (WAIT)" : "";;
            if (actionSet.posIds.length > 0) 
            {
                substr += `${ActionCommand.REQUIRE}[${actionSet.posNames.toLocaleString()}] `;
            }
            if (actionSet.negIds.length > 0) 
            {
                substr += `${ActionCommand.BLOCK}[${actionSet.negNames.toLocaleString()}]`;
            } 
            let type = apiType ? `(${apiType}) ` : "";
            let card = Utils.MakeHero(`${changeType}`,`${type}${substr}`, action, Action_v1.Buttons(actionId, actionType));
            cb(Menu.AddEditCards(context,[card]), actionId);
        }
        catch (error)
        {
            let errMsg = BlisDebug.Error(error); 
            cb([errMsg], null);
        }
    }

    /** Delete Action with the given actionId */
    public static async Delete_v1(context : BlisContext, actionId : string, cb : (responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Action`);
 
        if (!actionId)
        {
            cb(Menu.AddEditCards(context,[`You must provide the ID of the action to delete.`]));
            return;
        }

        try
        {    
            let memory = context.Memory();
            let appId = await memory.BotState().AppId();
       

            let action = await BlisClient.client.GetAction_v1(appId, actionId);  
            let inUse = await action.InUse_v1(appId);

            if (inUse)
            {
                let card = Utils.MakeHero("Delete Failed", action.content, "Action is being used by App", null);
                cb(Menu.AddEditCards(context,[card]));
                return;
            }

            // TODO clear savelookup
            await BlisClient.client.DeleteAction(appId, actionId)
            let card = Utils.MakeHero(`Deleted Action`, null, action.content, null);
            cb(Menu.AddEditCards(context,[card]));
        }
        catch (error)
        {
            let errMsg = BlisDebug.Error(error); 
            cb([errMsg]);
        }
    }

    /** Get actions.  Return count of actions */
    public static async GetAll_v1(context : BlisContext, actionType : string, search : string,
            cb : (responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]) => void) : Promise<number>
    {
        BlisDebug.Log(`Getting actions`);

        try
        {  
            let memory = context.Memory();
            let appId = await memory.BotState().AppId();

            if (!BlisApp_v1.HaveApp_v1(appId, context, cb))
            {
                return;
            }

            let debug = false;
            if (search && search.indexOf(ActionCommand.DEBUG) > -1)
            {
                debug = true;
                search = search.replace(ActionCommand.DEBUG, "");
            }

            // Get actions
            let actionIds = [];
            let responses = [];
            let json = await BlisClient.client.GetActions(appId)
            actionIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${actionIds.length} actions`);

            if (actionIds.length == 0)
            {
                responses.push(`This application contains no ${(actionType == ActionTypes_v1.API) ? "API Calls" : "Responses"}`);
                cb(Menu.AddEditCards(context,responses)); 
                return;
            }

            let textactions = "";
            let apiactions = "";
            let actions : Action_v1[] = [];

            if (search) search = search.toLowerCase();

            for (let actionId of actionIds)
            {
                let action = await BlisClient.client.GetAction_v1(appId, actionId)

                if ((!search || action.content.toLowerCase().indexOf(search) > -1) && (!actionType || action.DisplayType_v1() == actionType))
                { 
                    actions.push(action);
                    BlisDebug.Log(`Action lookup: ${action.content} : ${action.actionType}`);
                }
            }

            // Sort
            actions = Action_v1.Sort_v1(actions);

            // Generate output
            for (let action of actions)
            {
                    let posstring = await memory.EntityLookup().Ids2Names(action.requiredEntities);
                    let negstring = await memory.EntityLookup().Ids2Names(action.negativeEntities);
                    let atext = `${action.content}`;
                    
                    // Don't show AZURE or INTENT command string
                    if (action.metadata)
                    {
                        if (action.metadata.type == APITypes_v1.INTENT || action.metadata.type == APITypes_v1.AZURE)
                        {
                            atext = Utils.RemoveWords(atext, 1);
                        }
                    }

                    let postext = (posstring.length > 0) ? `  ${ActionCommand.REQUIRE}[${posstring}]`: "";
                    let negtext = (negstring.length > 0) ? `  ${ActionCommand.BLOCK}[${negstring}]` : "";
                    let wait = action.waitAction ? " (WAIT)" : "";
                    if (debug)
                    {
                        let line = atext + postext + negtext + wait + action.id + "\n\n";
                        if (action.actionType == ActionTypes_v1.API)
                        {
                            apiactions += line;
                        }
                        else
                        {
                            textactions += line;
                        }
                    }       
                    else
                    {
                        let type = (action.metadata && action.metadata.type) ? `(${action.metadata.type}) ` : "";
                        let subtext = `${type}${postext}${negtext}${wait}`
                        responses.push(Utils.MakeHero(null, subtext, atext, Action_v1.Buttons(action.id, action.actionType)));
                    }
            }
            if (debug)
            {
                let msg = "";
                if (apiactions)
                {   
                    msg += "**API Actions**\n\n" + apiactions;
                }
                if (textactions)
                {   
                    msg += "**TEXT Actions**\n\n" + textactions;
                }
                responses.push(msg);
            }

            if (responses.length == 0)
            {
                responses.push("No Actions match your query.")
            }
            responses.push(null, Menu.Home());
            cb(responses);
            return actionIds.length;
        }
        catch (error) {
            let errMsg = BlisDebug.Error(error); 
            cb([errMsg]);
        }
    }
}