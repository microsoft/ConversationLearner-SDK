import * as builder from 'botbuilder';
import { BlisUserState} from '../BlisUserState';
import { BlisDebug} from '../BlisDebug';
import { BlisClient } from '../BlisClient';
import { TakeTurnModes, EntityTypes, UserStates, TeachStep, Commands, IntCommands, ActionTypes, SaveStep, APICalls, ActionCommand } from '../Model/Consts';
import { BlisHelp, Help } from '../Model/Help'; 
import { BlisApp } from '../Model/BlisApp';
import { BlisAppContent } from '../Model/BlisAppContent';
import { BlisMemory } from '../BlisMemory';
import { Utils } from '../Utils';
import { Menu } from '../Menu';
import { JsonProperty } from 'json-typescript-mapper';
import { BlisContext } from '../BlisContext';


export class EntityMetaData
{
    @JsonProperty('bucket')  
    public bucket : boolean;
        
    /** If Negatable, the Id of negative entity associates with this Entity */
    @JsonProperty('negative')  
    public negative : string;

    /** If a Negative, Id of positive entity associated with this Entity */
    @JsonProperty('positive')  
    public positive : string;

    public constructor(init?:Partial<EntityMetaData>)
    {
        this.bucket = false;
        this.negative = undefined;
        this.positive = undefined;
        (<any>Object).assign(this, init);
    }

    /** Make negate of given metadata */
    public MakeNegative(posId : string) : EntityMetaData
    {
        return new EntityMetaData({ bucket : this.bucket, negative : null, positive : posId});
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

    /** Return negative entity name */
    private static NegativeName(name : string) : string
    {
        return ActionCommand.NEGATIVE + name;
    }

    /** Return negative entity if it exists */
    private async GetNegativeEntity(context : BlisContext) : Promise<Entity>
    {
        if (this.metadata && this.metadata.negative)
        {
            return await context.client.GetEntity(context.state[UserStates.APP], this.metadata.negative);
        }
        return null;
    }

    /** Is the Entity used anywhere */
    private async InUse(context : BlisContext) : Promise<boolean>
    {
        let appContent = await context.client.ExportApp(context.state[UserStates.APP]);

        // Clear entities
        appContent.entities = null;

        // Fast search by converting to string and looking for ID
        let appString = JSON.stringify(appContent);

        // Negative also can't be in use
        let negId = this.metadata.negative
        if (negId && appString.indexOf(negId) > -1)
        {
            return true;
        };
        return (appString.indexOf(this.id) > -1);
    }

    private static Buttons(name: string, id : string) : {}
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
        let desc = this.Description(type, prebuilt, metadata);
        return Utils.MakeHero(title, desc, name, buttons ? Entity.Buttons(name, id) : null);
    }

    public Description() : string
    {
        return Entity.Description(this.entityType, this.luisPreName, this.metadata);
    }

    public static Description(type : string, prebuilt : string, metadata : EntityMetaData) : string
    {
        let description = `${prebuilt ? prebuilt : type}${metadata.bucket ? " (bucket)" : ""}${metadata.negative ? " (negatable)" : ""}${metadata.positive ? " (delete)" : ""}`;
        return description;
    }

    public static Sort(entities : Entity[]) : Entity[]
    {
        return entities.sort((n1, n2) => {
            let c1 = n1.name.toLowerCase();
            let c2 = n2.name.toLowerCase();
            if (c1 > c2) {
                return 1;
            }
            if (c1 < c2){
                return -1;
            }
            return 0;
        });
    }

    public static async Add(context : BlisContext, entityId : string, entityType : string,
        content : string, cb : (responses : (string | builder.IIsAttachment)[]) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Add Entity ${content}`);

        try 
        {
            if (!BlisApp.HaveApp(context, cb))
            {
                return;
            }

            let error = null;
            if (!content)
            {  
                error = `You must provide an entity name for the entity to create.`;
            }
            if (error) 
            {
                let msg = BlisHelp.CommandHelpString(Commands.ADDENTITY, error);
                cb([msg]);
                return;
            }

            // Assume want LUIS entity if no entity given
            if (!entityType && !entityId)
            {         
                entityType = EntityTypes.LUIS;
            }

            // Set metadata
            let isBucket = content.indexOf(ActionCommand.BUCKET) > -1;
            let isNegatable = content.indexOf(ActionCommand.NEGATIVE) > -1;

            // Clean action Commands
            let regex = new RegExp(`#|~`, 'g');
            content = content.replace(regex, '');

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
            let memory = new BlisMemory(context);
            let changeType = "";
            let negName = Entity.NegativeName(content);
            if (entityId)
            {
                // Get old entity
                let oldEntity = await context.client.GetEntity(context.state[UserStates.APP], entityId);
                let oldNegName = Entity.NegativeName(oldEntity.name);

                // Note: Entity Type cannot be changed.  Use old type.
                entityType = oldEntity.entityType; 

                // Update Entity with an existing Negation
                if (oldEntity.metadata.negative)
                {
                    let oldNegId = memory.EntityName2Id(oldNegName);
                    if (isNegatable)
                    {
                        // Update Positive
                        let metadata = new EntityMetaData({bucket : isBucket, negative : oldNegId});
                        await context.client.EditEntity(context.state[UserStates.APP], entityId, content, null, prebuiltName, metadata);
                        memory.AddEntityLookup(content, entityId);
                        responses.push(Entity.MakeHero("Entity Edited", content, entityId, entityType, prebuiltName, metadata)); 

                        // Update Negative
                        let negmeta = new EntityMetaData({bucket : isBucket, positive : entityId});
                        await context.client.EditEntity(context.state[UserStates.APP], oldNegId, negName, null, prebuiltName, negmeta);
                        memory.AddEntityLookup(negName, oldNegId);
                        responses.push(Entity.MakeHero("Entity Edited", negName, oldNegId, entityType, prebuiltName,  negmeta)); 
                    }
                    else
                    {
                        // Update Positive
                        let metadata = new EntityMetaData({bucket : isBucket, negative : null});
                        await context.client.EditEntity(context.state[UserStates.APP], entityId, content, null, prebuiltName, metadata);
                        memory.AddEntityLookup(content, entityId);
                        responses.push(Entity.MakeHero("Entity Edited", content, entityId, entityType, prebuiltName, metadata));

                        // Delete Negative
                        await context.client.DeleteEntity(context.state[UserStates.APP], oldNegId);
                        memory.RemoveEntityLookup(oldNegName); 
                        responses.push(Entity.MakeHero("Entity Deleted", oldNegName, oldNegId, entityType, prebuiltName, oldEntity.metadata, false)); 
                    } 
                }
                // Update Entity with new Negation
                else if (isNegatable)
                {
                    // Add Negative
                    let negmeta = new EntityMetaData({bucket : isBucket, positive : oldEntity.id});
                    let newNegId = await context.client.AddEntity(context.state[UserStates.APP], negName, entityType, prebuiltName, negmeta);
                    memory.AddEntityLookup(negName, newNegId);
                    responses.push(Entity.MakeHero("Entity Added", negName, newNegId, entityType, prebuiltName, negmeta)); 

                    // Update Positive
                    let metadata = new EntityMetaData({bucket : isBucket, negative : newNegId});
                    await context.client.EditEntity(context.state[UserStates.APP], entityId, content, null, prebuiltName, metadata);
                    memory.AddEntityLookup(content, entityId);
                    responses.push(Entity.MakeHero("Entity Edited", content, entityId, entityType, prebuiltName, metadata));
                }
                else
                {
                    // Update Positive
                    let metadata = new EntityMetaData({bucket : isBucket});
                    await context.client.EditEntity(context.state[UserStates.APP], entityId, content, null, prebuiltName, metadata);
                    memory.AddEntityLookup(content, entityId);
                    responses.push(Entity.MakeHero("Entity Edited", content, entityId, entityType, prebuiltName, metadata));
                }
            }
            else
            {
                // Add Positive
                let metadata =  new EntityMetaData({bucket : isBucket});
                entityId = await context.client.AddEntity(context.state[UserStates.APP], content, entityType, prebuiltName, metadata);
                memory.AddEntityLookup(content, entityId);

                if (!isNegatable)
                {
                    responses.push(Entity.MakeHero("Entity Added", content, entityId, entityType, prebuiltName, metadata));
                }
                else
                {
                    // Add Negative
                    let negmeta =  new EntityMetaData({bucket : isBucket, positive : entityId});
                    let newNegId = await context.client.AddEntity(context.state[UserStates.APP], negName, entityType, prebuiltName, negmeta);
                    memory.AddEntityLookup(negName, newNegId);
                    responses.push(Entity.MakeHero("Entity Added", negName, newNegId, entityType, prebuiltName,negmeta));

                    // Update Positive Reference
                    let metadata = new EntityMetaData({bucket : isBucket, negative : newNegId});
                    await context.client.EditEntity(context.state[UserStates.APP], entityId, content, null, prebuiltName, metadata);
                    responses.push(Entity.MakeHero("Entity Edited", content, entityId, entityType, prebuiltName, metadata));
                }
            }
            // Add newline and edit hards
            responses = responses.concat(Menu.EditApp(true));
            cb(responses);
        }
        catch (error) {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
            return;
        }
        try
        {
            // Retrain the model with the new entity
            context.state[UserStates.MODEL]  = await context.client.TrainModel(context.state);
        }
        catch (error)
        {
            // Error here is fine.  Will trigger if entity is added with no actions
            return;
        }
    } 

    /** Delete Entity with the given entityId **/
    public static async Delete(context : BlisContext, entityId : string, cb : (text) => void) : Promise<void>
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
            let memory = new BlisMemory(context);

            let entity = await context.client.GetEntity(context.state[UserStates.APP], entityId);

            // Make sure we're not trying to delete a negative entity
            if (entity.metadata && entity.metadata.positive)
            {
                throw new Error("Can't delete a reversable Entity directly");
            }

            let inUse = await entity.InUse(context);

            if (inUse)
            {
                let card = Utils.MakeHero("Delete Failed", entity.name, "Entity is being used by App", null);
                cb([card]);
                return;
            }
            // TODO clear api save lookup

            await context.client.DeleteEntity(context.state[UserStates.APP], entityId)
            memory.RemoveEntityLookup(entity.name);
            responses.push(Entity.MakeHero("Entity Deleted", entity.name, entity.id, entity.entityType, entity.luisPreName, entity.metadata, false)); 

            // If there's an associted negative entity, delete it too
            if (entity.metadata && entity.metadata.negative)
            {
                let negEntity = await entity.GetNegativeEntity(context);
                await context.client.DeleteEntity(context.state[UserStates.APP], entity.metadata.negative);
                memory.RemoveEntityLookup(negEntity.name); 
                responses.push(Entity.MakeHero("Entity Deleted", negEntity.name, negEntity.id, negEntity.entityType, negEntity.luisPreName, negEntity.metadata, false)); 

            }   
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

    /** Get all actions **/
    public static async Get(context : BlisContext, search : string, cb : (text) => void) : Promise<void>
    {
        BlisDebug.Log(`Getting entities`);

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

            let entityIds = [];
            let json = await context.client.GetEntities(context.state[UserStates.APP])
            entityIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${entityIds.length} entities`);

            let memory = new BlisMemory(context);

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
            if (search) search = search.toLowerCase();

            for (let entityId of entityIds)
            {
                let entity = await context.client.GetEntity(context.state[UserStates.APP], entityId);
                if (!search || entity.name.toLowerCase().indexOf(search) > -1)
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
                    responses.push(Utils.MakeHero(entity.name, desc, null, Entity.Buttons(entity.name, entity.id)));
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