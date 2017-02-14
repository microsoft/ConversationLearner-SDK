
export class AppRequest
{
    public Name : string;
    public LuisKey : string;

    constructor(name : string, luisKey : string)
    {
        this.Name = name;
        this.LuisKey = luisKey;
    }
}
