import * as builder from 'botbuilder';
import { BlisClient_v1 } from './BlisClient';
import { BlisMemory } from './BlisMemory'

export class BlisContext
{ 
    public session : builder.Session;
    public bot : builder.UniversalBot;
    private memory : BlisMemory;

    constructor(bot : builder.UniversalBot, session : builder.Session) {
        this.bot = bot;
        this.session = session;
        this.memory = BlisMemory.InitMemory(session);
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