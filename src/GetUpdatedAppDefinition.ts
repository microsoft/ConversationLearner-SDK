/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as models from '@conversationlearner/models'

interface IChangeResult<T> {
    isChanged: boolean
    value: T
    changes: string[]
}

/**
 * Given an app definition return an updated app definition.
 * If no updates are performed, return undefined.
 */
export default function (appDefinition: models.AppDefinition): models.AppDefinition | undefined {
    const isChanged = false
    const updatedAppDefinition = { ...appDefinition }

    const actionsChangeResult = updatedAppDefinition.actions.reduce<IChangeResult<models.ActionBase[]>>((changeResult, action) => {
        if (action.actionType === models.ActionTypes.API_LOCAL) {
            let actionPayload: models.ActionPayload
            const untypedActionPayload: any = JSON.parse(action.payload)
            if (Array.isArray(untypedActionPayload.arguments)) {
                const legacyActionPayload: models.ActionPayloadSingleArguments = untypedActionPayload
                actionPayload = {
                    payload: legacyActionPayload.payload,
                    logicArguments: legacyActionPayload.arguments,
                    renderArguments: []
                }
            } else {
                actionPayload = untypedActionPayload
            }

            return changeResult
        }

        // If we got here, assume no upgrade was performed. Add the action and continue
        changeResult.value.push(action)
        return changeResult
    }, {
        isChanged: false,
        value: []
    })

    return isChanged
        ? updatedAppDefinition
        : undefined
}