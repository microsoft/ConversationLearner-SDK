/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as BB from 'botbuilder'
import * as request from 'request'
import * as semver from 'semver'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as crypto from 'crypto'
import * as CLM from '@conversationlearner/models'

export class Utils {
    public static SendTyping(adapter: BB.BotAdapter, address: any) {
        /* TODO
        let msg = <builder.IMessage>{ type: 'typing'};
        msg.address = address;
        bot.post(msg);
        */
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
            }
            // Special message for 403 as it's like a bad ModelId
            else if (error.statusCode === 403) {
                return `403 Forbidden:  Please check you have set a valid CONVERSATION_LEARNER_MODEL_ID`
            }
            else if (!error.body) {
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
}

const convertToMapById = (entityMap: CLM.FilledEntityMap): CLM.FilledEntityMap => {
    const map = Object.keys(entityMap.map).reduce((newMap, key) => {
        const filledEntity = entityMap.map[key]
        if (!filledEntity.entityId) {
            throw new Error(`Cannot convert filledEntityMap by name to filledEntityMap by id because id does not exist for entity: ${key}`)
        }

        newMap[filledEntity.entityId] = filledEntity

        return newMap
    }, {})

    return new CLM.FilledEntityMap({ map })
}

export const addEntitiesById = (valuesByName: CLM.FilledEntityMap): CLM.FilledEntityMap => {
    const valuesById = convertToMapById(valuesByName)
    const map = {
        ...valuesByName.map,
        ...valuesById.map
    }

    return new CLM.FilledEntityMap({ map })
}

export function replace<T>(xs: T[], updatedX: T, getId: (x: T) => any): T[] {
    const index = xs.findIndex(x => getId(x) === getId(updatedX))
    if (index < 0) {
        throw new Error(`You attempted to replace item in list with id: ${getId(updatedX)} but no item could be found.  Perhaps you meant to add the item to the list or it was already removed.`)
    }

    return [...xs.slice(0, index), updatedX, ...xs.slice(index + 1)]
}

// Create checksum for determining when bot has changed
export function botChecksum(callbacks: CLM.Callback[], templates: CLM.Template[]): string {
    const source = `${JSON.stringify(callbacks)}${JSON.stringify(templates)}}`
    return crypto.createHash('sha256').update(source).digest('hex')
}

/* Returns true is SDK version in package is less than passed in version */
const packageJsonPath = path.join(__dirname, '..', 'package.json')
export async function isSDKOld(curVersion: string): Promise<boolean> {
    const packageJson = await fs.readJson(packageJsonPath)
    if (packageJson.version === "0.0.0-development") {
        return false
    }
    return semver.lt(packageJson.version, curVersion)
}

export function GetLogicAPIError(logicResult: CLM.LogicResult | undefined): CLM.LogicAPIError | null {
    if (!logicResult) {
        return null
    }
    if (!logicResult.logicValue) {
        return null
    }
    const logicAPIResult = JSON.parse(logicResult.logicValue) as CLM.LogicAPIError
    if (!logicAPIResult || !logicAPIResult.APIError) {
        return null
    }
    return logicAPIResult
}

export const CL_DEVELOPER = 'ConversationLearnerDeveloper';
export const UI_RUNNER_APPID = 'UIRunner_AppId'
export const DEFAULT_MAX_SESSION_LENGTH = 20 * 60 * 1000;  // 20 minutes


