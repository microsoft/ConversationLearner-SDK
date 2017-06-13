import * as builder from 'botbuilder'
import { BlisMemory } from '../BlisMemory';
import { Serializable } from './Serializable';
import { JsonProperty } from 'json-typescript-mapper';
import { BlisContext } from '../BlisContext';

// For keeping track of paging UI elements
export class Pager extends Serializable {

    private static MEMKEY = "PAGER";
    public static memory : BlisMemory;

    @JsonProperty('index') 
    public index: number;

    @JsonProperty('numPages') 
    public numPages : number;

    @JsonProperty('search') 
    public search: string;

    @JsonProperty('length') 
    public length: number;

    public constructor(init?:Partial<Pager>)
    {
        super();
        this.index = undefined;
        this.numPages = undefined;
        this.search = undefined;
        this.length = undefined;
        (<any>Object).assign(this, init);
    }

    private static async Get() : Promise<Pager>
    {
        if (!this.memory)
        {
            throw new Error("TrainHistory called without initialzing memory");
        }
 
        let data = await this.memory.GetAsync(this.MEMKEY);
        if (data)
        {
            return Pager.Deserialize(Pager, data);
        } 
        return new Pager();  
    }

    private static async Set(pager : Pager) : Promise<void>
    {
        if (!this.memory)
        {
            throw new Error("Pager called without initialzing memory");
        }
        if (pager)
        {
            await this.memory.SetAsync(this.MEMKEY, pager.Serialize());
        }
        else
        {
            await this.memory.DeleteAsync(this.MEMKEY);
        }
    }

    private static async Clear() : Promise<void>
    {  
        await this.Set(null);
    }

    public static async Init(search : string) : Promise<void> {
        if (!this.memory)
        {
            throw new Error("Pager called without initialzing memory");
        }
        let pager = new Pager({index : 0, numPages: 0, search: search});
        await this.Set(pager);
    }

    public static async Index(context : BlisContext) : Promise<number> {
        let page = await this.Get();
        return page.index;
    }

    /** Update the length */
    public static async SetLength(context : BlisContext, length : number) : Promise<Pager> {
        let pager = await this.Get();
        pager.length = length;

        // Make sure still in bounds (i.e. handle deleted items in list)
        if (pager.index > pager.length-1)
        {
            pager.index = pager.length-1;
        }
        await this.Set(pager);
        return pager;
    }

    public static async SearchTerm(context : BlisContext) : Promise<string> {
        let page = await this.Get();
        return page.search;
    }

    public static async Next(context : BlisContext) : Promise<Pager> {
        let pager = await this.Get();
        pager.index++;

        // Loop if at end
        if (pager.index > pager.length-1)
        {
            pager.index = 0;
        }
        await this.Set(pager);
        return pager;
    }

    public static async Prev(context : BlisContext) : Promise<Pager> {
        let pager = await this.Get();
        pager.index--;

        // Loop if at start
        if (pager.index < 0)
        {
            pager.index = pager.length-1;
        }
        return pager;
    }
}