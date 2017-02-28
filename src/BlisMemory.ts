import { BlisUserState} from './BlisUserState';
import { UserStates } from './Model/Consts';
import { BlisDebug} from './BlisDebug';

export class BlisMemory {

    constructor(private userState : BlisUserState){
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
        let words = text.split(/[\s,:]+/);
        for (let word of words) 
        {
            if (word.startsWith("$"))
            {
                let key = word.substr(1, word.length-1);
                let value = this.userState[UserStates.MEMORY][key];
                if (value) {
                    text = text.replace(word, value);
                }
            }
        }
        return text;
    }
}