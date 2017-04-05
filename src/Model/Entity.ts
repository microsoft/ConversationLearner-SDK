import * as builder from 'botbuilder';
import { BlisUserState} from '../BlisUserState';
import { BlisDebug} from '../BlisDebug';
import { BlisClient } from '../BlisClient';
import { TakeTurnModes, EntityTypes, UserStates, TeachStep, Commands, IntCommands, ActionTypes, SaveStep, APICalls, ActionCommand } from '../Model/Consts';
import { BlisHelp, Help } from '../Model/Help'; 
import { BlisMemory } from '../BlisMemory';
import { Utils } from '../Utils';
import { JsonProperty } from 'json-typescript-mapper';


export class EntityMetaData
{
    @JsonProperty('bucket')  
    public bucket : boolean;
        
    @JsonProperty('negatable')  
    public negatable : boolean;

    public constructor(init?:Partial<EntityMetaData>)
    {
        this.bucket = false;
        this.negatable = false;
        (<any>Object).assign(this, init);
    }

}

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

    @JsonProperty({clazz: EntityMetaData, name: 'metadata'})
    public metadata : EntityMetaData;

    public constructor(init?:Partial<Entity>)
    {
        this.id = undefined;
        this.entityType = undefined;
        this.luisPreName = undefined;
        this.name = undefined;
        this.metadata = new EntityMetaData();
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

    private static EntityButtons(name: string, id : string) : {}
    {
        // Negative entities can't be edited or deleted directly
        if (name.startsWith(ActionCommand.NEGATIVE))
        {
            return null;
        }
        let buttons = 
            { 
                "Edit" : `${IntCommands.EDITENTITY} ${id}`,
                "Delete" : `${Commands.DELETEENTITY} ${id}`,
            };
        return buttons;
    }

    private static MakeHero(title : string, name : string, id : string, type: string, prebuilt : string, metadata: EntityMetaData, buttons : boolean = true) : builder.HeroCard
    {
        let desc = this.Description(type, prebuilt, metadata.bucket, metadata.negatable);
        return Utils.MakeHero(title, desc, name, buttons ? Entity.EntityButtons(name, id) : null);
    }

    public Description() : string
    {
        return Entity.Description(this.entityType, this.luisPreName, this.metadata.bucket, this.metadata.negatable);
    }
    public static Description(type : string, prebuilt : string, bucket: boolean, negatible: boolean) : string
    {
        let description = `${prebuilt ? prebuilt : type}${bucket ? " (bucket)" : ""}${negatible ? " (negatible)" : ""}`;
        return description;
    }

    public static Sort(entities : Entity[]) : Entity[]
    {
        return entities.sort((n1, n2) => {
            if (n1.name > n2.name) {
                return 1;
            }
            if (n1.name < n2.name){
                return -1;
            }
            return 0;
        });
    }

    public static async Add(blisClient : BlisClient, userState : BlisUserState, 
        entityId : string, entityName : string, entityType : string, cb : (responses : (string | builder.IIsAttachment)[]) => void) : Promise<void>
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
                // Assume want LUIS entity if no entity given
                entityType = EntityTypes.LUIS;
            }
            if (error) 
            {
                let msg = BlisHelp.CommandHelpString(Commands.ADDENTITY, error);
                cb([msg]);
                return;
            }

            // Set metaa data
            let metadata = new EntityMetaData();
            metadata.bucket = entityName.indexOf(ActionCommand.BUCKET) > -1;
            metadata.negatable = entityName.indexOf(ActionCommand.NEGATIVE) > -1;

            // Clean action Commands
            let regex = new RegExp(`#|~`, 'g');
            entityName = entityName.replace(regex, '');

            let prebuiltName = null;
            if (entityType)
            {
                entityType = entityType.toUpperCase();
                if (entityType != EntityTypes.LOCAL && entityType != EntityTypes.LUIS)
                {
                    prebuiltName = entityType;
                    entityType = EntityTypes.LUIS;
                }
            }

            let responses = [];
            let memory = new BlisMemory(userState);
            let changeType = "";
            let negName = ActionCommand.NEGATIVE+entityName;
            if (entityId)
            {
                // Entity Type cannot be changed.  Use old type.
                let oldEntity = await blisClient.GetEntity(userState[UserStates.APP], entityId);
                let oldNegName = ActionCommand.NEGATIVE + oldEntity.name;
                entityType = oldEntity.entityType;

                // Edit GetEntity
                await blisClient.EditEntity(userState[UserStates.APP], entityId, entityName, null, prebuiltName, metadata);
                memory.AddEntityLookup(entityName, entityId);
                responses.push(Entity.MakeHero("Entity Edited", entityName, entityId, entityType, prebuiltName, metadata)); 

                // Update negations
                if (oldEntity.metadata.negatable)
                {
                    let oldNegId = memory.EntityName2Id(oldNegName);
                    if (metadata.negatable)
                    {
                        await blisClient.EditEntity(userState[UserStates.APP], oldNegId, negName, null, prebuiltName, metadata);
                        memory.AddEntityLookup(negName, oldNegId);
                        responses.push(Entity.MakeHero("Entity Edited", negName, oldNegId, entityType, prebuiltName, metadata)); 
                    }
                    else
                    {
                        await blisClient.DeleteEntity(userState[UserStates.APP], oldNegId);
                        memory.RemoveEntityLookup(oldNegName); 
                        responses.push(Entity.MakeHero("Entity Deleted", oldNegName, oldNegId, entityType, prebuiltName, metadata, false)); 
                    } 
                }
                else if (metadata.negatable)
                {
                    let negId = await blisClient.AddEntity(userState[UserStates.APP], negName, entityType, prebuiltName, metadata);
                    memory.AddEntityLookup(negName, negId);
                    responses.push(Entity.MakeHero("Entity Added", negName, negId, entityType, prebuiltName, metadata)); 
                }
            }
            else
            {
                entityId = await blisClient.AddEntity(userState[UserStates.APP], entityName, entityType, prebuiltName, metadata);
                memory.AddEntityLookup(entityName, entityId);
                responses.push(Entity.MakeHero("Entity Added", entityName, entityId, entityType, prebuiltName, metadata));

                // If negatible, add negative entity
               if (metadata.negatable)
               {
                   let negId = await blisClient.AddEntity(userState[UserStates.APP], negName, entityType, prebuiltName, metadata);
                   memory.AddEntityLookup(negName, negId);
                   responses.push(Entity.MakeHero("Entity Added", negName, negId, entityType, prebuiltName, metadata));
               }
            }

            cb(responses);

            // Retrain the model with the new entity
            userState[UserStates.MODEL]  = await blisClient.TrainModel(userState);
        }
        catch (error) {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
    } 

    /** Delete Entity with the given entityId **/
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
            let responses = []; 
            let memory = new BlisMemory(userState);
            
            let entity = await blisClient.GetEntity(userState[UserStates.APP], entityId);

            // TODO clear api save lookup

            await blisClient.DeleteEntity(userState[UserStates.APP], entityId)
            memory.RemoveEntityLookup(entity.name);
            responses.push(Entity.MakeHero("Entity Deleted", entity.name, entity.id, entity.entityType, entity.luisPreName, entity.metadata, false)); 

            if (entity.metadata.negatable)
            {
                let negName = ActionCommand.NEGATIVE+entity.name;
                let entityNegId = memory.EntityName2Id(negName);
                await blisClient.DeleteEntity(userState[UserStates.APP], entityNegId);
                memory.RemoveEntityLookup(negName); 
                responses.push(Entity.MakeHero("Entity Deleted", negName, entityNegId, entity.entityType, entity.luisPreName, entity.metadata, false)); 

            }                       
            cb(responses);
        }
        catch (error)
        {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
    }

    /** Get all actions **/
    public static async Get(blisClient : BlisClient, userState : BlisUserState, 
        search : string, cb : (text) => void) : Promise<void>
    {
        BlisDebug.Log(`Getting entities`);

        try
        {   
            let debug = false;
            if (search && search.indexOf(ActionCommand.DEBUG) > -1)
            {
                debug = true;
                search = search.replace(ActionCommand.DEBUG, "");
            }

            let entityIds = [];
            let json = await blisClient.GetEntities(userState[UserStates.APP])
            entityIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${entityIds.length} entities`);

            let memory = new BlisMemory(userState);

            if (entityIds.length == 0)
            {
                cb(["This app contains no Entities."]);
                return;
            }
            let msg = "**Entities**\n\n";
            let responses = [];
            let entities = [];

            if (entityIds.length == 0)
            {
                responses.push(["This application contains no entities."]);
                cb(responses); 
                return;
            }
            for (let entityId of entityIds)
            {
                let entity = await blisClient.GetEntity(userState[UserStates.APP], entityId);
                if (!search || entity.name.indexOf(search) > -1)
                { 
                    entities.push(entity);
                }

                // Add to entity lookup table
                memory.AddEntityLookup(entity.name, entityId);
            }
            // Sort
            entities = Entity.Sort(entities);

            // Generate output
            for (let entity of entities)
            {
                if (debug)
                {
                    msg += `${entity.name}  ${entity.Description()} ${entity.id}\n\n`;
                }
                else
                {
                    let desc = entity.Description();
                    responses.push(Utils.MakeHero(entity.name, desc, null, Entity.EntityButtons(entity.name, entity.id)));
                }
            }

            if (debug)
            {
                responses.push(msg);
            }
            
            if (responses.length == 0)
            {
                responses.push("No Entities match your query.")
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