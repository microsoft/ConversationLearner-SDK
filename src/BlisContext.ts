import * as BB from 'botbuilder'
import { BlisMemory } from './BlisMemory'

export class BlisContext {
    public botContext: BotContext
    private memory: BlisMemory

    private constructor(botContext: BotContext) {
        this.botContext = botContext
    }

    public static async CreateAsync(bot: BB.Bot, botContext: BotContext) {
        let context = new BlisContext(botContext)
        context.memory = await BlisMemory.InitMemory(botContext)
        return context
    }

    public Address(): BB.ChannelAccount | undefined {
        return this.botContext.request.from
    }

    public Memory(): BlisMemory {
        return this.memory
    }
}
