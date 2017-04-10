import { BlisUserState} from './BlisUserState';
import { UserStates, SaveStep } from './Model/Consts';
import { BlisDebug} from './BlisDebug';
import { ActionCommand} from './Model/Consts';
import { LabelEntity} from './Model/LabelEntity';
import { Entity} from './Model/Entity';
import { BlisContext} from './BlisContext';
import { CueCommand} from './Model/CueCommand';

export class TrainStep {
    public input : string = null;
    public entity: string = null;
    public api : string[] = [];
    public response : string = null;
}

export class BlisMemory {

    private userState : BlisUserState;
        
    constructor(context : BlisContext)
    {
        this.userState = context.state;
    }

    /** Clear memory associated with a session */
    public EndSession() : void
    {
        this.userState[UserStates.SESSION] = null;
        this.userState[UserStates.TEACH] = false;
        this.userState[UserStates.LASTSTEP] = null;
        this.userState[UserStates.MEMORY]  = {};
    }

    /** Init memory for a session */
    public StartSession(sessionId : string, inTeach : boolean) : void
    {
        this.EndSession();
        this.userState[UserStates.SESSION]  = sessionId;
        this.userState[UserStates.TEACH]  = inTeach;
    }

    /** Return ActionId for saveEntity API for the given name */
    public APILookup(entityName: string) {
        try {
            return this.userState[UserStates.APILOOKUP][entityName];
        }
        catch (error)
        {
            BlisDebug.Error(error);
        }
    }

    public AddAPILookup(entityName: string, apiActionId : string) {
        this.userState[UserStates.APILOOKUP][entityName] = apiActionId;
    }

    public RemoveAPILookup(entityName: string) {
        try {
            this.userState[UserStates.APILOOKUP][entityName] = null;
        }
        catch (error)
        {
             BlisDebug.Error(error);
        }  
    }

    public AddEntityLookup(entityName: string, entityId : string) {
        this.userState[UserStates.ENTITYLOOKUP][entityName] = entityId;
    }

    public RemoveEntityLookup(entityName: string) {
        try {
            this.userState[UserStates.ENTITYLOOKUP][entityName] = null;
        }
        catch (error)
        {
             BlisDebug.Error(error);
        }  
    }

    // Does this bot have any entities
    public HasEntities() : boolean {
        return (this.userState[UserStates.ENTITYLOOKUP] && Object.keys(this.userState[UserStates.ENTITYLOOKUP]).length >0);
    }

    public EntityValue(entityName : string) : string
    {
        let entityId = this.EntityName2Id(entityName);
        let value = this.userState[UserStates.MEMORY][entityId];
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

            return this.userState[UserStates.ENTITYLOOKUP][name];
        }
        catch (error)
        {
            BlisDebug.Error(error);
        }
    }

    /** Convert EntityId to EntityName */
    public EntityId2Name(id: string) {
        try {
            for (let name in this.userState[UserStates.ENTITYLOOKUP])
            {
                let foundId = this.userState[UserStates.ENTITYLOOKUP][name];
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
                for (let name in this.userState[UserStates.ENTITYLOOKUP])
                {
                    let foundId = this.userState[UserStates.ENTITYLOOKUP][name];
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

    // OBSOLETE
    public RememberEntityByName(entityName: string, entityValue: string) {
        let entityId = this.EntityName2Id(entityName);
        this.RememberEntityById(entityId, entityValue);
    }

    // OBSOLETE
    public RememberEntityById(entityId: string, entityValue: string) {

        try {
            // Check if entity buckets values
            let entityName = this.EntityId2Name(entityId);
            if (entityName.startsWith(ActionCommand.BUCKET))
            {
                if (!this.userState[UserStates.MEMORY][entityId])
                {
                    this.userState[UserStates.MEMORY][entityId] = [];
                }
                this.userState[UserStates.MEMORY][entityId].push(entityValue);
            }
            else
            {
                this.userState[UserStates.MEMORY][entityId] = entityValue;
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
                if (!this.userState[UserStates.MEMORY][entity.id])
                {
                    this.userState[UserStates.MEMORY][entity.id] = [];
                }
                this.userState[UserStates.MEMORY][entity.id].push(entity.value);
            }
            else
            {
                this.userState[UserStates.MEMORY][entity.id] = entity.value;
            }
        }
        catch (error)
        {
            BlisDebug.Error(error);
        }
    }  

    /** Return array of entityIds for which I've remembered something */
    public EntityIds() : string[]
    {
        return Object.keys(this.userState[UserStates.MEMORY]);
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
                let lowerCaseNames = this.userState[UserStates.MEMORY][entityId].map(function(value) {
                    return value.toLowerCase();
                });

                let index = lowerCaseNames.indexOf(entityValue.toLowerCase());
                if (index > -1)
                {
                    this.userState[UserStates.MEMORY][entityId].splice(index, 1);
                    if (this.userState[UserStates.MEMORY][entityId].length == 0)
                    {
                        delete this.userState[UserStates.MEMORY][entityId];
                    }
                }    
                
            }
            else
            {
                delete this.userState[UserStates.MEMORY][entityId];
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
                let lowerCaseNames = this.userState[UserStates.MEMORY][positiveId].map(function(value) {
                    return value.toLowerCase();
                });

                let index = lowerCaseNames.indexOf(entity.value.toLowerCase());
                if (index > -1)
                {
                    this.userState[UserStates.MEMORY][positiveId].splice(index, 1);
                    if (this.userState[UserStates.MEMORY][positiveId].length == 0)
                    {
                        delete this.userState[UserStates.MEMORY][positiveId];
                    }
                }             
            }
            else
            {
                let positiveId = entity.metadata.positive;
                delete this.userState[UserStates.MEMORY][positiveId];
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

    /** Remove all bracketed text from a string */
    public IgnoreBrackets(text : string) : string {

        let start = text.indexOf('[');
        let end = text.indexOf(']');

        // If no legal contingency found
        if (start < 0 || end < 0 || end < start) 
        {
            return text;
        }
        text = text.substring(0, start) + text.substring(end, text.length);
        return this.IgnoreBrackets(text);
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
        return text;
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
    public RememberLastStep(saveStep: string, input: string) : void {
        if (this.userState[UserStates.LASTSTEP] == null)
        {
            this.userState[UserStates.LASTSTEP] = new TrainStep();
        }
        this.userState[UserStates.LASTSTEP][saveStep] = input;
    }

    public LastStep(saveStep: string) : string {
        if (!this.userState[UserStates.LASTSTEP])
        {
            return null;
        }
        return this.userState[UserStates.LASTSTEP][saveStep];
    }

    //--------------------------------------------------------
    // TRAIN STEPS
    //--------------------------------------------------------
    public RememberTrainStep(saveStep: string, value: string) : void {

        if (!this.userState[UserStates.CURSTEP])
        {
            this.userState[UserStates.CURSTEP] = new TrainStep();
        }
        let curStep = this.userState[UserStates.CURSTEP];

        if (saveStep == SaveStep.INPUT)
        {
            curStep[SaveStep.INPUT] = value;
        }
        else if (saveStep == SaveStep.ENTITY)
        {
            curStep[SaveStep.ENTITY] = value;
        }
        else if (saveStep == SaveStep.RESPONSE)
        {
            curStep[SaveStep.RESPONSE] = value;

            // Final step so put onto history stack
            this.FinishTrainStep();
        }
        else if (saveStep = SaveStep.API)
        {
            // Can be mulitple API steps
            curStep[SaveStep.API].push(value);
        }
        else
        {
            console.log(`Unknown SaveStep value ${saveStep}`);
        }   
    }

    /** Push current training step onto the training step history */
    private FinishTrainStep() : void {
        if (!this.userState[UserStates.TRAINSTEPS]) {
            this.userState[UserStates.TRAINSTEPS] = [];
        }
        let curStep = this.userState[UserStates.CURSTEP];
        this.userState[UserStates.TRAINSTEPS].push(curStep);
        this.userState[UserStates.CURSTEP] = null;
    }

    /** Returns input of current train step */ 
    public TrainStepInput() : TrainStep {
        let curStep = this.userState[UserStates.CURSTEP];
        if (curStep)
        {
            return curStep[SaveStep.INPUT];
        }
        return null;
    }

    public TrainSteps() : TrainStep[] {
        return this.userState[UserStates.TRAINSTEPS];
    }

    public ClearTrainSteps() : void {
        this.userState[UserStates.CURSTEP] = null;
        this.userState[UserStates.TRAINSTEPS] = [];
    }

    //--------------------------------------------------------
    // Cue COMMAND
    //--------------------------------------------------------

    public SetCueCommand(cueCommand : CueCommand) : void {
        this.userState[UserStates.CUECOMMAND] = cueCommand;
    }

    public CueCommand() : CueCommand {
        return this.userState[UserStates.CUECOMMAND];
    }

    //--------------------------------------------------------

    public AppId() : string
    {
        return this.userState[UserStates.APP];
    }

    public ModelId() : string
    {
        return this.userState[UserStates.MODEL];
    }


    public DumpEntities() : string
    {
        let memory = "";
        for (let entityId in this.userState[UserStates.MEMORY])
        {
            if (memory) memory += " ";
            let entityName = this.EntityId2Name(entityId);
            let entityValue = this.userState[UserStates.MEMORY][entityId];
            memory += `[${entityName} : ${entityValue}]`;
        }
        if (memory == "") {
            memory = '[ - none - ]';
        }
        return memory;
    }

    public Dump() : string {
        let text = "";
        text += `App: ${this.userState[UserStates.APP]}\n\n`;
        text += `Model: ${this.userState[UserStates.MODEL]}\n\n`;
        text += `Session: ${this.userState[UserStates.SESSION]}\n\n`;
        text += `InTeach: ${this.userState[UserStates.TEACH]}\n\n`;
        text += `InDebug: ${this.userState[UserStates.TEACH]}\n\n`;
        text += `LastStep: ${JSON.stringify(this.userState[UserStates.LASTSTEP])}\n\n`;
        text += `Memory: {${this.DumpEntities()}}\n\n`;
        text += `EntityLookup: ${JSON.stringify(this.userState[UserStates.ENTITYLOOKUP])}\n\n`;
        text += `SaveLookup: ${JSON.stringify(this.userState[UserStates.APILOOKUP])}\n\n`;
        return text;
    }
}