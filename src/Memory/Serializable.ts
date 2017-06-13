import { deserialize, serialize } from 'json-typescript-mapper';

export abstract class Serializable {
    
    public constructor(init?:Partial<Serializable>)
    {
        (<any>Object).assign(this, init);
    }
    
    public Serialize() : string
    {
        return JSON.stringify(serialize(this));
    }

    public static Deserialize<T>(type : {new() : T }, text : string) : T
    {
        if (!text) return null;
        let json = JSON.parse(text);
        return deserialize(type, json);
    }
}