import * as BB from 'botbuilder'
import { Blis } from './Blis'
import { BlisIntent } from './BlisIntent'
import { ActionTypes, FilledEntityMap } from 'blis-models'

const addEntitiesById = (valuesByName: FilledEntityMap): FilledEntityMap => {
    const valuesById = convertToMapById(valuesByName)
    const map = {
        ...valuesByName.map,
        ...valuesById.map
    }
    
    return new FilledEntityMap({ map })
}

const convertToMapById = (entityMap: FilledEntityMap): FilledEntityMap => {
    const map = Object.keys(entityMap.map).reduce((newMap, key) => {
        const filledEntity = entityMap.map[key]
        if (!filledEntity.entityId) {
            throw new Error(`Cannot convert filledEntityMap by name to filledEntityMap by id because id does not exist for entity: ${key}`)
        }

        newMap[filledEntity.entityId] = filledEntity

        return newMap
    }, {})

    return new FilledEntityMap({ map })
}

export class BlisTemplateRenderer implements BB.TemplateRenderer {
    public async renderTemplate(
        botContext: BotContext,
        language: string,
        templateId: string,
        blisIntent: BlisIntent
    ): Promise<Partial<BB.Activity> | string | undefined> {
        // Get filled entities from memory
        let filledEntityMap = await blisIntent.memory.BotMemory.FilledEntityMap()
        const betterFilledEntityMap = addEntitiesById(filledEntityMap)

        let message = null
        switch (blisIntent.scoredAction.actionType) {
            case ActionTypes.TEXT:
                message = await Blis.TakeTextAction(blisIntent.scoredAction, betterFilledEntityMap)
                break
            /* TODO
            case ActionTypes.API_AZURE:
                message = await Blis.TakeAzureAPIAction(blisIntent.scoredAction, blisIntent.memory, blisIntent.blisEntities);
                break;
            */
            case ActionTypes.API_LOCAL:
                message = await Blis.TakeLocalAPIAction(
                    blisIntent.scoredAction,
                    betterFilledEntityMap,
                    blisIntent.memory,
                    blisIntent.blisEntities
                )
                break
            case ActionTypes.CARD:
                message = await Blis.TakeCardAction(blisIntent.scoredAction, betterFilledEntityMap)
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
