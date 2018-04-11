import * as BB from 'botbuilder'
import { BlisMemory } from './BlisMemory'

export class BlisContext {
    public botContext: BotContext
    public userAddress: BB.ChannelAccount
    private memory: BlisMemory

    private constructor(userAddress: BB.ChannelAccount) {
        this.userAddress = userAddress
    }

    public static async CreateAsync(bot: BB.Bot, userAddress: BB.ChannelAccount, conversationReference: BB.ConversationReference) {
        let context = new BlisContext(userAddress)
        context.memory = await BlisMemory.InitMemory(userAddress, conversationReference)
        return context
    }

    public Address(): BB.ChannelAccount | undefined {
        return this.userAddress
    }

    public Memory(): BlisMemory {
        return this.memory
    }
}
