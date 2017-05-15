import * as builder from 'botbuilder'
import { UserStates, SaveStep } from './Model/Consts';
import { BlisDebug} from './BlisDebug';
import { ActionCommand} from './Model/Consts';
import { LabelEntity} from './Model/LabelEntity';
import { Entity} from './Model/Entity';
import { BlisContext} from './BlisContext';
import { CueCommand } from './Model/CueCommand';
import { Pager } from './Model/Pager';

export class TrainStep {
    public input : string = null;
    public entity: string = null;
    public api : string[] = [];
    public response : string[] = [];
}

export class BlisMemory {

    private memory = {};

    constructor(session : builder.Session)
    {
        this.memory = session.userData.Blis
    }

    /** Clear memory associated with a session */
    public EndSession() : void
    {
        this.memory[UserStates.SESSION] = null;
        this.memory[UserStates.TEACH] = false;
        this.memory[UserStates.LASTSTEP] = null;
        this.memory[UserStates.MEMORY]  = {};
    }

    /** Init memory for a session */
    public StartSession(sessionId : string, inTeach : boolean) : void
    {
        this.EndSession();
        this.memory[UserStates.SESSION]  = sessionId;
        this.memory[UserStates.TEACH]  = inTeach;
    }

    //--------------------------------------------------------
    // Entity Lookups
    //---------------------------------------------------------
    public AddEntityLookup(entityName: string, entityId : string) {
        this.memory[UserStates.ENTITYLOOKUP][entityName] = entityId;
    }

    public RemoveEntityLookup(entityName: string) {
        try {
            this.memory[UserStates.ENTITYLOOKUP][entityName] = null;
        }
        catch (error)
        {
             BlisDebug.Error(error);
        }  
    }

    // Does this bot have any entities
    public HasEntities() : boolean {
        return (this.memory[UserStates.ENTITYLOOKUP] && Object.keys(this.memory[UserStates.ENTITYLOOKUP]).length >0);
    }

    public EntityValue(entityName : string) : string
    {
        let entityId = this.EntityName2Id(entityName);
        let value = this.memory[UserStates.MEMORY][entityId];
        if (typeof value == 'string')
        {
            return value;
        }

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

    /** Convert EntityName to EntityId */
    public EntityName2Id(name: string) {
        try {
            // Make independant of prefix
            name = name.replace('$','');

            return this.memory[UserStates.ENTITYLOOKUP][name];
        }
        catch (error)
        {
            BlisDebug.Error(error);
        }
    }

    /** Convert EntityId to EntityName */
    public EntityId2Name(id: string) {
        try {
            for (let name in this.memory[UserStates.ENTITYLOOKUP])
            {
                let foundId = this.memory[UserStates.ENTITYLOOKUP][name];
                if (foundId == id)
                {
                    return name;
                }
            }
            BlisDebug.Error(`Missing Entity: ${id}`);
            return null;
        }
        catch (error)
        {
            BlisDebug.Error(error);
        }
    }

    /** Convert array entityIds into an array of entityNames */
    public EntityIds2Names(ids: string[]) : string[] {
        let names = [];
        try {
            for (let id of ids) 
            {    
                let found = false;            
                for (let name in this.memory[UserStates.ENTITYLOOKUP])
                {
                    let foundId = this.memory[UserStates.ENTITYLOOKUP][name];
                    if (foundId == id)
                    {
                        names.push(name);
                        found = true;
                    }
                }
                if (!found)
                {
                    names.push("{UNKNOWN}");
                    BlisDebug.Error(`Missing entity name: ${id}`);
                }        
            }
        }
        catch (error)
        {
            BlisDebug.Error(error);
        }
        return names;
    }

    public RememberEntityByName(entityName: string, entityValue: string) {
        let entityId = this.EntityName2Id(entityName);
        if (entityId)
        {
            this.RememberEntityById(entityId, entityValue);
        } 
        else
        {
            BlisDebug.Error(`Unknown Entity: ${entityName}`);
        }
    }

    public RememberEntityById(entityId: string, entityValue: string) {

        try {
            // Check if entity buckets values
            let entityName = this.EntityId2Name(entityId);
            if (entityName && entityName.startsWith(ActionCommand.BUCKET))
            {
                if (!this.memory[UserStates.MEMORY][entityId])
                {
                    this.memory[UserStates.MEMORY][entityId] = [];
                }
                this.memory[UserStates.MEMORY][entityId].push(entityValue);
            }
            else
            {
                this.memory[UserStates.MEMORY][entityId] = entityValue;
            }
        }
        catch (error)
        {
            BlisDebug.Error(error);
        }
    }  

    /** Remember entity value */
    public RememberEntity(entity : LabelEntity) {
        try {
            // Check if entity buckets values
            if (entity.metadata && entity.metadata.bucket)
            {
                if (!this.memory[UserStates.MEMORY][entity.id])
                {
                    this.memory[UserStates.MEMORY][entity.id] = [];
                }
                this.memory[UserStates.MEMORY][entity.id].push(entity.value);
            }
            else
            {
                this.memory[UserStates.MEMORY][entity.id] = entity.value;
            }
        }
        catch (error)
        {
            BlisDebug.Error(error);
        }
    }  

    // Returns true if entity was remembered
    public WasRemembered(entityId : string) : boolean {
        return this.memory[UserStates.MEMORY][entityId];
    }

    /** Return array of entityIds for which I've remembered something */
    public EntityIds() : string[]
    {
        return Object.keys(this.memory[UserStates.MEMORY]);
    }

    //OBSOLETE
    public ForgetEntityByName(entityName : string, entityValue : string) {
        let entityId = this.EntityName2Id(entityName);
        this.ForgetEntityById(entityId, entityValue);
    }

    // OBSOLETE
    public ForgetEntityById(entityId: string, entityValue : string) {
        try {
            // Check if entity buckets values
            let entityName = this.EntityId2Name(entityId);
            if (entityName.startsWith(ActionCommand.BUCKET))
            {
                // Find case insensitive index
                let lowerCaseNames = this.memory[UserStates.MEMORY][entityId].map(function(value) {
                    return value.toLowerCase();
                });

                let index = lowerCaseNames.indexOf(entityValue.toLowerCase());
                if (index > -1)
                {
                    this.memory[UserStates.MEMORY][entityId].splice(index, 1);
                    if (this.memory[UserStates.MEMORY][entityId].length == 0)
                    {
                        delete this.memory[UserStates.MEMORY][entityId];
                    }
                }    
                
            }
            else
            {
                delete this.memory[UserStates.MEMORY][entityId];
            }        
        }
        catch (error)
        {
             BlisDebug.Error(error);
        }  
    }

    /** Forget the EntityId that I've remembered */
    public ForgetEntity(entity : LabelEntity) {

        try {
            let positiveId = entity.metadata.positive;

            if (!positiveId)
            {
                throw new Error('ForgetEntity called with no PositiveId');
            }

            if (entity.metadata && entity.metadata.bucket)
            {
                // Find case insensitive index
                let lowerCaseNames = this.memory[UserStates.MEMORY][positiveId].map(function(value) {
                    return value.toLowerCase();
                });

                let index = lowerCaseNames.indexOf(entity.value.toLowerCase());
                if (index > -1)
                {
                    this.memory[UserStates.MEMORY][positiveId].splice(index, 1);
                    if (this.memory[UserStates.MEMORY][positiveId].length == 0)
                    {
                        delete this.memory[UserStates.MEMORY][positiveId];
                    }
                }             
            }
            else
            {
                let positiveId = entity.metadata.positive;
                delete this.memory[UserStates.MEMORY][positiveId];
            }        
        }
        catch (error)
        {
             BlisDebug.Error(error);
        }  
    }

    //--------------------------------------------------------
    // SUBSTITUTE
    //--------------------------------------------------------
    public GetEntities(text: string) : builder.IEntity[] {
        let entities = [];
        let words = BlisMemory.Split(text);
        for (let word of words) 
        {
            if (word.startsWith(ActionCommand.SUBSTITUTE))
            {
                // Key is in form of $entityName
                let entityName = word.substr(1, word.length-1);

                let entityValue = this.EntityValue(entityName);
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

    public SubstituteEntities(text: string) : string {
        let words = BlisMemory.Split(text);
        for (let word of words) 
        {
            if (word.startsWith(ActionCommand.SUBSTITUTE))
            {
                // Key is in form of $entityName
                let entityName = word.substr(1, word.length-1);

                let entityValue = this.EntityValue(entityName);
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

    public Substitute(text: string) : string {
        // Clear suggestions
        text = text.replace(` ${ActionCommand.SUGGEST}`," ");

        // First replace all entities
        text = this.SubstituteEntities(text);

        // Remove contingent entities
        text = this.SubstituteBrackets(text);
        return text;
    }

    //--------------------------------------------------------
    // LAST STEP
    //--------------------------------------------------------
    public RememberLastStep(saveStep: string, value: any) : void {
        if (this.memory[UserStates.LASTSTEP] == null)
        {
            this.memory[UserStates.LASTSTEP] = new TrainStep();
        }
        if (saveStep == SaveStep.RESPONSES)
        {
            // Can be mulitple Response steps
            this.memory[UserStates.LASTSTEP][SaveStep.RESPONSES].push(value);
        }
        else if (saveStep = SaveStep.APICALLS)
        {
            // Can be mulitple API steps
            this.memory[UserStates.LASTSTEP][SaveStep.APICALLS].push(value);
        }
        else
        {
            this.memory[UserStates.LASTSTEP][saveStep] = value;
        }
    }

    public LastStep(saveStep: string) : any {
        if (!this.memory[UserStates.LASTSTEP])
        {
            return null;
        }
        return this.memory[UserStates.LASTSTEP][saveStep];
    }

    //--------------------------------------------------------
    // TRAIN STEPS
    //--------------------------------------------------------
    public RememberTrainStep(saveStep: string, value: string) : void {

        if (!this.memory[UserStates.CURSTEP])
        {
            this.memory[UserStates.CURSTEP] = new TrainStep();
        }
        let curStep = this.memory[UserStates.CURSTEP];

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
        }   
    }

    /** Push current training step onto the training step history */
    public FinishTrainStep() : void {
        if (!this.memory[UserStates.TRAINSTEPS]) {
            this.memory[UserStates.TRAINSTEPS] = [];
        }
        let curStep = this.memory[UserStates.CURSTEP];
        this.memory[UserStates.TRAINSTEPS].push(curStep);
        this.memory[UserStates.CURSTEP] = null;
    }

    /** Returns input of current train step */ 
    public TrainStepInput() : TrainStep {
        let curStep = this.memory[UserStates.CURSTEP];
        if (curStep)
        {
            return curStep[SaveStep.INPUT];
        }
        return null;
    }

    public TrainSteps() : TrainStep[] {
        return this.memory[UserStates.TRAINSTEPS];
    }

    public ClearTrainSteps() : void {
        this.memory[UserStates.CURSTEP] = null;
        this.memory[UserStates.TRAINSTEPS] = [];
    }

    //--------------------------------------------------------
    // Cue COMMAND
    //--------------------------------------------------------

    public SetCueCommand(cueCommand : CueCommand) : void {
        this.memory[UserStates.CUECOMMAND] = cueCommand;
    }

    public CueCommand() : CueCommand {
        return this.memory[UserStates.CUECOMMAND];
    }

    //--------------------------------------------------------

    public AppId() : string
    {
        return this.memory[UserStates.APP];
    }

    public ModelId() : string
    {
        return this.memory[UserStates.MODEL];
    }


    public DumpEntities() : string
    {
        let memory = "";
        for (let entityId in this.memory[UserStates.MEMORY])
        {
            if (memory) memory += " ";
            let entityName = this.EntityId2Name(entityId);
            let entityValue = this.memory[UserStates.MEMORY][entityId];
            memory += `[${entityName} : ${entityValue}]`;
        }
        if (memory == "") {
            memory = '[ - none - ]';
        }
        return memory;
    }

    public Dump() : string {
        let text = "";
        text += `App: ${this.memory[UserStates.APP]}\n\n`;
        text += `Model: ${this.memory[UserStates.MODEL]}\n\n`;
        text += `Session: ${this.memory[UserStates.SESSION]}\n\n`;
        text += `InTeach: ${this.memory[UserStates.TEACH]}\n\n`;
        text += `InDebug: ${this.memory[UserStates.TEACH]}\n\n`;
        text += `LastStep: ${JSON.stringify(this.memory[UserStates.LASTSTEP])}\n\n`;
        text += `Memory: {${this.DumpEntities()}}\n\n`;
        text += `EntityLookup: ${JSON.stringify(this.memory[UserStates.ENTITYLOOKUP])}\n\n`;
        return text;
    }
}