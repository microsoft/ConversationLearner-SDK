import { BlisClient } from '../BlisClient';
import { EntityBase, EntityMetaData } from 'blis-models';

export class Entity extends EntityBase {

    /** Return negative entity if it exists */
    private async GetNegativeEntity(appId : string) : Promise<Entity>
    {
        if (this.metadata && this.metadata.negativeId)
        {
            return await BlisClient.client.GetEntity(appId, this.metadata.negativeId, null);
        }
        return null;
    }

    public Description() : string
    {
        return Entity.Description(this.entityType, this.metadata);
    }

    public static Description(entityType : string, metadata : EntityMetaData) : string
    {
        let description = `${entityType}${metadata.isBucket ? " (bucket)" : ""}`;
        description += `${metadata.negativeId ? " (negatable)" : ""}`;
        description += `${metadata.positiveId ? " (delete)" : ""}`;
        return description;
    }

    public static Sort(entities : Entity[]) : Entity[]
    {
        return entities.sort((n1, n2) => {
            let c1 = n1.entityName.toLowerCase();
            let c2 = n2.entityName.toLowerCase();
            if (c1 > c2) {
                return 1;
            }
            if (c1 < c2){
                return -1;
            }
            return 0;
        });
    }
}