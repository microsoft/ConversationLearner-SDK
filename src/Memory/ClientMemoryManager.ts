import { BlisMemory } from '../BlisMemory';
import { BotMemory } from './BotMemory';
import { EntityBase } from 'blis-models'

export class ClientMemoryManager {

    public blisMemory : BlisMemory = null;
    private entities : EntityBase[] = null;

    public constructor(memory : BlisMemory, entities : EntityBase[])
    {
        this.entities = entities;
        this.blisMemory = memory;
    }

    public FindEntity(entityName : string) : EntityBase {
        let match = this.entities.find(e => e.entityName == entityName);
        return match;
    }

    public async RememberEntity(entityName : string, value : string) : Promise<void> {

        let entity = this.FindEntity(entityName);

        if (!entity) {
            // TODO Log error to console
            return null;
        }
        
        let isBucket = entity.metadata ? entity.metadata.isBucket : false;
        await this.blisMemory.BotMemory().Remember(entity.entityName, entity.entityId, value, isBucket);
    }

    public async ForgetEntity(entityName : string, value : string = null) : Promise<void> {
        
        let entity = this.FindEntity(entityName);

        if (!entity) {
            // TODO Log error to console
            return null;
        }
        
        let isBucket = entity.metadata ? entity.metadata.isBucket : false;
        await this.blisMemory.BotMemory().Forget(entity.entityName, value, isBucket);
    }

    public async EntityValue(entityName : string) : Promise<string> 
    {
        return await this.blisMemory.BotMemory().Value(entityName);
    }

    public async GetFilledEntities() : Promise<string[]> {
        return await this.blisMemory.BotMemory().RememberedIds();
    }
}    