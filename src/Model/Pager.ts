import * as builder from 'botbuilder'
import { BlisMemory } from '../BlisMemory';
import { Serializable } from './Serializable';
import { JsonProperty } from 'json-typescript-mapper';
import { BlisContext } from '../BlisContext';

// For keeping track of paging UI elements
export class Pager extends Serializable {

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

    public static async Init(context : BlisContext, search : string) : Promise<void> {
        let page = new Pager({index : 0, numPages: 0, search: search});
        await context.Memory().SetPager(page);
    }

    public static async Index(context : BlisContext) : Promise<number> {
        let page = await context.Memory().Pager();
        return page.index;
    }

    /** Update the length */
    public static async SetLength(context : BlisContext, length : number) : Promise<Pager> {
        let page = await context.Memory().Pager();
        page.length = length;

        // Make sure still in bounds (i.e. handle deleted items in list)
        if (page.index > page.length-1)
        {
            page.index = page.length-1;
        }
        return page;
    }

    public static async SearchTerm(context : BlisContext) : Promise<string> {
        let page = await context.Memory().Pager();
        return page.search;
    }

    public static async Next(context : BlisContext) : Promise<Pager> {
        let page = await context.Memory().Pager();
        page.index++;

        // Loop if at end
        if (page.index > page.length-1)
        {
            page.index = 0;
        }
        return page;
    }

    public static async Prev(context : BlisContext) : Promise<Pager> {
        let page = await context.Memory().Pager();
        page.index--;

        // Loop if at start
        if (page.index < 0)
        {
            page.index = page.length-1;
        }
        return page;
    }
}