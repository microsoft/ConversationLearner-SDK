export declare abstract class Serializable {
    constructor(init?: Partial<Serializable>);
    Serialize(): string;
    static Deserialize<T>(type: {
        new (): T;
    }, text: string): T;
}
