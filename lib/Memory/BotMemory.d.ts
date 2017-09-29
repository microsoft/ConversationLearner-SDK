import { BlisMemory } from '../BlisMemory';
import { Memory, PredictedEntity } from 'blis-models';
import * as builder from 'botbuilder';
export declare const ActionCommand: {
    SUBSTITUTE: string;
    NEGATIVE: string;
};
export declare class EntityMemory {
    id: string;
    value: string;
    bucket: string[];
    constructor(id: string, value?: string, bucket?: string[]);
}
export declare class BotMemory {
    private static _instance;
    private static MEMKEY;
    private memory;
    entityMap: {
        [key: string]: EntityMemory;
    };
    private constructor();
    static Get(blisMemory: BlisMemory): BotMemory;
    private Init();
    Serialize(): string;
    private Deserialize(text);
    private Set();
    Clear(): Promise<void>;
    /** Remember a predicted entity */
    RememberEntity(predictedEntity: PredictedEntity): Promise<void>;
    Remember(entityName: string, entityId: string, entityValue: string, isBucket?: boolean): Promise<void>;
    /** Return array of entity names for which I've remembered something */
    RememberedNames(): Promise<string[]>;
    /** Return array of entity Ids for which I've remembered something */
    RememberedIds(): Promise<string[]>;
    /** Given negative entity name, return positive version **/
    private PositiveName(negativeName);
    /** Forget a predicted Entity */
    ForgetEntity(predictedEntity: PredictedEntity): Promise<void>;
    /** Forget an entity value */
    Forget(entityName: string, entityValue?: string, isBucket?: boolean): Promise<void>;
    DumpMemory(): Promise<Memory[]>;
    Value(entityName: string): Promise<string>;
    ValueAsList(entityName: string): Promise<string[]>;
    private EntityValueAsList(entityName);
    private EntityValueAsString(entityName);
    GetEntities(text: string): Promise<builder.IEntity[]>;
    SubstituteEntities(text: string): Promise<string>;
    /** Extract contigent phrases (i.e. [,$name]) */
    private SubstituteBrackets(text);
    Split(action: string): string[];
    Substitute(text: string): Promise<string>;
}
