import * as builder from 'botbuilder';
import { BlisDebug} from '../BlisDebug';
import { BlisClient, BlisClient_v1 } from '../BlisClient';
import { TakeTurnModes, EntityTypes, TeachStep, ActionTypes_v1, APICalls, ActionCommand } from '../Model/Consts';
import { BlisHelp } from '../Model/Help'; 
import { BlisApp_v1 } from '../Model/BlisApp';
import { BlisAppContent } from '../Model/BlisAppContent';
import { BlisMemory } from '../BlisMemory';
import { Utils } from '../Utils';
import { IntCommands, LineCommands, CueCommands } from './Command';
import { Menu } from '../Menu';
import { JsonProperty } from 'json-typescript-mapper';
import { BlisContext } from '../BlisContext';
import { EditableResponse } from './EditableResponse';
import { AdminResponse } from './AdminResponse'; 

export class EntityMetaData
{
    @JsonProperty('isBucket')  
    public isBucket : boolean;
        
    /** If set, has a negative and positive version */
    @JsonProperty('isReversable')  
    public isReversable : boolean;

    /** If Negatable, the Id of negative entity associates with this Entity */
    @JsonProperty('negativeId')  
    public negativeId : string;

    /** If a Negative, Id of positive entity associated with this Entity */
    @JsonProperty('positiveId')  
    public positiveId : string;

    public constructor(init?:Partial<EntityMetaData>)
    {
        this.isBucket = false;
        this.isReversable = false;
        this.negativeId = undefined;
        this.positiveId = undefined;
        (<any>Object).assign(this, init);
    }

    /** Make negate of given metadata */
    public MakeNegative(posId : string) : EntityMetaData
    {
        return new EntityMetaData({ isBucket : this.isBucket, negativeId : null, positiveId : posId});
    }

}

export class EntityMetaData_v1
{
    @JsonProperty('bucket')  
    public bucket : boolean;
        
    /** If set, has a negative and positive version */
    @JsonProperty('reversable')  
    public reversable : boolean;

    /** If Negatable, the Id of negative entity associates with this Entity */
    @JsonProperty('negative')  
    public negative : string;

    /** If a Negative, Id of positive entity associated with this Entity */
    @JsonProperty('positive')  
    public positive : string;

    /** Optional: Task (entityId) associated with this entity */
    @JsonProperty('task')  
    public task : string;

    @JsonProperty('version')  
    public version : number;

    @JsonProperty('packageCreationId')  
    public packageCreationId : number;

    @JsonProperty('packageDeletionId')  
    public packageDeletionId : number;

    public constructor(init?:Partial<EntityMetaData_v1>)
    {
        this.bucket = false;
        this.reversable = false;
        this.negative = undefined;
        this.positive = undefined;
        this.task = undefined;
        this.version = undefined;
        this.packageCreationId = undefined;
        this.packageDeletionId = undefined;
        (<any>Object).assign(this, init);
    }

    /** Make negate of given metadata */
    public MakeNegative(posId : string) : EntityMetaData_v1
    {
        return new EntityMetaData_v1({ bucket : this.bucket, negative : null, positive : posId, task: this.task});
    }

}

export class Entity {
    @JsonProperty('entityId')
    public entityId : string;

    @JsonProperty('entityName')
    public entityName : string;

    @JsonProperty('entityType')
    public entityType : string;

    @JsonProperty('version')
    public version : number;

    @JsonProperty('packageCreationId')
    public packageCreationId : number;

    @JsonProperty('packageDeletionId')
    public packageDeletionId : number;

    @JsonProperty({clazz: EntityMetaData, name: 'metadata'})
    public metadata : EntityMetaData;

    public constructor(init?:Partial<Entity>)
    {
        this.entityId = undefined;
        this.entityName = undefined;
        this.entityType = undefined;
        this.version = undefined;
        this.packageCreationId = undefined;
        this.packageDeletionId = undefined;
        this.metadata = undefined;
        (<any>Object).assign(this, init);
    }

    public static async Add(appId : string, key : string, entity: Entity) : Promise<AdminResponse>
    {
         BlisDebug.Log(`Trying to Add Entity ${entity.Description}`);

        try 
        {
            if (!entity.entityName)
            {  
                return AdminResponse.Error(`You must provide an entity name for the entity to create.`);
            }

            let memory = BlisMemory.GetMemory(key);
            if (appId != await memory.BotState().AppId())
            {
                BlisDebug.Log("Adding Action to diff app than in memory", "warning");
            }

            let changeType = "";
            let negName = Entity.NegativeName(entity.entityName);
            if (entity.entityId)
            {
                // Get old entity
                let oldEntity = await BlisClient.client.GetEntity(appId, entity.entityId, null);
                let oldNegName = Entity.NegativeName(oldEntity.entityName);

                // Note: Entity Type cannot be changed.  Use old type.
                entity.entityType = oldEntity.entityType; 

                // Update Entity with an existing Negation
                if (oldEntity.metadata.negativeId)
                {
                    let oldNegId = await memory.EntityLookup().ToId(oldNegName);
                    if (entity.metadata.isReversable)
                    {
                        // Update Positive
                        entity.metadata = new EntityMetaData({isBucket : entity.metadata.isBucket, negativeId : oldNegId});
                        await BlisClient.client.EditEntity(appId, entity);
                        await memory.EntityLookup().Add(entity.entityName, entity.entityId);

                        // Update Negative
                        let oldEntity = await BlisClient.client.GetEntity(appId, oldNegId, null);
                        oldEntity.metadata = new EntityMetaData({isBucket : entity.metadata.isBucket, positiveId : entity.entityId});
                        await BlisClient.client.EditEntity(appId, oldEntity);
                        await memory.EntityLookup().Add(negName, oldNegId);
                    }
                    else
                    {
                        // Update Positive
                        entity.metadata = new EntityMetaData({isBucket : entity.metadata.isBucket, negativeId : null});
                        await BlisClient.client.EditEntity(appId, entity);
                        await memory.EntityLookup().Add( entity.entityName, entity.entityId);

                        // Delete Negative
                        await BlisClient.client.DeleteEntity(appId, oldNegId);
                        await memory.EntityLookup().Remove(oldNegName); 
                    } 
                }
                // Update Entity with new Negation
                else if (entity.metadata.isReversable)
                {
                    // Add Negative Entity
                    let negEntity = new Entity({
                        entityType : entity.entityType,
                        entityName : negName,
                        metadata : new EntityMetaData({isBucket : entity.metadata.isBucket, positiveId : oldEntity.entityId})
                    });
                    let newNegId = await BlisClient.client.AddEntity(appId, negEntity);
                    await memory.EntityLookup().Add(negName, newNegId);

                    // Update Positive
                    entity.metadata = new EntityMetaData({isBucket : entity.metadata.isBucket, negativeId : newNegId});
                    await BlisClient.client.EditEntity(appId, entity);
                    await memory.EntityLookup().Add(entity.entityName, entity.entityId);
                 }
                else
                {
                    // Update Positive
                    entity.metadata = new EntityMetaData({isBucket : entity.metadata.isBucket});
                    await BlisClient.client.EditEntity(appId, entity);
                    await memory.EntityLookup().Add(entity.entityName, entity.entityId);
                }
            }
            else
            {
                let entityId = await BlisClient.client.AddEntity(appId, entity);
                await memory.EntityLookup().Add(entity.entityName, entityId);

                if (entity.metadata.isReversable)
                {
                    // Add Negative Entity
                    let negEntity = new Entity({
                        entityType : entity.entityType,
                        entityName : negName,
                        metadata : entity.metadata
                    });
                    negEntity.metadata.positiveId = entity.entityId;
                    let newNegId = await BlisClient.client.AddEntity(appId, negEntity);
                    await memory.EntityLookup().Add(negName, newNegId);

                    // Update Positive Reference
                    entity.metadata.negativeId = newNegId;
                    await BlisClient.client.EditEntity(appId, entity);
                }
            }
        }
        catch (error) {
            let errMsg = BlisDebug.Error(error); 
            return AdminResponse.Error(errMsg);
        }

        // V2 TODO - this should happen elsewhere with new training flow
        /*
        try
        {
            // Retrain the model with the new entity
            let modelId = await BlisClient.client.TrainModel(appId);
            context.SetState(UserStates.MODEL, modelId);
        }
        catch (error)()
        {
            // Error here is fine.  Will trigger if entity is added with no actions
            return;
        }
        */
    } 

     /** Delete Entity with the given entityId **/
    public static async Delete(appId : string, key : string, entityId : string) : Promise<AdminResponse>
    {
       BlisDebug.Log(`Trying to Delete Entity`);

        if (!entityId)
        {
            return AdminResponse.Error(`You must provide the ID of the entity to delete.`);
        }

        try
        {     
            let memory = BlisMemory.GetMemory(key);

            let appId = await memory.BotState().AppId();
            let entity = await BlisClient.client.GetEntity(appId, entityId, null);
 
            // Make sure we're not trying to delete a negative entity
            if (entity.metadata && entity.metadata.positiveId)
            {
                throw new Error("Can't delete a reversable Entity directly");
            }

           let inUse = await entity.InUse(appId);

            if (inUse)
            {
                return AdminResponse.Error(`Delete Failed ${entity.entityName}.  Entity is being used by App`);
            }
            await BlisClient_v1.client.DeleteEntity(appId, entityId)
            await memory.EntityLookup().Remove(entity.entityName);

            // If there's an associated negative entity, delete it too
            if (entity.metadata && entity.metadata.negativeId)
            {
                let negEntity = await entity.GetNegativeEntity(appId);
                await BlisClient_v1.client.DeleteEntity(appId, entity.metadata.negativeId);
                await memory.EntityLookup().Remove(negEntity.entityName); 
            }   
        }
        catch (error)
        {
            let errMsg = BlisDebug.Error(error); 
            return AdminResponse.Error(errMsg);
        }
    }

    /** Get all actions **/
    public static async Get(key : string, search : string) : Promise<AdminResponse>
    {
        BlisDebug.Log(`Getting entities`);

        try
        {   
            let memory = BlisMemory.GetMemory(key);
            let appId = await memory.BotState().AppId()
            
            if (!appId)
            {
                return AdminResponse.Error(`No app has been loaded.`);
            }

            let debug = false;
            if (search && search.indexOf(ActionCommand.DEBUG) > -1)
            {
                debug = true;
                search = search.replace(ActionCommand.DEBUG, "");
            }

            let entityIds = [];
            let json = await BlisClient_v1.client.GetEntities(appId)
            entityIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${entityIds.length} entities`);;

            if (entityIds.length == 0)
            {
                return AdminResponse.Result([]);
            }
            let entities = [];

            if (search) search = search.toLowerCase();

            for (let entityId of entityIds)
            {
                let entity = await BlisClient.client.GetEntity(appId, entityId, null);
                if (!search || entity.entityName.toLowerCase().indexOf(search) > -1)
                { 
                    entities.push(entity);
                }

                // Add to entity lookup table
                await memory.EntityLookup().Add(entity.entityName, entityId);
            }
            // Sort
            entities = Entity.Sort(entities);

            // Return result
            return AdminResponse.Result(entities);
        }
        catch (error) {
            let errMsg = BlisDebug.Error(error); 
            return AdminResponse.Error(errMsg);
        }
    }

    /** Return negative entity name */
    private static NegativeName(name : string) : string
    {
        return ActionCommand.NEGATIVE + name;
    }

    /** Return negative entity if it exists */
    private async GetNegativeEntity(appId : string) : Promise<Entity>
    {
        if (this.metadata && this.metadata.negativeId)
        {
            return await BlisClient.client.GetEntity(appId, this.metadata.negativeId, null);
        }
        return null;
    }

    /** Is the Entity used anywhere */
    private async InUse(appId : string) : Promise<boolean>
    {
        let appContent = await BlisClient_v1.client.ExportApp(appId);

        // Clear entities
        appContent.entities = null;

        // Fast search by converting to string and looking for ID
        let appString = JSON.stringify(appContent);

        // Negative also can't be in use
        let negId = this.metadata.negativeId
        if (negId && appString.indexOf(negId) > -1)
        {
            return true;
        };
        return (appString.indexOf(this.entityId) > -1);
    }

    public Description() : string
    {
        return Entity.Description(this.entityType, this.metadata);
    }

    public static Description(entityType : string, metadata : EntityMetaData) : string
    {
        let description = `${entityType}${metadata.isBucket ? " (bucket)" : ""}`;
        description += `${metadata.negativeId ? " (negatable)" : ""}`;
        description += `${metadata.positiveId ? " (delete)" : ""}`;
        return description;
    }

    public static Sort(entities : Entity[]) : Entity[]
    {
        return entities.sort((n1, n2) => {
            let c1 = n1.entityName.toLowerCase();
            let c2 = n2.entityName.toLowerCase();
            if (c1 > c2) {
                return 1;
            }
            if (c1 < c2){
                return -1;
            }
            return 0;
        });
    }
}

export class EntityList
{
    @JsonProperty({clazz: Entity, name: 'entities'})
    public entities : Entity[];

    public constructor(init?:Partial<EntityList>)
    {
        this.entities = undefined;
        (<any>Object).assign(this, init);
    }
}

export class EntityIdList
{
    @JsonProperty('entityIds')  
    public entityIds : string[];

    public constructor(init?:Partial<EntityIdList>)
    {
        this.entityIds = undefined;
        (<any>Object).assign(this, init);
    }
}

export class Entity_v1
{
    @JsonProperty('id')
    public id : string;

    @JsonProperty('EntityType')
    public entityType : string;

    @JsonProperty('LUISPreName')
    public luisPreName : string;

    @JsonProperty('name')
    public name : string;

    @JsonProperty({clazz: EntityMetaData_v1, name: 'metadata'})
    public metadata : EntityMetaData_v1;

    public constructor(init?:Partial<Entity_v1>)
    {
        this.id = undefined;
        this.entityType = undefined;
        this.luisPreName = undefined;
        this.name = undefined;
        this.metadata = new EntityMetaData_v1();
        (<any>Object).assign(this, init);
    }

    public Equal(entity : Entity_v1) : boolean
    {
        if (this.entityType != entity.entityType) return false;
        if (this.luisPreName != entity.luisPreName) return false;
        if (this.name != entity.name) return false;
        return true;
    }
    
    public static async toText(appId : string, entityId : string) : Promise<string>
    {
        try {
            let entity = await BlisClient_v1.client.GetEntity_v1(appId, entityId);
            return entity.name;
        }
        catch (error)
        {
            BlisDebug.Error(error);
            throw(error);
        }
    }

    public TOV2() : Entity
    {
        let metadataV2 = new EntityMetaData();
        metadataV2.isBucket = this.metadata.bucket;
        metadataV2.isReversable = this.metadata.reversable;
        metadataV2.negativeId = this.metadata.negative;
        metadataV2.positiveId = this.metadata.positive;
        
        return new Entity
        ({
            entityId : this.id,
            entityName : this.name,
            entityType : this.entityType,
            version : this.metadata.version,
            packageCreationId : this.metadata.packageCreationId,
            packageDeletionId : this.metadata.packageDeletionId,
            metadata : metadataV2
        });
    }

    static TOV1(entity : Entity) : Entity_v1
    {
        let metadataV1 = new EntityMetaData_v1();
        metadataV1.bucket = entity.metadata.isBucket;
        metadataV1.reversable = entity.metadata.isReversable;
        metadataV1.negative = entity.metadata.negativeId;
        metadataV1.positive = entity.metadata.positiveId;
        metadataV1.version = entity.version;
        metadataV1.packageCreationId = entity.packageCreationId;
        metadataV1.packageDeletionId = entity.packageDeletionId;
       
        return new Entity_v1
        ({
            id : entity.entityId,
            name : entity.entityName,
            entityType : entity.entityType,
            metadata : metadataV1
        });
    }

    /** Return negative entity name */
    private static NegativeName_v1(name : string) : string
    {
        return ActionCommand.NEGATIVE + name;
    }

    /** Return negative entity if it exists */
    private async GetNegativeEntity_v1(appId : string, context : BlisContext) : Promise<Entity_v1>
    {
        if (this.metadata && this.metadata.negative)
        {
            return await BlisClient_v1.client.GetEntity_v1(appId, this.metadata.negative);
        }
        return null;
    }

    /** Is the Entity used anywhere */
    private async InUse_v1(appId : string, context : BlisContext) : Promise<boolean>
    {
        let appContent = await BlisClient_v1.client.ExportApp(appId);

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
                "Edit" : `${CueCommands.EDITENTITY} ${id}`,
                "Delete" : `${LineCommands.DELETEENTITY} ${id}`,
            };
        return buttons;
    }

    private static MakeHero(title : string, name : string, id : string, type: string, prebuilt : string, metadata: EntityMetaData_v1, buttons : boolean = true) : builder.HeroCard
    {
        let desc = this.Description_v1(type, prebuilt, metadata);
        return Utils.MakeHero(title, desc, name, buttons ? Entity_v1.Buttons(name, id) : null);
    }

    public Description_v1() : string
    {
        return Entity_v1.Description_v1(this.entityType, this.luisPreName, this.metadata);
    }

    public static Description_v1(type : string, prebuilt : string, metadata : EntityMetaData_v1) : string
    {
        let description = `${prebuilt ? prebuilt : type}${metadata.bucket ? " (bucket)" : ""}`;
        description += `${metadata.negative ? " (negatable)" : ""}`;
        description += `${metadata.positive ? " (delete)" : ""}`;
        description += `${metadata.task ? ` (Task: ${metadata.task}` : ""}`;
        return description;
    }

    public static Sort_v1(entities : Entity_v1[]) : Entity_v1[]
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

    public static async Add_v1(context : BlisContext, entityId : string, entityType : string,
        userInput : string, cb : (responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Add Entity ${userInput}`);

        let memory = context.Memory();
        let appId = await memory.BotState().AppId();

        try 
        {
            if (!BlisApp_v1.HaveApp_v1(appId, context, cb))
            {
                return;
            }

            if (!userInput)
            {  
                cb(Menu.AddEditCards(context, [`You must provide an entity name for the entity to create.`]));
                return;
            }

            // Assume want LUIS entity if no entity given
            if (!entityType && !entityId)
            {         
                entityType = EntityTypes.LUIS;
            }

            // Set metadata
            let isBucket = userInput.indexOf(ActionCommand.BUCKET) > -1;
            let isNegatable = userInput.indexOf(ActionCommand.NEGATIVE) > -1;

            // Extract response and commands
            let [content, task] = userInput.split('//');

            // Clean action Commands
            let regex = new RegExp(`#|~`, 'g');
            content = content.replace(regex, '');


            // Determine if entity is associated with a task
            let taskId = null;
            if (task)
            {
                taskId = await memory.EntityLookup().ToId(task);
                if (!taskId)
                {
                    cb(Menu.AddEditCards(context, [`Task ${task} not found.`]));
                    return ;
                }
            }
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
            let changeType = "";
            
            let negName = Entity_v1.NegativeName_v1(content);
            if (entityId)
            {
                // Get old entity
                let oldEntity = await BlisClient_v1.client.GetEntity_v1(appId, entityId);
                let oldNegName = Entity_v1.NegativeName_v1(oldEntity.name);

                // Note: Entity Type cannot be changed.  Use old type.
                entityType = oldEntity.entityType; 

                // Update Entity with an existing Negation
                if (oldEntity.metadata.negative)
                {
                    let oldNegId = await memory.EntityLookup().ToId(oldNegName);
                    if (isNegatable)
                    {
                        // Update Positive
                        let metadata = new EntityMetaData_v1({bucket : isBucket, task: taskId, negative : oldNegId});
                        await BlisClient_v1.client.EditEntity_v1(appId, entityId, content, null, prebuiltName, metadata);
                        await memory.EntityLookup().Add(content, entityId);
                        responses.push(Entity_v1.MakeHero("Entity Edited", content, entityId, entityType, prebuiltName, metadata)); 

                        // Update Negative
                        let negmeta = new EntityMetaData_v1({bucket : isBucket, task: taskId, positive : entityId});
                        await BlisClient_v1.client.EditEntity_v1(appId, oldNegId, negName, null, prebuiltName, negmeta);
                        await memory.EntityLookup().Add(negName, oldNegId);
                        responses.push(Entity_v1.MakeHero("Entity Edited", negName, oldNegId, entityType, prebuiltName,  negmeta)); 
                    }
                    else
                    {
                        // Update Positive
                        let metadata = new EntityMetaData_v1({bucket : isBucket, task: taskId, negative : null});
                        await BlisClient_v1.client.EditEntity_v1(appId, entityId, content, null, prebuiltName, metadata);
                        await memory.EntityLookup().Add(content, entityId);
                        responses.push(Entity_v1.MakeHero("Entity Edited", content, entityId, entityType, prebuiltName, metadata));

                        // Delete Negative
                        await BlisClient_v1.client.DeleteEntity(appId, oldNegId);
                        await memory.EntityLookup().Remove(oldNegName); 
                        responses.push(Entity_v1.MakeHero("Entity Deleted", oldNegName, oldNegId, entityType, prebuiltName, oldEntity.metadata, false)); 
                    } 
                }
                // Update Entity with new Negation
                else if (isNegatable)
                {
                    // Add Negative
                    let negmeta = new EntityMetaData_v1({bucket : isBucket, task: taskId, positive : oldEntity.id});
                    let newNegId = await BlisClient_v1.client.AddEntity_v1(appId, negName, entityType, prebuiltName, negmeta);
                    await memory.EntityLookup().Add(negName, newNegId);
                    responses.push(Entity_v1.MakeHero("Entity Added", negName, newNegId, entityType, prebuiltName, negmeta)); 

                    // Update Positive
                    let metadata = new EntityMetaData_v1({bucket : isBucket, task: taskId, negative : newNegId});
                    await BlisClient_v1.client.EditEntity_v1(appId, entityId, content, null, prebuiltName, metadata);
                    await memory.EntityLookup().Add(content, entityId);
                    responses.push(Entity_v1.MakeHero("Entity Edited", content, entityId, entityType, prebuiltName, metadata));
                }
                else
                {
                    // Update Positive
                    let metadata = new EntityMetaData_v1({bucket : isBucket, task: taskId});
                    await BlisClient_v1.client.EditEntity_v1(appId, entityId, content, null, prebuiltName, metadata);
                    await memory.EntityLookup().Add(content, entityId);
                    responses.push(Entity_v1.MakeHero("Entity Edited", content, entityId, entityType, prebuiltName, metadata));
                }
            }
            else
            {
                // Add Positive
                let metadata =  new EntityMetaData_v1({bucket : isBucket, task: taskId});
                entityId = await BlisClient_v1.client.AddEntity_v1(appId, content, entityType, prebuiltName, metadata);
                await memory.EntityLookup().Add(content, entityId);

                if (!isNegatable)
                {
                    responses.push(Entity_v1.MakeHero("Entity Added", content, entityId, entityType, prebuiltName, metadata));
                }
                else
                {
                    // Add Negative
                    let negmeta =  new EntityMetaData_v1({bucket : isBucket, task: taskId, positive : entityId});
                    let newNegId = await BlisClient_v1.client.AddEntity_v1(appId, negName, entityType, prebuiltName, negmeta);
                    await memory.EntityLookup().Add(negName, newNegId);
                    responses.push(Entity_v1.MakeHero("Entity Added", negName, newNegId, entityType, prebuiltName,negmeta));

                    // Update Positive Reference
                    let metadata = new EntityMetaData_v1({bucket : isBucket, task: taskId, negative : newNegId});
                    await BlisClient_v1.client.EditEntity_v1(appId, entityId, content, null, prebuiltName, metadata);
                    responses.push(Entity_v1.MakeHero("Entity Edited", content, entityId, entityType, prebuiltName, metadata));
                }
            }
            // Add newline and edit hards
            responses = responses.concat(Menu.EditCards(true));
            cb(responses);
        }
        catch (error) {
            let errMsg = BlisDebug.Error(error); 
            cb([errMsg]);
            return;
        }
        try
        {
            // Retrain the model with the new entity
            let modelId = await BlisClient_v1.client.TrainModel(appId);
            await memory.BotState().SetModelId(modelId);
        }
        catch (error)
        {
            // Error here is fine.  Will trigger if entity is added with no actions
            return;
        }
    } 

    /** Delete Entity with the given entityId **/
    public static async Delete_v1(context : BlisContext, entityId : string, cb : (text) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Entity`);

        if (!entityId)
        {
            let msg = `You must provide the ID of the entity to delete.\n\n     ${LineCommands.DELETEENTITY} {app ID}`;
            cb(msg);
            return;
        }

        try
        {    
            let responses = []; 
            let memory = context.Memory()

            let appId = await memory.BotState().AppId();
            let entity = await BlisClient_v1.client.GetEntity_v1(appId, entityId);

            // Make sure we're not trying to delete a negative entity
            if (entity.metadata && entity.metadata.positive)
            {
                throw new Error("Can't delete a reversable Entity directly");
            }

            let inUse = await entity.InUse_v1(appId, context);

            if (inUse)
            {
                let card = Utils.MakeHero("Delete Failed", entity.name, "Entity is being used by App", null);
                cb(Menu.AddEditCards(context,[card]));
                return;
            }
            await BlisClient_v1.client.DeleteEntity(appId, entityId)
            await memory.EntityLookup().Remove(entity.name);
            responses.push(Entity_v1.MakeHero("Entity Deleted", entity.name, entity.id, entity.entityType, entity.luisPreName, entity.metadata, false)); 

            // If there's an associted negative entity, delete it too
            if (entity.metadata && entity.metadata.negative)
            {
                let negEntity = await entity.GetNegativeEntity_v1(appId, context);
                await BlisClient_v1.client.DeleteEntity(appId, entity.metadata.negative);
                await memory.EntityLookup().Remove(negEntity.name); 
                responses.push(Entity_v1.MakeHero("Entity Deleted", negEntity.name, negEntity.id, negEntity.entityType, negEntity.luisPreName, negEntity.metadata, false)); 

            }   
            responses = responses.concat(Menu.EditCards(true));                    
            cb(responses);
        }
        catch (error)
        {
            let errMsg = BlisDebug.Error(error); 
            cb([errMsg]);
        }
    }

    /** Get all actions **/
    public static async Get_v1(context : BlisContext, search : string, cb : (text) => void) : Promise<void>
    {
        BlisDebug.Log(`Getting entities`);

        try
        {   
            let memory = context.Memory() 
            let appId = await memory.BotState().AppId()
            
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

            let entityIds = [];
            let json = await BlisClient_v1.client.GetEntities(appId)
            entityIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${entityIds.length} entities`);;

            if (entityIds.length == 0)
            {
                cb(Menu.AddEditCards(context,["This app contains no Entities."]));
                return;
            }
            let msg = "**Entities**\n\n";
            let responses = [];
            let entities = [];

            if (search) search = search.toLowerCase();

            for (let entityId of entityIds)
            {
                let entity = await BlisClient_v1.client.GetEntity_v1(appId, entityId);
                if (!search || entity.name.toLowerCase().indexOf(search) > -1)
                { 
                    entities.push(entity);
                }

                // Add to entity lookup table
                await memory.EntityLookup().Add(entity.name, entityId);
            }
            // Sort
            entities = Entity_v1.Sort_v1(entities);

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
                    responses.push(Utils.MakeHero(entity.name, desc, null, Entity_v1.Buttons(entity.name, entity.id)));
                }
            }

            if (debug)
            {
                responses.push(msg);
            }
            
            if (responses.length == 0)
            {
                cb(Menu.AddEditCards(context, ["No Entities match your query."]));
                return;
            }
            responses.push(null, Menu.Home());
            cb(responses);
        }
        catch (error) {
            let errMsg = BlisDebug.Error(error); 
            cb([errMsg]);
        }
    }
}