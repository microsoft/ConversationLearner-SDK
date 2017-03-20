import { BlisUserState} from './BlisUserState';
import { UserStates, SaveStep } from './Model/Consts';
import { BlisDebug} from './BlisDebug';

export class TrainStep {
    public input : string;
    public entity: string;
    public response : string;
}

export class BlisMemory {

    constructor(private userState : BlisUserState){
    }

    public AddEntityLookup(name: string, id : string) {
        this.userState[UserStates.ENTITYLOOKUP][name] = id;
    }

    public RemoveEntityLookup(name: string) {
        try {
            this.userState[UserStates.ENTITYLOOKUP].delete[name] = null;
        }
        catch (Error)
        {
             BlisDebug.Log(Error);
        }  
    }

    // Does this bot have any entities
    public HasEntities() : boolean {
        return (this.userState[UserStates.ENTITYLOOKUP] && Object.keys(this.userState[UserStates.ENTITYLOOKUP]).length >0);
    }

    public EntityId(name: string) {
        try {
            return this.userState[UserStates.ENTITYLOOKUP][name];
        }
        catch (Error)
        {
            BlisDebug.Log(Error);
        }
    }

    public EntityName(id: string) {
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
        catch (Error)
        {
            BlisDebug.Log(Error);
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
                    BlisDebug.Log(`Missing entity name: ${id}`);
                }        
            }
        }
        catch (Error)
        {
            BlisDebug.Log(Error);
        }
        return names;
    }

    public Remember(key: string, value: string) {
        try {
            this.userState[UserStates.MEMORY][key] = value;
        }
        catch (Error)
        {
            BlisDebug.Log(Error);
        }
    }  

    // Return array of entityIds for which I've remembered something
    public RememberedIds() : string[]
    {
        return Object.keys(this.userState[UserStates.MEMORY]);
    }

    public Forget(key: string) {
        try {
            this.userState[UserStates.MEMORY].delete[key];
        }
        catch (Error)
        {
             BlisDebug.Log(Error);
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

                // Get entityId for the key
                let entityId = this.EntityId(entityName);
                let entityValue = this.userState[UserStates.MEMORY][entityId];
                if (entityValue) {
                    text = text.replace(word, entityValue);
                }
            }
        }
        return text;
    }

    public SetLastInput(input: string) : void {
        this.userState[UserStates.LASTINPUT] = input;
    }

    public GetLastInput() : string {
        return this.userState[UserStates.LASTINPUT];
    }

    //--------------------------------------------------------
    public SaveTrainStep(saveStep: string, value: string) : void {
        if (!this.userState[UserStates.TRAINSTEPS]) {
            this.userState[UserStates.TRAINSTEPS] = [];
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
            else
            {
                console.log(`Unknown SaveStep value ${saveStep}`);
            }
        }
        
    }

    public GetTrainSteps() : TrainStep[] {
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
            let entityName = this.EntityName(entityId);
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
        text += `Memory: {${this.DumpEntities()}}\n\n`;
        text += `EntityLookup: ${JSON.stringify(this.userState[UserStates.ENTITYLOOKUP])}\n\n`;
        return text;
    }
}