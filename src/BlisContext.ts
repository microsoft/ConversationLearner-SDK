import * as builder from 'botbuilder';
import { BlisMemory } from './BlisMemory'

export class BlisContext
{ 
    public session : builder.Session;
    public bot : builder.UniversalBot;
    private memory : BlisMemory;

    private constructor(bot : builder.UniversalBot, session : builder.Session) {
        this.bot = bot;
        this.session = session;
    }

    public static async CreateAsync(bot : builder.UniversalBot, session : builder.Session) {
        let context = new BlisContext(bot, session);
        context.memory = await BlisMemory.InitMemory(context.session);
        return context;
    }

    public Address() : builder.IAddress
    { 
        return this.session.message.address;
    }

    public Memory() : BlisMemory
    { 
        return this.memory;
    }
}