import * as builder from 'botbuilder';
import { JsonProperty } from 'json-typescript-mapper';
import { BlisHelp, Help } from '../Model/Help'; 
import { BlisApp } from '../Model/BlisApp'; 
import { BlisUserState} from '../BlisUserState';
import { BlisDebug} from '../BlisDebug';
import { BlisClient } from '../BlisClient';
import { TakeTurnModes, EntityTypes, UserStates, TeachStep, ActionTypes, SaveStep, APICalls, ActionCommand } from '../Model/Consts';
import { IntCommands, LineCommands } from '../CommandHandler';
import { BlisMemory } from '../BlisMemory';
import { Utils } from '../Utils';
import { Menu } from '../Menu';
import { BlisContext } from '../BlisContext';

export class ActionMetaData
{
    /** Is this action an internal api call */
    @JsonProperty('internal')  
    public internal : boolean;

    public constructor(init?:Partial<ActionMetaData>)
    {
        this.internal = undefined;
        (<any>Object).assign(this, init);
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

    constructor(public actionType : string)
    {}
}

export class Action
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

    @JsonProperty({clazz: ActionMetaData, name: 'metadata'})
    public metadata : ActionMetaData;

    public constructor(init?:Partial<Action>)
    {
        this.id = undefined;
        this.actionType = undefined;
        this.content = undefined;
        this.negativeEntities = undefined;
        this.requiredEntities = undefined;
        this.metadata = new ActionMetaData();
        (<any>Object).assign(this, init);
    }

    public Equal(action : Action) : boolean
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

    public static GetEntitySuggestion(action : string) : string
    {
        if (!action) return null;

        let words = this.Split(action);
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
    
    public static async toText(client : BlisClient, appId : string, actionId : string) : Promise<string>
    {
        try
        {            
            let action = await client.GetAction(appId, actionId);
            return action.content;
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

    public static Sort(actions : Action[]) : Action[]
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
    private async InUse(context : BlisContext) : Promise<boolean>
    {
        let appContent = await context.client.ExportApp(context.state[UserStates.APP]);

        // Clear actions
        appContent.actions = null;
        
        // Fast search by converting to string and looking for ID
        let appString = JSON.stringify(appContent);

        // Negative also can't be in use
        return (appString.indexOf(this.id) > -1);
    }

    private static Buttons(id : string, actionType : string) : {}
    {
        let editCommand = (actionType == ActionTypes.API) ? IntCommands.EDITAPICALL : IntCommands.EDITRESPONSE;
        let buttons = 
        { 
            "Edit" : `${editCommand} ${id}`,
            "Delete" : `${LineCommands.DELETEACTION} ${id}`,
        };
        return buttons;
    }

    private static ProcessCommandString(context: BlisContext, actionSet : ActionSet, commandString : string) : string
    {
        if (!commandString) return;
        
        // Process any command words
        let memory = new BlisMemory(context);
        let commandWords = Action.Split(commandString);
        for (let word of commandWords)
        {
            if (word.startsWith(ActionCommand.BLOCK))
            {
                let negName = word.slice(ActionCommand.BLOCK.length);
                let negID = memory.EntityName2Id(negName);
                if (negID) {
                    actionSet.negIds.push(negID);
                    actionSet.negNames.push(negName);
                }  
                else
                {
                    return `Entity ${negName} not found.`;
                }
            }
            else if (word.startsWith(ActionCommand.REQUIRE)) {
                let posName = word.slice(ActionCommand.REQUIRE.length);
                if (actionSet.posNames.indexOf(posName) < 0)
                {
                    let posID = memory.EntityName2Id(posName);
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
                this.ProcessSuggestion(context, actionSet, word);
            }
        }
    }

    private static ProcessResponse(context: BlisContext, actionSet : ActionSet, responseString : string) : string
    {
        // Ignore bracketed text
        responseString = Action.IgnoreBrackets(responseString);

        let memory = new BlisMemory(context);
        let words = Action.Split(responseString);
        for (let word of words)
        {
            // Add requirement for entity when used for substitution
            if (word.startsWith(ActionCommand.SUBSTITUTE))
            {
                let posName = word.slice(ActionCommand.SUBSTITUTE.length);
                if (actionSet.posNames.indexOf(posName) < 0)
                {
                    let posID = memory.EntityName2Id(posName);
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
                this.ProcessSuggestion(context, actionSet, word);
            }
        }
    }

    private static ProcessSuggestion(context: BlisContext, actionSet : ActionSet, word : string)
    {
        let memory = new BlisMemory(context);

        // Only allow one suggested entity
        if (actionSet.saveName) 
        {
            return `Only one entity suggestion (denoted by "!_ENTITY_") allowed per Action`;
        } 
        if (actionSet.actionType == ActionTypes.API)
        {
            return `Suggested entities can't be added to API Actions`;
        }
        actionSet.saveName = word.slice(ActionCommand.SUGGEST.length);
        actionSet.saveId = memory.EntityName2Id(actionSet.saveName);
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

    public static async Add(context : BlisContext, actionId : string, actionType : string, 
        content : string, cb : (responses : (string | builder.IIsAttachment)[], actionId : string) => void) : Promise<void>
    {
        BlisDebug.Log(`AddAction`);

        if (!BlisApp.HaveApp(context, cb))
        {
            return;
        }

        if (!content)
        {  
            cb(Menu.AddEditApp(context,[`You must provide action text for the action.`]), null);
            return;
        }
        else if (!actionType && !actionId)
        {
            cb(Menu.AddEditApp(context,[`You must provide the actionType.`]), null);
            return;
        }

        try
        {        
            let actionSet = new ActionSet(actionType);

            // Extract response and commands
            let [response, commands] = content.split('//');
 
            let error = this.ProcessCommandString(context, actionSet, commands);
            if (error)
            {
               cb(Menu.AddEditApp(context, [error]), null);
               return;
            }

            error = this.ProcessResponse(context, actionSet, response);
            if (error)
            {
               cb(Menu.AddEditApp(context, [error]), null);
               return;
            }

           
            // If suggested entity exists create API call for saving item
            if (actionSet.saveId) 
            {
                // Make sure it hasn't aleady been added TODO
                let memory = new BlisMemory(context);
                let saveAPI = memory.APILookup(actionSet.saveName);
                if (!saveAPI) {
                    let apiCall = `${APICalls.SAVEENTITY} ${actionSet.saveName}`;
                    let metadata = new ActionMetaData({internal : true});
                    let apiActionId = await context.client.AddAction(context.state[UserStates.APP], apiCall, ActionTypes.API, [], [actionSet.saveId], null, metadata)
                    memory.AddAPILookup(actionSet.saveName, apiActionId);
                }
            }

            let changeType = (actionType == ActionTypes.TEXT) ? "Response" : "Api Call";
            if (actionId) 
            {
                actionId = await context.client.EditAction(context.state[UserStates.APP], actionId, response, actionType, actionSet.posIds, actionSet.negIds);
                changeType = changeType + ` Edited`;
            }
            else 
            {
                actionId = await context.client.AddAction(context.state[UserStates.APP], response, actionType, actionSet.posIds, actionSet.negIds, null, null);
                changeType = changeType + ` Created`;
            }
            let substr = "";
            if (actionSet.posIds.length > 0) 
            {
                substr += `${ActionCommand.REQUIRE}[${actionSet.posNames.toLocaleString()}]\n\n`;
            }
            if (actionSet.negIds.length > 0) 
            {
                substr += `${ActionCommand.BLOCK}[${actionSet.negNames.toLocaleString()}]`;
            } 
            let card = Utils.MakeHero(`${changeType}`, substr + "\n\n", response, Action.Buttons(actionId, actionType));
            cb(Menu.AddEditApp(context,[card]), actionId);
        }
        catch (error)
        {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg], null);
        }
    }

    /** Delete Action with the given actionId */
    public static async Delete(context : BlisContext, actionId : string, cb : (responses : (string | builder.IIsAttachment)[]) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Action`);

        if (!actionId)
        {
            cb(Menu.AddEditApp(context,[`You must provide the ID of the action to delete.`]));
            return;
        }

        try
        {    
            let action = await context.client.GetAction(context.state[UserStates.APP], actionId);  
            let inUse = await action.InUse(context);

            if (inUse)
            {
                let card = Utils.MakeHero("Delete Failed", action.content, "Action is being used by App", null);
                cb(Menu.AddEditApp(context,[card]));
                return;
            }

            // TODO clear savelookup
            await context.client.DeleteAction(context.state[UserStates.APP], actionId)
            let card = Utils.MakeHero(`Deleted Action`, null, action.content, null);
            cb(Menu.AddEditApp(context,[card]));
        }
        catch (error)
        {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
    }

    /** Get actions.  Return count of actions */
    public static async GetAll(context : BlisContext, actionType : string, search : string,
            cb : (responses : (string | builder.IIsAttachment)[]) => void) : Promise<number>
    {
        BlisDebug.Log(`Getting actions`);

        try
        {   
            if (!BlisApp.HaveApp(context, cb))
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
            let json = await context.client.GetActions(context.state[UserStates.APP])
            actionIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${actionIds.length} actions`);

            if (actionIds.length == 0)
            {
                responses.push(`This application contains no ${(actionType == ActionTypes.API) ? "API Calls" : "Responses"}`);
                cb(Menu.AddEditApp(context,responses)); 
                return;
            }

            let textactions = "";
            let apiactions = "";
            let actions : Action[] = [];
            let memory = new BlisMemory(context);
            if (search) search = search.toLowerCase();

            for (let actionId of actionIds)
            {
                let action = await context.client.GetAction(context.state[UserStates.APP], actionId)

                // Don't display internal APIs (unless in debug)
                if (debug || !action.metadata || !action.metadata.internal)
                {
                    if ((!search || action.content.toLowerCase().indexOf(search) > -1) && (!actionType || action.actionType == actionType))
                    { 
                        actions.push(action);

                        // Create lookup for saveEntity actions
                        if (action.actionType == ActionTypes.API && action.content.startsWith(APICalls.SAVEENTITY))
                        {        
                            let name = Action.Split(action.content)[1];
                            memory.AddAPILookup(name, actionId);
                        }

                        BlisDebug.Log(`Action lookup: ${action.content} : ${action.actionType}`);
                    }
                }
            }

            // Sort
            actions = Action.Sort(actions);

            // Generate output
            for (let action of actions)
            {
                    let posstring = memory.EntityIds2Names(action.requiredEntities);
                    let negstring = memory.EntityIds2Names(action.negativeEntities);
                    let atext = `${action.content}`;
                    
                    let postext = (posstring.length > 0) ? `  ${ActionCommand.REQUIRE}[${posstring}]`: "";
                    let negtext = (negstring.length > 0) ? `  ${ActionCommand.BLOCK}[${negstring}]` : "";

                    if (debug)
                    {
                        let line = atext + postext + negtext + action.id + "\n\n";
                        if (action.actionType == ActionTypes.API)
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
                        let typeDesc = (action.actionType == ActionTypes.API) ? "API Call" : "Response";
                        responses.push(Utils.MakeHero(atext, `${typeDesc} ` + postext+negtext, null, Action.Buttons(action.id, action.actionType)));
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
            cb(responses);
            return actionIds.length;
        }
        catch (error) {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
    }
}