import { BlisMemory } from '../BlisMemory';
import { EntityBase } from 'blis-models';
export declare class ClientMemoryManager {
    blisMemory: BlisMemory;
    private entities;
    constructor(memory: BlisMemory, entities: EntityBase[]);
    FindEntity(entityName: string): EntityBase;
    RememberEntity(entityName: string, value: string): Promise<void>;
    ForgetEntity(entityName: string, value?: string): Promise<void>;
    EntityValue(entityName: string): Promise<string>;
    EntityValueAsList(entityName: string): Promise<string[]>;
    GetFilledEntities(): Promise<string[]>;
    AppName(): Promise<string>;
}
