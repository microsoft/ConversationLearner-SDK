import * as BB from 'botbuilder'
import { Blis } from './Blis'
import { BlisIntent } from './BlisIntent'
import { ActionTypes, CardAction, TextAction, ApiAction } from 'blis-models'
import { addEntitiesById } from './Utils'

export class BlisTemplateRenderer implements BB.TemplateRenderer {
    public async renderTemplate(
        botContext: BotContext,
        language: string,
        templateId: string,
        blisIntent: BlisIntent
    ): Promise<Partial<BB.Activity> | string | undefined> {
        // Get filled entities from memory
        let filledEntityMap = await blisIntent.memory.BotMemory.FilledEntityMap()
        filledEntityMap = addEntitiesById(filledEntityMap)

        let message = null
        switch (blisIntent.scoredAction.actionType) {
            case ActionTypes.TEXT:
                // This is hack to allow ScoredAction to be accepted as ActionBase
                // TODO: Remove extra properties from ScoredAction so it only had actionId and up service to return actions definitions of scored/unscored actions
                // so UI can link the two together instead of having "partial" actions being incorrectly treated as full actions
                const textAction = new TextAction(blisIntent.scoredAction as any)
                message = await Blis.TakeTextAction(textAction, filledEntityMap)
                break
            /* TODO
            case ActionTypes.API_AZURE:
                message = await Blis.TakeAzureAPIAction(blisIntent.scoredAction, blisIntent.memory, blisIntent.blisEntities);
                break;
            */
            case ActionTypes.API_LOCAL:
                const apiAction = new ApiAction(blisIntent.scoredAction as any)
                message = await Blis.TakeLocalAPIAction(
                    apiAction,
                    filledEntityMap,
                    blisIntent.memory,
                    blisIntent.blisEntities
                )
                break
            case ActionTypes.CARD:
                const cardAction = new CardAction(blisIntent.scoredAction as any)
                message = await Blis.TakeCardAction(cardAction, filledEntityMap)
                break
        }

        // If action wasn't terminal loop through BLIS again after a short delay
        if (!blisIntent.scoredAction.isTerminal) {
            setTimeout(async () => {
                let app = await blisIntent.memory.BotState.AppAsync()
                if (!app) {
                    throw new Error(`Attempted to get current app before app was set.`)
                }

                const user = botContext.conversationReference.user
                if(!user || !user.id) {
                    throw new Error(`Attempted to get session by user id, but user was not defined on current conversation`)
                }

                let sessionId = await blisIntent.memory.BotState.SessionIdAsync(user.id)
                if (!sessionId) {
                    throw new Error(`Attempted to get session by user id: ${user.id} but session was not found`)
                }

                let bestAction = await Blis.recognizer.Score(
                    app.appId,
                    sessionId,
                    blisIntent.memory,
                    '',
                    [],
                    blisIntent.blisEntities,
                    blisIntent.inTeach
                )

                // If not inTeach, send message to user
                if (!blisIntent.inTeach) {
                    blisIntent.scoredAction = bestAction
                    let message = await this.renderTemplate(botContext, language, bestAction.actionId, blisIntent)
                    if (message === undefined) {
                        throw new Error(`Attempted to send message, but resulting message was undefined`)
                    }

                    Blis.SendMessage(blisIntent.memory, message)
                }
            }, 100)
        }
        return message ? message : ' '
    }
}
