import * as builder from 'botbuilder';
import { JsonProperty } from 'json-typescript-mapper';
import { BlisHelp, Help } from '../Model/Help'; 
import { BlisApp } from '../Model/BlisApp'; 
import { BlisUserState} from '../BlisUserState';
import { BlisDebug} from '../BlisDebug';
import { BlisClient } from '../BlisClient';
import { TakeTurnModes, EntityTypes, UserStates, TeachStep, Commands, IntCommands, ActionTypes, SaveStep, APICalls, ActionCommand } from '../Model/Consts';
import { BlisMemory } from '../BlisMemory';
import { Utils } from '../Utils';
import { Menu } from '../Menu';
import { BlisContext } from '../BlisContext';

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

    public constructor(init?:Partial<Action>)
    {
        this.id = undefined;
        this.actionType = undefined;
        this.content = undefined;
        this.negativeEntities = undefined;
        this.requiredEntities = undefined;
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

    private static Buttons(id : string) : {}
    {
        let buttons = 
        { 
            "Edit" : `${IntCommands.EDITACTION} ${id}`,
            "Delete" : `${Commands.DELETEACTION} ${id}`,
        };
        return buttons;
    }

    public static async Add(context : BlisContext, actionId : string, actionType : string, 
        content : string, cb : (responses : (string | builder.IIsAttachment)[]) => void) : Promise<void>
    {
        BlisDebug.Log(`AddAction`);

        if (!BlisApp.HaveApp(context, cb))
        {
            return;
        }

        let error = null;
        if (!content)
        {  
            error = `You must provide action text for the action.`;
        }
        else if (!actionType && !actionId)
        {
            error = `You must provide the actionType.`;
        }

        var commandHelp = actionType == ActionTypes.API ? Commands.ADDAPICALL : Commands.ADDRESPONSE;
        if (error) 
        {
            let msg = BlisHelp.CommandHelpString(commandHelp, error);
            cb([msg]);
            return;
        }

        // Strip action of any positive and negative entities
        let firstNeg = content.indexOf(ActionCommand.BLOCK);
        let firstPos = content.indexOf(ActionCommand.REQUIRE);
        let cut = 0;
        if (firstNeg > 0 && firstPos > 0)
        {
            cut = Math.min(firstNeg,firstPos);
        }
        else 
        {
            cut = Math.max(firstNeg,firstPos);
        }
        let actionText = (cut > 0) ? content.slice(0,cut-1) : content;

        let memory = new BlisMemory(context);

        try
        {        
            // Extract negative and positive entities
            let negIds = [];
            let posIds = [];
            let negNames = [];
            let posNames = [];
            let saveName = null;
            let saveId = null;

            // Ignore bracketed text
            content = memory.IgnoreBrackets(content);

            let words = Action.Split(content);
            for (let word of words)
            {
                // Add requirement for entity when used for substitution
                if (word.startsWith(ActionCommand.SUBSTITUTE))
                {
                    let posName = word.slice(ActionCommand.SUBSTITUTE.length);
                    if (posNames.indexOf(posName) < 0)
                    {
                        let posID = memory.EntityName2Id(posName);
                        if (posID)
                        {
                            posIds.push(posID);
                            posNames.push(posName);
                        }
                        else
                        {
                            cb([`Entity $${posName} not found.`]);
                            return;
                        }
                    }
                }
                // Extract suggested entities
                else if (word.startsWith(ActionCommand.SUGGEST))
                {
                    // Only allow one suggested entity
                    if (saveName) 
                    {
                        error = BlisHelp.CommandHelpString(commandHelp, `Only one entity suggestion (denoted by "!_ENTITY_") allowed per Action`);
                        cb([error]);
                        return;
                    } 
                    if (actionType == ActionTypes.API)
                    {
                        error = BlisHelp.CommandHelpString(commandHelp, `Suggested entities can't be added to API Actions`);
                        cb([error]);
                        return;
                    }
                    saveName = word.slice(ActionCommand.SUGGEST.length);
                    saveId = memory.EntityName2Id(saveName);
                    if (!saveId)
                    {
                        error = BlisHelp.CommandHelpString(commandHelp, `Entity $${saveName} not found.`);
                        cb([error]);
                        return;
                    }
                    // Add to negative entities
                    if (negNames.indexOf(saveName) < 0)
                    {
                        negIds.push(saveId);
                        negNames.push(saveName);
                    }
                }
                else if (word.startsWith(ActionCommand.BLOCK))
                {
                    let negName = word.slice(ActionCommand.BLOCK.length);
                    let negID = memory.EntityName2Id(negName);
                    if (negID) {
                        negIds.push(negID);
                        negNames.push(negName);
                    }  
                    else
                    {
                        error = BlisHelp.CommandHelpString(commandHelp, `Entity $${negName} not found.`);
                        cb([error]);
                        return;
                    }
                }
                else if (word.startsWith(ActionCommand.REQUIRE)) {
                    let posName = word.slice(ActionCommand.REQUIRE.length);
                    if (posNames.indexOf(posName) < 0)
                    {
                        let posID = memory.EntityName2Id(posName);
                        if (posID) {
                            posIds.push(posID);
                            posNames.push(posName);
                        }  
                        else
                        {
                            error = BlisHelp.CommandHelpString(commandHelp, `Entity $${posName} not found.`);
                            cb([error]);
                            return;
                        }
                    }
                }
            }

            // If suggested entity exists create API call for saving item
            if (saveId) 
            {
                // Make sure it hasn't aleady been added TODO
                let saveAPI = memory.APILookup(saveName);
                if (!saveAPI) {
                    let apiCall = `${APICalls.SAVEENTITY} ${saveName}`;
                    let apiActionId = await context.client.AddAction(context.state[UserStates.APP], apiCall, ActionTypes.API, [], [saveId])
                    memory.AddAPILookup(saveName, apiActionId);
                }
            }

            let changeType = (actionType == ActionTypes.TEXT) ? "Response" : "Api Call";
            if (actionId) 
            {
                actionId = await context.client.EditAction(context.state[UserStates.APP], actionId, actionText, actionType, posIds, negIds);
                changeType = changeType + ` Edited`;
            }
            else 
            {
                actionId = await context.client.AddAction(context.state[UserStates.APP], actionText, actionType, posIds, negIds);
                changeType = changeType + ` Created`;
            }
            let substr = "";
            if (posIds.length > 0) 
            {
                substr += `${ActionCommand.REQUIRE}[${posNames.toLocaleString()}]\n\n`;
            }
            if (negIds.length > 0) 
            {
                substr += `${ActionCommand.BLOCK}[${negNames.toLocaleString()}]`;
            } 
            let card = Utils.MakeHero(`${changeType}`, substr + "\n\n", actionText, Action.Buttons(actionId));

            let responses = [];
            responses.push(card);
            responses = responses.concat(Menu.EditApp(true));
            cb(responses);
        }
        catch (error)
        {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
    }

    /** Delete Action with the given actionId */
    public static async Delete(context : BlisContext, actionId : string, cb : (text) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Action`);

        if (!actionId)
        {
            let msg = `You must provide the ID of the action to delete.\n\n     ${Commands.DELETEACTION} {app ID}`;
            cb(msg);
            return;
        }

        try
        {    
            let action = await context.client.GetAction(context.state[UserStates.APP], actionId);  
            let inUse = await action.InUse(context);

            if (inUse)
            {
                let card = Utils.MakeHero("Delete Failed", action.content, "Action is being used by App", null);
                cb(card);
                return;
            }

            // TODO clear savelookup
            await context.client.DeleteAction(context.state[UserStates.APP], actionId)
            let card = Utils.MakeHero(`Deleted Action`, null, action.content, null);
            cb(card);
        }
        catch (error)
        {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(errMsg);
        }
    }

    /** Get actions.  Return count of actions */
    public static async Get(context : BlisContext, actionType : string, search : string,
            cb : (text) => void) : Promise<number>
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
                responses.push("This application contains no actions.");
                cb(responses); 
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
                        let type = (action.actionType == ActionTypes.API) ? "API" : "TEXT";
                        responses.push(Utils.MakeHero(atext, `${type} Action ` + postext+negtext, null, Action.Buttons(action.id)));
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