import { BlisUserState} from './BlisUserState';
import { UserStates, SaveStep } from './Model/Consts';
import { BlisDebug} from './BlisDebug';

export class TrainStep {
    public input : string = null;
    public entity: string = null;
    public api : string[] = [];
    public response : string = null;
}

export class BlisMemory {

    constructor(private userState : BlisUserState){
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
            return this.userState[UserStates.SAVELOOKUP][entityName];
        }
        catch (error)
        {
            BlisDebug.Error(error);
        }
    }

    public AddAPILookup(entityName: string, apiActionId : string) {
        this.userState[UserStates.SAVELOOKUP][entityName] = apiActionId;
    }

    public RemoveAPILookup(entityName: string) {
        try {
            this.userState[UserStates.SAVELOOKUP][entityName] = null;
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
        return this.userState[UserStates.MEMORY][entityId];
    }

    public EntityName2Id(name: string) {
        try {
            // Made independant of prefix
            name = name.replace('$','');

            return this.userState[UserStates.ENTITYLOOKUP][name];
        }
        catch (error)
        {
            BlisDebug.Error(error);
        }
    }

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
            return null;
        }
        catch (error)
        {
            BlisDebug.Error(error);
        }
    }

    // Converst array entity IDs into an array of entity Names
    public EntityNames(ids: string[]) : string[] {
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

    /** Remember a EntityId / value */
    public RememberEntity(entityId: string, value: string) {
        try {
            this.userState[UserStates.MEMORY][entityId] = value;
        }
        catch (error)
        {
            BlisDebug.Error(error);
        }
    }  

    // Return array of entityIds for which I've remembered something
    public EntityIds() : string[]
    {
        return Object.keys(this.userState[UserStates.MEMORY]);
    }

    public ForgetEntity(key: string) {
        try {
            this.userState[UserStates.MEMORY].delete[key];
        }
        catch (error)
        {
             BlisDebug.Error(error);
        }  
    }

    public Substitute(text: string) : string {
        let words = text.split(/[\s,:.?]+/);
        for (let word of words) 
        {
            if (word.startsWith("$"))
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
    public RememberTrainStep(saveStep: string, value: string) : void {
        if (!this.userState[UserStates.TRAINSTEPS]) {
            this.userState[UserStates.TRAINSTEPS] = [];
            this.userState[UserStates.TRAINSTEPS][SaveStep.API] = [];
        }
        let curStep = null;
        if (saveStep == SaveStep.INPUT)
        {
            curStep = new TrainStep();
            curStep[SaveStep.INPUT] = value;
            this.userState[UserStates.TRAINSTEPS].push(curStep);
        }
        else 
        {
            let lastIndex = this.userState[UserStates.TRAINSTEPS].length - 1;
            curStep = this.userState[UserStates.TRAINSTEPS][lastIndex];
            if (saveStep == SaveStep.ENTITY)
            {
                curStep[SaveStep.ENTITY] = value;
            }
            else if (saveStep == SaveStep.RESPONSE)
            {
                curStep[SaveStep.RESPONSE] = value;
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
    }

    public TrainSteps() : TrainStep[] {
        return this.userState[UserStates.TRAINSTEPS];
    }

    public ClearTrainSteps() : void {
        this.userState[UserStates.TRAINSTEPS] = [];
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
            if (memory) memory += ", ";
            let entityName = this.EntityId2Name(entityId);
            let entityValue = this.userState[UserStates.MEMORY][entityId];
            memory += `[$${entityName} : ${entityValue}]`;
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
        text += `SaveLookup: ${JSON.stringify(this.userState[UserStates.SAVELOOKUP])}\n\n`;
        return text;
    }
}