import * as builder from 'botbuilder'
import { BlisDebug} from './BlisDebug';
import { Utils} from './Utils';
import { ActionCommand} from './Model/Consts';
import { LabelEntity} from './Model/LabelEntity';
import { Entity} from './Model/Entity';
import { BlisContext} from './BlisContext';
import { CueCommand } from './Model/CueCommand';
import { Pager } from './Model/Pager';
import { SaveStep } from './Model/Consts';
import { TrainStep, TrainSteps } from './Model/TrainStep';
var redis = require("redis");

const MemoryType =
{
    APP : "APP",
    SESSION : "SESSION",
    MODEL : "MODEL",
    TEACH: "TEACH",
    DEBUG: "DEBUG",
    INMEMORY: "INMEMORY",
    ENTITYLOOKUP_BYNAME: "ENTITYLOOKUP_BYNAME",
    ENTITYLOOKUP_BYID: "ENTITYLOOKUP_BYID",
    LASTSTEP: "LASTSTEP", 
    CURSTEP: "CURSTEP", 
    TRAINSTEPS: "TRAINSTEPS",
    CUECOMMAND: "CUECOMMAND",       // Command to call after input prompt
    PAGE: "PAGE",                   // Current page on paging UI
    POSTS: "POSTS"                  // Array of last messages sent to user
}

export class BlisMemory {

    // TODO: create own redis account
    private static redisClient = redis.createClient(6380, 'libot.redis.cache.windows.net', { auth_pass: 'SKbD9LlGF0NdPm6NpIyHpslRvqB3/z4dYYurFakJ4HM=', tls: { servername: 'libot.redis.cache.windows.net' } });

    private memCache = {};

    constructor(private userkey : string)
    {
    }

    public static GetMemory(session : builder.Session) : BlisMemory
    {
        // Create key for this user from their address
        let key = Utils.HashCode(JSON.stringify(session.message.address.user));
        return new BlisMemory(`${key}`);
    }

    private Key(datakey : string) : string {
        return `${this.userkey}_${datakey}`
    }
    private async GetAsync(datakey : string) : Promise<any> {
        let that = this;
        let key = this.Key(datakey);
        let cacheData = this.memCache[key];
        if (cacheData)
        {
            return new Promise(function(resolve,reject) {
                BlisDebug.Log(`-) ${key} : ${cacheData}`, 'memory');
                resolve(cacheData);
            });
        };
        return new Promise(function(resolve,reject) {
            BlisMemory.redisClient.get(key, function(err, data)
            {
                if(err !== null) return reject(err);
                that.memCache[key] = data;
                BlisDebug.Log(`R) ${key} : ${data}`, 'memory');
                resolve(data);
            });
        });
    }

    private async SetAsync(datakey : string, value : any) {
        if (value == null)
        {
            return this.DeleteAsync(datakey);
        }

        let that = this;
        let key = this.Key(datakey);
        return new Promise(function(resolve,reject){
            BlisMemory.redisClient.set(key, value, function(err, data)
            {
                if(err !== null) return reject(err);
                that.memCache[key] = value;
                BlisDebug.Log(`W) ${key} : ${value}`, 'memory');
                resolve(data);
            });
        });
    }

    private async DeleteAsync(datakey : string) {
        let that = this;
        let key = this.Key(datakey);
        return new Promise(function(resolve,reject){
            BlisMemory.redisClient.del(key, function(err, data)
            {
                if(err !== null) return reject(err);
                that.memCache[key] = null;
                BlisDebug.Log(`D) ${key} : -----`, 'memory');
                resolve(data);
            });
        });
    }

    private Get(datakey : string, cb : (err, data) => void) {
        let key = this.Key(datakey);

        let cacheData = this.memCache[key];
        if (cacheData)
        {
            BlisDebug.Log(`-] ${key} : ${cacheData}`, 'memory');
            cb(null, cacheData);
        }
        BlisMemory.redisClient.get(key, (err, data)=> {
            if (!err)
            {
                this.memCache[key] = data;
            }
            BlisDebug.Log(`R] ${key} : ${data}`, 'memory');
            cb(err, data);
        });
    }

    private Set(datakey : string, value : any, cb : (err, data) => void) {
        let key = this.Key(datakey);
        this.memCache[key] = value;
        BlisDebug.Log(`W] ${key} : ${value}`, 'memory');
        BlisMemory.redisClient.set(key, value, cb);
    }

    private Delete(datakey : string, cb : (err, data) => void) {
        let key = this.Key(datakey);
        this.memCache[key] = null;
        BlisDebug.Log(`D] ${key} : -----`, 'memory');
        BlisMemory.redisClient.del(key,cb);
    }

    public async Init(appId : string) : Promise<void>
    {
        await this.SetAppId(appId);
        await this.SetModelId(null);
        await this.SetSessionId(null);
        await this.SetAsync(MemoryType.TEACH, false);
        await this.SetAsync(MemoryType.DEBUG, false);
        await this.SetAsync(MemoryType.INMEMORY, JSON.stringify({}));
        await this.SetAsync(MemoryType.ENTITYLOOKUP_BYNAME,{ });
        await this.SetAsync(MemoryType.LASTSTEP, null);
        await this.SetAsync(MemoryType.CURSTEP, null);
        await this.SetAsync(MemoryType.TRAINSTEPS, []);
        await this.SetAsync(MemoryType.CUECOMMAND, null);
        await this.SetAsync(MemoryType.PAGE, null);
    }

    /** Clear memory associated with a session */
    public async EndSession() : Promise<void>
    {
        await this.SetAsync(MemoryType.SESSION, null);
        await this.SetAsync(MemoryType.TEACH, false);
        await this.SetAsync(MemoryType.LASTSTEP, null);
        await this.SetAsync(MemoryType.INMEMORY, JSON.stringify({}));
    }

    /** Init memory for a session */
    public async StartSession(sessionId : string, inTeach : boolean) : Promise<void>
    {
        await this.EndSession();
        await this.SetAsync(MemoryType.SESSION, sessionId);
        await this.SetAsync(MemoryType.TEACH, inTeach);
    }

    //--------------------------------------------------------
    // Entity Lookups
    //---------------------------------------------------------

    // Generate redis key for a entity Name lookup
    private EntityLookupNameKey(entityName : string) : string
    {
        return `${MemoryType.ENTITYLOOKUP_BYNAME}_${entityName}`;
    }

    // Generate redis key for a entity Id lookup
    private EntityLookupIdKey(entityId : string) : string
    {
        return `${MemoryType.ENTITYLOOKUP_BYID}_${entityId}`;
    }

    public async AddEntityLookup(entityName: string, entityId : string) : Promise<void> {
        let nkey = this.EntityLookupNameKey(entityName);
        await this.SetAsync(nkey, entityId);

        let ikey = this.EntityLookupIdKey(entityId);
        await this.SetAsync(ikey, entityName);
    }

    public async RemoveEntityLookup(entityName: string) : Promise<void> {
        try {
            let entityId = <string> await this.EntityId2Name(entityName);

            let nkey = this.EntityLookupNameKey(entityName);
            await this.DeleteAsync(nkey);
            
            let ikey = this.EntityLookupIdKey(entityId);
            await this.DeleteAsync(ikey);
        }
        catch (error)
        {
             BlisDebug.Error(error);
        }  
    }

    /** Convert EntityName to EntityId */
    public async EntityName2Id(entityName: string) : Promise<string> {
        try {
            // Make independant of prefix
            entityName = entityName.replace('$','');
            let key = this.EntityLookupNameKey(entityName);
            return <string> await this.GetAsync(key);
        }
        catch (error)
        {
            BlisDebug.Error(error);
        }
    }

    /** Convert EntityId to EntityName */
    public async EntityId2Name(entityId: string) :  Promise<string> {
        try {
            let key = this.EntityLookupIdKey(entityId);
            return <string> await this.GetAsync(key);
        }
        catch (error)
        {
            BlisDebug.Error(error);
        }
    }

    /** Convert array entityIds into an array of entityNames */
    public async EntityIds2Names(ids: string[]) : Promise<string[]> {
        let names = [];
        try {
            for (let entityId of ids) 
            {   
                let key = this.EntityLookupIdKey(entityId);
                let name = <string> await this.GetAsync(key);
                names.push(name);     
            }
        }
        catch (error)
        {
            BlisDebug.Error(error);
        }
        return names;
    }

    //--------------------------------------------------------
    // Bot Memory
    //---------------------------------------------------------

    // Generate redis key for a memory lookup
    private MemoryKey(entityId : string) : string
    {
        return `${MemoryType.INMEMORY}_${entityId}`;
    }

    public async EntityValue(entityName : string) : Promise<any>
    {
        let entityId = <string> await this.EntityName2Id(entityName);
 
        let botmemory = JSON.parse(await this.GetAsync(MemoryType.INMEMORY));

        let value = botmemory[entityId];
        if (typeof value == 'string')
        {
            return <string>value;
        }

        // V1 TODO
        // Print out list in friendly manner
        let group = "";
        for (let key in value)
        {
            let index = +key;
            let prefix = "";
            if (value.length != 1 && index == value.length-1)
            {
                prefix = " and ";
            }
            else if (index != 0)
            {
                prefix = ", ";
            }
            group += `${prefix}${value[key]}`;
        }
        return group;  
    }

    private async RememberEntity(entityId: string, entityName: string, entityValue: string) : Promise<void> {
        try 
        {
            let botmemory = JSON.parse(await this.GetAsync(MemoryType.INMEMORY));

            // Check if entity buckets values
            if (entityName && entityName.startsWith(ActionCommand.BUCKET))
            {
                if (!botmemory[entityId])
                {
                    botmemory[entityId] = [];
                }
                botmemory[entityId].push(entityValue);
            }
            else
            {
                botmemory[entityName] = entityValue;
            }
            await this.SetAsync(MemoryType.INMEMORY, JSON.stringify(botmemory));
        }
        catch (error)
        {
            BlisDebug.Error(error);
        }
    }  

    public async RememberEntityByName(entityName: string, entityValue: string) : Promise<void> {
        let entityId = <string> await this.EntityName2Id(entityName);
        if (entityId)
        {
            await this.RememberEntity(entityId, entityName, entityValue);
        } 
        else
        {
            BlisDebug.Error(`Unknown Entity: ${entityId}`);
        }
    }

    public async RememberEntityById(entityId: string, entityValue: string) : Promise<void> {
        let entityName = <string> await this.EntityId2Name(entityId);
        if (entityName)
        {
            await this.RememberEntity(entityId, entityName, entityValue);
        } 
        else
        {
            BlisDebug.Error(`Unknown Entity: ${entityName}`);
        }
    }  

    /** Remember entity value */
    public async RememberEntityLabel(entity : LabelEntity) : Promise<void> {
        try {
            let botmemory = JSON.parse(await this.GetAsync(MemoryType.INMEMORY));

            // Check if entity buckets values
            if (entity.metadata && entity.metadata.bucket)
            {
                if (!botmemory[entity.id])
                {
                    botmemory[entity.id] = [];
                }
                botmemory[entity.id].push(entity.value);
            }
            else
            {
               botmemory[entity.id] = entity.value;
            }
            await this.SetAsync(MemoryType.INMEMORY, JSON.stringify(botmemory));
        }
        catch (error)
        {
            BlisDebug.Error(error);
        }
    }  

    // Returns true if entity was remembered
    public async WasRemembered(entityId : string) : Promise<boolean> {
        let botmemory = JSON.parse(await this.GetAsync(MemoryType.INMEMORY));
        return (botmemory[entityId] != null);
    }


    /** Return array of entityIds for which I've remembered something */
    public async EntityIds() : Promise<string[]>
    {
        let botmemory = JSON.parse(await this.GetAsync(MemoryType.INMEMORY));
        return Object.keys(botmemory);
    }

    /** Forget an entity by Id */
    private async ForgetEntity(entityId: string, entityName: string, entityValue : string) : Promise<void> {
        try {
            // Check if entity buckets values
            let botmemory = JSON.parse(await this.GetAsync(MemoryType.INMEMORY));
            if (entityName.startsWith(ActionCommand.BUCKET))
            {
                // Find case insensitive index
                let lowerCaseNames = botmemory[entityId].map(function(value) {
                    return value.toLowerCase();
                });

                let index = lowerCaseNames.indexOf(entityValue.toLowerCase());
                if (index > -1)
                {
                    botmemory[entityId].splice(index, 1);
                    if (botmemory[entityId].length == 0)
                    {
                        delete botmemory[entityId];
                    }
                }    
                
            }
            else
            {
                delete botmemory[entityId];
            }
            await this.SetAsync(MemoryType.INMEMORY, JSON.stringify(botmemory));        
        }
        catch (error)
        {
             BlisDebug.Error(error);
        }  
    }

    /** Forget an entity */
    public async ForgetEntityByName(entityName : string, entityValue : string) : Promise<void> {
        let entityId = <string> await this.EntityName2Id(entityName);
        if (entityId)
        {
            await this.ForgetEntity(entityId, entityName, entityValue);
        } 
        else
        {
            BlisDebug.Error(`Unknown Entity: ${entityId}`);
        }
    }

    /** Forget an entity by Id */
    public async ForgetEntityById(entityId: string, entityValue : string) : Promise<void> {
        let entityName = <string> await this.EntityId2Name(entityId);
        if (entityName)
        {
            await this.ForgetEntity(entityId, entityName, entityValue);
        } 
        else
        {
            BlisDebug.Error(`Unknown Entity: ${entityName}`);
        }
    }

    /** Forget the EntityId that I've remembered */
    public async ForgetEntityLabel(entity : LabelEntity) : Promise<void>
    {
        try {
            let positiveId = entity.metadata.positive;

            if (!positiveId)
            {
                throw new Error('ForgetEntity called with no PositiveId');
            }

            let botmemory = JSON.parse(await this.GetAsync(MemoryType.INMEMORY));
            if (entity.metadata && entity.metadata.bucket)
            {
                // Find case insensitive index
                let lowerCaseNames = botmemory[positiveId].map(function(value) {
                    return value.toLowerCase();
                });

                let index = lowerCaseNames.indexOf(entity.value.toLowerCase());
                if (index > -1)
                {
                    botmemory[positiveId].splice(index, 1);
                    if (botmemory[positiveId].length == 0)
                    {
                        delete botmemory[positiveId];
                    }
                }             
            }
            else
            {
                let positiveId = entity.metadata.positive;
                delete botmemory[positiveId];
            }  
            await this.SetAsync(MemoryType.INMEMORY, JSON.stringify(botmemory));         
        }
        catch (error)
        {
             BlisDebug.Error(error);
        }  
    }

    //--------------------------------------------------------
    // SUBSTITUTE
    //--------------------------------------------------------
    public async GetEntities(text: string) : Promise<builder.IEntity[]> {
        let entities = [];
        let words = BlisMemory.Split(text);
        for (let word of words) 
        {
            if (word.startsWith(ActionCommand.SUBSTITUTE))
            {
                // Key is in form of $entityName
                let entityName = word.substr(1, word.length-1);

                let entityValue = <string> await this.EntityValue(entityName);
                if (entityValue) {
                    entities.push({ 
                        type: entityName,
                        entity: entityValue
                    });
                    text = text.replace(word, entityValue);
                }
            }
        }
        return entities;
    }

    public async SubstituteEntities(text: string) : Promise<string> {
        let words = BlisMemory.Split(text);
        for (let word of words) 
        {
            if (word.startsWith(ActionCommand.SUBSTITUTE))
            {
                // Key is in form of $entityName
                let entityName = word.substr(1, word.length-1);

                let entityValue = <string> await this.EntityValue(entityName);
                if (entityValue) {
                    text = text.replace(word, entityValue);
                }
            }
        }
        return text;
    }

    /** Extract contigent phrases (i.e. [,$name]) */
    private SubstituteBrackets(text : string) : string {
        
        let start = text.indexOf('[');
        let end = text.indexOf(']');

        // If no legal contingency found
        if (start < 0 || end < 0 || end < start) 
        {
            return text;
        }

        let phrase = text.substring(start+1, end);

        // If phrase still contains unmatched entities, cut phrase
        if (phrase.indexOf(ActionCommand.SUBSTITUTE) > 0)
        {
            text = text.replace(`[${phrase}]`, "");
        }
        // Otherwise just remove brackets
        else
        {
            text = text.replace(`[${phrase}]`, phrase);
        }
        return this.SubstituteBrackets(text);
    }

    public static Split(action : string) : string[] {
        return action.split(/[\s,:.?!\[\]]+/);
    }

    public async Substitute(text: string) : Promise<string> {
        // Clear suggestions
        text = text.replace(` ${ActionCommand.SUGGEST}`," ");

        // First replace all entities
        text = <string> await this.SubstituteEntities(text);

        // Remove contingent entities
        text = this.SubstituteBrackets(text);
        return text;
    }

    //--------------------------------------------------------
    // LAST STEP
    //--------------------------------------------------------
    public async SetLastStep(saveStep: string, value: any) : Promise<void> {
        let data = await this.GetAsync(MemoryType.LASTSTEP);
        let lastStep = TrainStep.Deserialize(TrainStep, data);

        if (lastStep == null)
        {
            lastStep = new TrainStep();
        }
        if (saveStep == SaveStep.RESPONSES)
        {
            // Can be mulitple Response steps
            lastStep[SaveStep.RESPONSES].push(value);
        }
        else if (saveStep = SaveStep.APICALLS)
        {
            // Can be mulitple API steps
            lastStep[SaveStep.APICALLS].push(value);
        }
        else
        {
            lastStep[saveStep] = value;
        }
        await this.SetAsync(MemoryType.LASTSTEP, lastStep.Serialize());
    }

    public async LastStep(saveStep: string) : Promise<any> {
        let data = await this.GetAsync(MemoryType.LASTSTEP);
        let lastStep = TrainStep.Deserialize(TrainStep, data);

        if (!lastStep)
        {
            return null;
        }
        return lastStep[saveStep];
    }

    //--------------------------------------------------------
    // TRAIN STEPS
    //--------------------------------------------------------
    public async SetTrainStep(saveStep: string, value: string) : Promise<void> {
        let data = await this.GetAsync(MemoryType.CURSTEP);
        let curStep =  TrainStep.Deserialize(TrainStep, data);    

        if (!curStep)
        {
            curStep = new TrainStep();
        }
        if (saveStep == SaveStep.INPUT)
        {
            curStep[SaveStep.INPUT] = value;
        }
        else if (saveStep == SaveStep.ENTITY)
        {
            curStep[SaveStep.ENTITY] = value;
        }
        else if (saveStep == SaveStep.RESPONSES)
        {
            // Can be mulitple Response steps
            curStep[SaveStep.RESPONSES].push(value);
        }
        else if (saveStep = SaveStep.APICALLS)
        {
            // Can be mulitple API steps
            curStep[SaveStep.APICALLS].push(value);
        }
        else
        {
            console.log(`Unknown SaveStep value ${saveStep}`);
            return;
        }
        await this.SetAsync(MemoryType.CURSTEP, curStep.Serialize());   
    }

    /** Push current training step onto the training step history */
    public async FinishTrainStep() : Promise<void> {
        let data = await this.GetAsync(MemoryType.TRAINSTEPS);
        let trainSteps =  TrainSteps.Deserialize(TrainSteps, data);    

        if (!trainSteps) {
            trainSteps = new TrainSteps();
        }
        if (!trainSteps.steps) {
            trainSteps.steps = [];
        }
        
        // Move cur stop onto history
        let cdata = await this.GetAsync(MemoryType.CURSTEP);
        let curStep =  TrainStep.Deserialize(TrainStep, cdata);    
        trainSteps.steps.push(curStep);

        await this.SetAsync(MemoryType.TRAINSTEPS, trainSteps.Serialize());
        await this.DeleteAsync(MemoryType.CURSTEP); 
    }

    /** Returns input of current train step */ 
    public async TrainStepInput() : Promise<TrainStep> {
        let cdata = await this.GetAsync(MemoryType.CURSTEP);
        let curStep =  TrainStep.Deserialize(TrainStep, cdata);   
        if (curStep)
        {
            return curStep[SaveStep.INPUT];
        }
        return null;
    }

    public async TrainSteps() : Promise<TrainStep[]> {
        let data = await this.GetAsync(MemoryType.TRAINSTEPS);
        let trainSteps = TrainSteps.Deserialize(TrainSteps, data);    
        return trainSteps.steps;
    }

    public async ClearTrainSteps() : Promise<void> {
        await this.SetAsync(MemoryType.CURSTEP, null);
        await this.SetAsync(MemoryType.TRAINSTEPS, {});
    }

    //--------------------------------------------------------
    // Cue COMMAND
    //--------------------------------------------------------

    public async SetCueCommand(cueCommand : CueCommand) : Promise<void> {
        await this.SetAsync(MemoryType.CUECOMMAND, cueCommand.Serialize());
    }

    public async CueCommand() : Promise<CueCommand> {
        let data = await this.GetAsync(MemoryType.CUECOMMAND);
        return CueCommand.Deserialize(CueCommand, data);   
    }

    public async InTeachAsync() : Promise<boolean> {
        let value = await this.GetAsync(MemoryType.TEACH);
        return (value == "true");
    }

    public InTeach(cb : (err, inTeach) => void) : void {
        let value = this.Get(MemoryType.TEACH, cb);
    }

    public async InDebug() : Promise<boolean> {
        let value = await this.GetAsync(MemoryType.DEBUG);
        return (value == "true");
    }

    public async SetInDebug(isTrue : boolean) : Promise<void> {
        await this.SetAsync(MemoryType.DEBUG, isTrue);
    }

    public async AppId() : Promise<string>
    {
        return <string> await this.GetAsync(MemoryType.APP);
    }

    public async SetAppId(appId : string) : Promise<void>
    {
        await this.SetAsync(MemoryType.APP, appId);
    }

    public async ModelId() : Promise<string>
    {
        return <string> await this.GetAsync(MemoryType.MODEL);
    }

    public async SetModelId(modelId : string) : Promise<void>
    {
        await this.SetAsync(MemoryType.MODEL, modelId);
    }

    public async SessionId() : Promise<string>
    {
        return <string> await this.GetAsync(MemoryType.SESSION);
    }

    public async SetSessionId(sessionId : string) : Promise<void>
    {
        await this.SetAsync(MemoryType.SESSION, sessionId);
    }

    public async Pager() : Promise<Pager>
    {
        let json = await this.GetAsync(MemoryType.PAGE);
        return Pager.Deserialize(Pager, json);
    }

    public async SetPager(pager : Pager) : Promise<void>
    {
        await this.SetAsync(MemoryType.PAGE, pager.Serialize());
    }

    //--------------------------------------------------------
    // Debug Tools
    //--------------------------------------------------------
    public async DumpEntities() : Promise<string>
    {
        let memory = "";
        let botmemory = JSON.parse(await this.GetAsync(MemoryType.INMEMORY));

        for (let entityId in botmemory[MemoryType.INMEMORY])
        {
            if (memory) memory += " ";
            let entityName = await this.EntityId2Name(entityId);
            let entityValue = botmemory[MemoryType.INMEMORY][entityId];
            memory += `[${entityName} : ${entityValue}]`;
        }
        if (memory == "") {
            memory = '[ - none - ]';
        }
        return memory;
    }

    public async Dump() : Promise<string> {
        let text = "";
        let botmemory = JSON.parse(await this.GetAsync(MemoryType.INMEMORY));
        let ents = await this.DumpEntities();

        text += `App: ${botmemory[MemoryType.APP]}\n\n`;
        text += `Model: ${botmemory[MemoryType.MODEL]}\n\n`;
        text += `Session: ${botmemory[MemoryType.SESSION]}\n\n`;
        text += `InTeach: ${botmemory[MemoryType.TEACH]}\n\n`;
        text += `InDebug: ${botmemory[MemoryType.TEACH]}\n\n`;
        text += `LastStep: ${JSON.stringify(botmemory[MemoryType.LASTSTEP])}\n\n`;
        text += `Memory: {${ents}}\n\n`;
        text += `EntityLookup: ${JSON.stringify(botmemory[MemoryType.ENTITYLOOKUP_BYNAME])}\n\n`;
        return text;
    }
}