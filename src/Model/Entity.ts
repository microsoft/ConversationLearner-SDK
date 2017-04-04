import * as builder from 'botbuilder';
import { BlisUserState} from '../BlisUserState';
import { BlisDebug} from '../BlisDebug';
import { BlisClient } from '../BlisClient';
import { TakeTurnModes, EntityTypes, UserStates, TeachStep, Commands, IntCommands, ActionTypes, SaveStep, APICalls, ActionCommand } from '../Model/Consts';
import { BlisHelp, Help } from '../Model/Help'; 
import { BlisMemory } from '../BlisMemory';
import { Utils } from '../Utils';
import { JsonProperty } from 'json-typescript-mapper';


export class Entity
{
    @JsonProperty('id')
    public id : string;

    @JsonProperty('EntityType')
    public entityType : string;

    @JsonProperty('LUISPreName')
    public luisPreName : string;

    @JsonProperty('name')
    public name : string;
    
    public constructor(init?:Partial<Entity>)
    {
        this.id = undefined;
        this.entityType = undefined;
        this.luisPreName = undefined;
        this.name = undefined;
        (<any>Object).assign(this, init);
    }

    public Equal(entity : Entity) : boolean
    {
        if (this.entityType != entity.entityType) return false;
        if (this.luisPreName != entity.luisPreName) return false;
        if (this.name != entity.name) return false;
        return true;
    }
    
    public static async toText(client : BlisClient, appId : string, entityId : string) : Promise<string>
    {
        try {
            let entity = await client.GetEntity(appId, entityId);
            return entity.name;
        }
        catch (error)
        {
            BlisDebug.Error(error);
            throw(error);
        }
    }

      public static async Add(blisClient : BlisClient, userState : BlisUserState, 
        entityId : string, entityName : string, entityType : string, prebuiltName : string, cb : (responses : (string | builder.IIsAttachment)[]) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Add Entity ${entityName}`);

        try 
        {
            let error = null;
            if (!entityName)
            {  
                error = `You must provide an entity name for the entity to create.`;
            }
            if (!entityType && !entityId)
            {
                error = `You must provide an entity type for the entity to create.`;
            }
            if (error) 
            {
                let msg = BlisHelp.CommandHelpString(Commands.ADDENTITY, error);
                cb([msg]);
                return;
            }

            if (entityType)
            {
                entityType = entityType.toUpperCase();
                if (entityType != EntityTypes.LOCAL && entityType != EntityTypes.LUIS)
                {
                    let msg = BlisHelp.CommandHelpString(Commands.ADDENTITY, `Entity type must be 'LOCAL' or 'LUIS'`);
                    cb([msg]);
                    return;
                }
                if (entityType == EntityTypes.LOCAL && prebuiltName != null)
                {
                    let msg = BlisHelp.CommandHelpString(Commands.ADDENTITY, `LOCAL entities shouldn't include a prebuilt name`);
                    cb([msg]);
                    return;
                }
            }

            let memory = new BlisMemory(userState);
            let changeType = "";
            if (entityId)
            {
               //memory.RemoveEntityLookup() TODO
               entityId = await blisClient.EditEntity(userState[UserStates.APP], entityId, entityName, entityType, prebuiltName);
               changeType = "Edited";
            }
            else
            {
                await blisClient.AddEntity(userState[UserStates.APP], entityName, entityType, prebuiltName);
                changeType = "Created";
            }
            
            memory.AddEntityLookup(entityName, entityId);

            let card = Utils.MakeHero(`${changeType} Entity`, entityId, entityName, null);
            cb([card]); 
        }
        catch (error) {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
    } 

    /** Delete Entity with the given entityId */
    public static async Delete(blisClient : BlisClient, userState : BlisUserState, 
        entityId : string, cb : (text) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Entity`);

        if (!entityId)
        {
            let msg = `You must provide the ID of the entity to delete.\n\n     ${Commands.DELETEENTITY} {app ID}`;
            cb(msg);
            return;
        }

        try
        {        
            // TODO clear savelookup
            await blisClient.DeleteEntity(userState[UserStates.APP], entityId)
            cb(`Deleted Entity ${entityId}`);
        }
        catch (error)
        {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(errMsg);
        }
    }

    public static async Get(blisClient : BlisClient, userState : BlisUserState, 
        detail : string, cb : (text) => void) : Promise<void>
    {
        BlisDebug.Log(`Getting entities`);

        try
        {        
            let entityIds = [];
            let json = await blisClient.GetEntities(userState[UserStates.APP])
            entityIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${entityIds.length} entities`);

            let memory = new BlisMemory(userState);

            if (entityIds.length == 0)
            {
                cb("This app contains no Entities.");
                return;
            }
            let msg = "**Entities**\n\n";
            let responses = [];

            if (entityIds.length == 0)
            {
                responses.push(["This application contains no entities."]);
                cb(responses); 
                return;
            }
            for (let entityId of entityIds)
            {
                let entity = await blisClient.GetEntity(userState[UserStates.APP], entityId);

                if (detail)
                {
                    let type = entity.luisPreName ? entity.luisPreName : entity.entityType;
                    responses.push(Utils.MakeHero(entity.name, type, null,
                    { 
                            "Edit" : `${IntCommands.EDITENTITY} ${entityId}`,
                            "Delete" : `${Commands.DELETEENTITY} ${entityId}`,
                    }));
                }
                else
                {
                    msg += `${entity.name}\n\n`;
                }

                // Add to entity lookup table
                memory.AddEntityLookup(entity.name, entityId);
            }
            if (!detail)
            {
                responses.push(msg);
            }
            cb(responses);
        }
        catch (error) {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
    }
}