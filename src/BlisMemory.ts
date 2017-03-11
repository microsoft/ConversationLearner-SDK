import { BlisUserState} from './BlisUserState';
import { UserStates } from './Model/Consts';
import { BlisDebug} from './BlisDebug';

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
        let words = text.split(/[\s,:.]+/);
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