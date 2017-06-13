import { Serializable } from './Serializable';
import { JsonProperty } from 'json-typescript-mapper';
import { BlisMemory } from '../BlisMemory';

export class CueCommand extends Serializable {

    private static MEMKEY = "CUECOMMAND";
    public static memory : BlisMemory;

    @JsonProperty('commandName')  
    public commandName : string;

    @JsonProperty('args')  
    public args : string;

    public constructor(init?:Partial<CueCommand>)
    {
        super();
        this.commandName = undefined;
        this.args = undefined;
        (<any>Object).assign(this, init);
    }

    public static async Set(cueCommand : CueCommand) : Promise<void> {
        if (cueCommand)
        {
            await this.memory.SetAsync(this.MEMKEY, cueCommand.Serialize());
        }
        else
        {
            await this.memory.DeleteAsync(this.MEMKEY);
        }
    }

    public static async Get() : Promise<CueCommand> {
        let value = await this.memory.GetAsync(this.MEMKEY);
        return CueCommand.Deserialize(CueCommand, value);   
    }

    private static async Clear() : Promise<void>
    {
        await this.Set(null);
    }
}