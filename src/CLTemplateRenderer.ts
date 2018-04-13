import * as BB from 'botbuilder'
import { ConversationLearner } from './ConversationLearner'
import { CLIntent } from './CLIntent'
import { ActionTypes, CardAction, TextAction, ApiAction } from 'conversationlearner-models'
import { addEntitiesById } from './Utils'

export class CLTemplateRenderer implements BB.TemplateRenderer {
    public async renderTemplate(
        botContext: BotContext,
        language: string,
        templateId: string,
        clIntent: CLIntent
    ): Promise<Partial<BB.Activity> | string | undefined> {
        // Get filled entities from memory
        let filledEntityMap = await clIntent.memory.BotMemory.FilledEntityMap()
        filledEntityMap = addEntitiesById(filledEntityMap)

        let message = null
        switch (clIntent.scoredAction.actionType) {
            case ActionTypes.TEXT:
                // This is hack to allow ScoredAction to be accepted as ActionBase
                // TODO: Remove extra properties from ScoredAction so it only had actionId and up service to return actions definitions of scored/unscored actions
                // so UI can link the two together instead of having "partial" actions being incorrectly treated as full actions
                const textAction = new TextAction(clIntent.scoredAction as any)
                message = await ConversationLearner.TakeTextAction(textAction, filledEntityMap)
                break
            /* TODO
            case ActionTypes.API_AZURE:
                message = await ConversationLearner.TakeAzureAPIAction(clIntent.scoredAction, clIntent.memory, clIntent.clEntities);
                break;
            */
            case ActionTypes.API_LOCAL:
                const apiAction = new ApiAction(clIntent.scoredAction as any)
                message = await ConversationLearner.TakeLocalAPIAction(
                    apiAction,
                    filledEntityMap,
                    clIntent.memory,
                    clIntent.clEntities
                )
                break
            case ActionTypes.CARD:
                const cardAction = new CardAction(clIntent.scoredAction as any)
                message = await ConversationLearner.TakeCardAction(cardAction, filledEntityMap)
                break
        }

        // If action wasn't terminal loop, through Conversation Learner again after a short delay
        if (!clIntent.scoredAction.isTerminal) {
            setTimeout(async () => {
                let app = await clIntent.memory.BotState.AppAsync()
                if (!app) {
                    throw new Error(`Attempted to get current app before app was set.`)
                }

                const user = botContext.conversationReference.user
                if(!user || !user.id) {
                    throw new Error(`Attempted to get session by user id, but user was not defined on current conversation`)
                }

                let sessionId = await clIntent.memory.BotState.SessionIdAsync(user.id)
                if (!sessionId) {
                    throw new Error(`Attempted to get session by user id: ${user.id} but session was not found`)
                }

                let bestAction = await ConversationLearner.recognizer.Score(
                    app.appId,
                    sessionId,
                    clIntent.memory,
                    '',
                    [],
                    clIntent.clEntities,
                    clIntent.inTeach
                )

                // If not inTeach, send message to user
                if (!clIntent.inTeach) {
                    clIntent.scoredAction = bestAction
                    let message = await this.renderTemplate(botContext, language, bestAction.actionId, clIntent)
                    if (message === undefined) {
                        throw new Error(`Attempted to send message, but resulting message was undefined`)
                    }

                    ConversationLearner.SendMessage(clIntent.memory, message)
                }
            }, 100)
        }
        return message ? message : ' '
    }
}
