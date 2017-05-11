import * as builder from 'botbuilder';
import { JsonProperty } from 'json-typescript-mapper';
import { BlisHelp } from '../Model/Help'; 
import { BlisApp } from '../Model/BlisApp'; 
import { BlisDebug} from '../BlisDebug';
import { BlisClient } from '../BlisClient';
import { TakeTurnModes, EntityTypes, UserStates, TeachStep, ActionTypes, SaveStep, APICalls, ActionCommand, APITypes } from '../Model/Consts';
import { IntCommands, LineCommands, CueCommands } from './Command';
import { BlisMemory } from '../BlisMemory';
import { Utils } from '../Utils';
import { Menu } from '../Menu';
import { BlisContext } from '../BlisContext';

export class ActionMetaData
{
    /** Is this action an internal api call */
    @JsonProperty('internal')  
    public internal : boolean;

    // APIType
    @JsonProperty('type')  
    public type : string;

    public constructor(init?:Partial<ActionMetaData>)
    {
        this.internal = undefined;
        this.type = undefined;
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
    public waitAction : boolean;

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

    // When true RNN will pause for input
    // Defaults: text action = true / api action = false
    @JsonProperty('sequence_terminal')
    public waitAction : string[];

    @JsonProperty({clazz: ActionMetaData, name: 'metadata'})
    public metadata : ActionMetaData;

    public constructor(init?:Partial<Action>)
    {
        this.id = undefined;
        this.actionType = undefined;
        this.content = undefined;
        this.negativeEntities = undefined;
        this.requiredEntities = undefined;
        this.waitAction = undefined;
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

    /** Convert into display type */
    public DisplayType() : string
    {
        // INTENTs are APIs internally but shown as TEXT responses in UI
        if (this.actionType == ActionTypes.API)
        {
            return (this.metadata.type != APITypes.INTENT) ? ActionTypes.API : ActionTypes.TEXT;
        }
        else
        {
            return ActionTypes.TEXT;
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
    
    public static async toText(client : BlisClient, appId : string, actionId : string) : Promise<string>
    {
        try
        {            
            let action = await client.GetAction(appId, actionId);
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
        let appContent = await context.client.ExportApp(context.State(UserStates.APP));

        // Clear actions
        appContent.actions = null;
        
        // Fast search by converting to string and looking for ID
        let appString = JSON.stringify(appContent);

        // Negative also can't be in use
        return (appString.indexOf(this.id) > -1);
    }

    private static Buttons(id : string, actionType : string) : {}
    {
        let editCommand = (actionType == ActionTypes.API) ? CueCommands.EDITAPICALL : CueCommands.EDITRESPONSE;
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
        let memory = context.Memory();
        let commandWords = Action.Split(commandString);
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

        let memory = context.Memory();
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
        let memory = context.Memory();

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

    public static async Add(context : BlisContext, actionId : string, actionType : string,  apiType : string, 
        content : string, cb : (responses : (string | builder.IIsAttachment | builder.SuggestedActions)[], actionId : string) => void) : Promise<void>
    {
        BlisDebug.Log(`AddAction`);

        if (!BlisApp.HaveApp(context, cb))
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
            if (actionType == ActionTypes.API)
            {
                if (apiType == APITypes.AZURE)   
                { 
                    content = `${APICalls.AZUREFUNCTION} ${content}`;
                }
                else if (apiType == APITypes.INTENT)
                {
                    content = `${APICalls.FIREINTENT} ${content}`;
                }
                // TODO : user should be able to specify on command line
                if (!apiType)
                {
                    apiType == APITypes.LOCAL;
                }
            }

            let actionSet = new ActionSet(actionType);

            // Non INTENT API actions default to not-wait, TEXT actions to wait for user input
            actionSet.waitAction = (actionType == ActionTypes.API && apiType != APITypes.INTENT) ? false : true;

            // Extract response and commands
            let [action, commands] = content.split('//');
 
            let error = this.ProcessCommandString(context, actionSet, commands);
            if (error)
            {
               cb(Menu.AddEditCards(context, [error]), null);
               return;
            }

            error = this.ProcessResponse(context, actionSet, action);
            if (error)
            {
               cb(Menu.AddEditCards(context, [error]), null);
               return;
            }

            let changeType = (actionType == ActionTypes.TEXT) ? "Response" : "Api Call";
            if (actionId) 
            {
                actionId = await context.client.EditAction(context.State(UserStates.APP), actionId, action, actionType, actionSet.waitAction, actionSet.posIds, actionSet.negIds);
                changeType = changeType + ` Edited`;
            }
            else 
            {
                let metadata = new ActionMetaData({type : apiType});
                actionId = await context.client.AddAction(context.State(UserStates.APP), action, actionType, actionSet.waitAction, actionSet.posIds, actionSet.negIds, null, metadata);
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
            let card = Utils.MakeHero(`${changeType}`,`${type}${substr}`, action, Action.Buttons(actionId, actionType));
            cb(Menu.AddEditCards(context,[card]), actionId);
        }
        catch (error)
        {
            let errMsg = BlisDebug.Error(error); 
            cb([errMsg], null);
        }
    }

    /** Delete Action with the given actionId */
    public static async Delete(context : BlisContext, actionId : string, cb : (responses : (string | builder.IIsAttachment | builder.SuggestedActions)[]) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Action`);

        if (!actionId)
        {
            cb(Menu.AddEditCards(context,[`You must provide the ID of the action to delete.`]));
            return;
        }

        try
        {    
            let action = await context.client.GetAction(context.State(UserStates.APP), actionId);  
            let inUse = await action.InUse(context);

            if (inUse)
            {
                let card = Utils.MakeHero("Delete Failed", action.content, "Action is being used by App", null);
                cb(Menu.AddEditCards(context,[card]));
                return;
            }

            // TODO clear savelookup
            await context.client.DeleteAction(context.State(UserStates.APP), actionId)
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
    public static async GetAll(context : BlisContext, actionType : string, search : string,
            cb : (responses : (string | builder.IIsAttachment | builder.SuggestedActions)[]) => void) : Promise<number>
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
            let json = await context.client.GetActions(context.State(UserStates.APP))
            actionIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${actionIds.length} actions`);

            if (actionIds.length == 0)
            {
                responses.push(`This application contains no ${(actionType == ActionTypes.API) ? "API Calls" : "Responses"}`);
                cb(Menu.AddEditCards(context,responses)); 
                return;
            }

            let textactions = "";
            let apiactions = "";
            let actions : Action[] = [];
            let memory = context.Memory();
            if (search) search = search.toLowerCase();

            for (let actionId of actionIds)
            {
                let action = await context.client.GetAction(context.State(UserStates.APP), actionId)

                // Don't display internal APIs (unless in debug)
                if (debug || !action.metadata || !action.metadata.internal)
                {
                    if ((!search || action.content.toLowerCase().indexOf(search) > -1) && (!actionType || action.DisplayType() == actionType))
                    { 
                        actions.push(action);
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
                    
                    // Don't show AZURE or INTENT command string
                    if (action.metadata)
                    {
                        if (action.metadata.type == APITypes.INTENT || action.metadata.type == APITypes.AZURE)
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
                        let type = (action.metadata && action.metadata.type) ? `(${action.metadata.type}) ` : "";
                        let subtext = `${type}${postext}${negtext}${wait}`
                        responses.push(Utils.MakeHero(null, subtext, atext, Action.Buttons(action.id, action.actionType)));
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