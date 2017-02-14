
export class EntityRequest
{
    public Name : string;
    public EntityType : string;
    public PrebuiltEntityName : string;

    constructor(name : string, entityType : string, prebuiltEntityName : string)
    {
        this.Name = name;
        this.EntityType = entityType;
        this.PrebuiltEntityName = prebuiltEntityName;
    }
}
