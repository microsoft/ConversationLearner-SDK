import * as BB from 'botbuilder-core';
import { BlisMemory } from './BlisMemory'

export class BlisContext
{ 
    public botContext : BotContext;
    private memory : BlisMemory;

    private constructor(botContext : BotContext) {
        this.botContext = botContext;
    }

    public static async CreateAsync(bot : BB.Bot, botContext : BotContext) {
        let context = new BlisContext(botContext);
        context.memory = await BlisMemory.InitMemory(botContext);
        return context;
    }

    public Address() : BB.ChannelAccount
    { 
        return this.botContext.request.from;//TODOOLD.message.address;
    }

    public Memory() : BlisMemory
    { 
        return this.memory;
    }
}