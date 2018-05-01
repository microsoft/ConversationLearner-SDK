/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as BB from 'botbuilder'
import * as request from 'request'
import { TrainExtractorStep, TrainDialog, FilledEntityMap } from '@conversationlearner/models'

export class Utils {
    public static SendTyping(adapter: BB.BotAdapter, address: any) {
        /* TODO
        let msg = <builder.IMessage>{ type: 'typing'};
        msg.address = address;
        bot.post(msg);
        */
    }

    // TEMP: Until we re-jigger object types.  Need to be stripped
    public static StripPrebuiltInfoFromTrain(trainDialog: TrainDialog): TrainDialog {
        return {
            trainDialogId: trainDialog.trainDialogId,
            sourceLogDialogId: trainDialog.sourceLogDialogId,
            version: trainDialog.version,
            packageCreationId: trainDialog.packageCreationId,
            packageDeletionId: trainDialog.packageDeletionId,
            rounds: trainDialog.rounds.map(r => ({
                scorerSteps: r.scorerSteps,
                extractorStep: this.StripPrebuiltInfo(r.extractorStep)
            }))
        }
    }

    // TEMP: Until we re-jigger object types.  Need to be stripped
    public static StripPrebuiltInfo(trainExtractorStep: TrainExtractorStep): TrainExtractorStep {
        return {
            textVariations: trainExtractorStep.textVariations.map(tv => ({
                text: tv.text,
                labelEntities: tv.labelEntities.map(le => {
                    let nle = { ...le }
                    delete nle.builtinType
                    delete nle.resolution
                    return nle
                })
            }))
        }
    }

    /** Trick to get errors to render on Azure */
    private static ReplaceErrors(key: any, value: any) {
        if (value instanceof Error) {
            const error = {}

            Object.getOwnPropertyNames(value).forEach(k => {
                error[k] = value[k]
            })

            return error
        }

        return value
    }

    /** Handle that catch clauses can be any type */
    public static ErrorString(error: any, context: string = ''): string {
        let prefix = context ? `${context}: ` : ''
        try {
            if (!error) {
                return prefix + 'Unknown'
            } else if (!error.body) {
                if (typeof error == 'string') {
                    return prefix + error
                } else {
                    return prefix + JSON.stringify(error, this.ReplaceErrors)
                }
            } else if (error.body.message) {
                return prefix + error.body.message
            } else if (error.body.errorMessages) {
                return prefix + error.body.errorMessages.join()
            } else if (typeof error.body == 'string') {
                return prefix + error.body
            } else {
                return prefix + JSON.stringify(error.body)
            }
        } catch (e) {
            return prefix + `Error Parsing Failed` //: ${Object.prototype.toString.call(e)} ${JSON.stringify(e)}`;
        }
    }

    public static ReadFromFile(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const requestData = {
                url: url,
                json: true,
                encoding: 'utf8'
            }
            request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(body.message)
                } else {
                    let model = String.fromCharCode.apply(null, body.data)
                    resolve(model)
                }
            })
        })
    }

    public static PrebuiltDisplayText(prebuiltType: string, resolution: any, entityText: string): string {
        if (prebuiltType.startsWith('builtin.encyclopedia')) {
            return entityText
        }

        switch (prebuiltType) {
            case 'builtin.datetimeV2.date':
                let date = resolution.values[0].value
                if (resolution.values[1]) {
                    date += ` or ${resolution.values[1].value}`
                }
                return date
            case 'builtin.datetimeV2.time':
                let time = resolution.values[0].value
                if (resolution.values[1]) {
                    time += ` or ${resolution.values[1].value}`
                }
                return time
            case 'builtin.datetimeV2.daterange':
                return `${resolution.values[0].start} to ${resolution.values[0].end}`
            case 'builtin.datetimeV2.timerange':
                return `${resolution.values[0].start} to ${resolution.values[0].end}`
            case 'builtin.datetimeV2.datetimerange':
                return `${resolution.values[0].start} to ${resolution.values[0].end}`
            case 'builtin.datetimeV2.duration':
                return `${resolution.values[0].value} seconds`
            case 'builtin.datetimeV2.set':
                return `${resolution.values[0].value}`
            case 'builtin.number':
                return resolution.value
            case 'builtin.ordinal':
                return resolution.value
            case 'builtin.temperature':
                return resolution.value
            case 'builtin.dimension':
                return resolution.value
            case 'builtin.money':
                return resolution.value
            case 'builtin.age':
                return resolution.value
            case 'builtin.percentage':
                return resolution.value
            case 'builtin.geography.city':
                return resolution.value
            case 'builtin.geography.country':
                return resolution.value
            case 'builtin.geography.pointOfInterest':
                return resolution.value
            case 'builtin.encyclopedia':
                return entityText
            default:
                return entityText
        }
    }
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

export const addEntitiesById = (valuesByName: FilledEntityMap): FilledEntityMap => {
    const valuesById = convertToMapById(valuesByName)
    const map = {
        ...valuesByName.map,
        ...valuesById.map
    }
    
    return new FilledEntityMap({ map })
}

export function replace<T>(xs: T[], updatedX: T, getId: (x: T) => any): T[] {
    const index = xs.findIndex(x => getId(x) === getId(updatedX))
    if (index < 0) {
        throw new Error(`You attempted to replace item in list with id: ${getId(updatedX)} but no item could be found.  Perhaps you meant to add the item to the list or it was already removed.`)
    }

    return [...xs.slice(0, index), updatedX, ...xs.slice(index + 1)]
}


export function generateGUID(): string {
    let d = new Date().getTime()
    let guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
        let r = ((d + Math.random() * 16) % 16) | 0
        d = Math.floor(d / 16)
        return (char == 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
    return guid
}

export const CL_DEVELOPER = 'ConversationLearnerDeveloper';
export const DEFAULT_MAX_SESSION_LENGTH = 20 * 60 * 1000;  // 20 minutes


