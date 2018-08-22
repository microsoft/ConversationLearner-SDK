/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as models from '@conversationlearner/models'
import { CallbackMap } from './CLRunner'

/**
 * Given an app definition return an updated app definition.
 * If no updates are performed, return undefined.
 */
export default function (appDefinition: models.AppDefinition, callbackMap: CallbackMap): models.AppDefinitionChange {
    let isChanged = false
    const appDefinitionChanges: models.AppDefinitionChanges = {
        actions: appDefinition.actions.map<models.IChangeResult<models.ActionBase>>(a => getActionChangeResult(a, callbackMap)),
        entities: appDefinition.entities.map(getDefaultChangeResult),
        trainDialogs: appDefinition.trainDialogs.map(getDefaultChangeResult)
    }

    const actionsChanged = appDefinitionChanges.actions.some(cr => cr.isChanged)
    isChanged = isChanged || actionsChanged

    return isChanged
        ? {
            isChanged: true,
            currentAppDefinition: appDefinition,
            updatedAppDefinition: {
                actions: appDefinitionChanges.actions.map(cr => cr.value),
                entities: appDefinitionChanges.entities.map(cr => cr.value),
                trainDialogs: appDefinitionChanges.trainDialogs.map(cr => cr.value)
            },
            appDefinitionChanges
        }
        : {
            isChanged: false,
            currentAppDefinition: appDefinition
        }
}

export function getDefaultChangeResult<T> (value: T): models.IChangeResult<T> {
    return {
        isChanged: false,
        value,
        changes: []
    }
}

export function getActionChangeResult (action: models.ActionBase, callbackMap: CallbackMap): models.IChangeResult<models.ActionBase> {
    // By default no update is performed
    const changeResult: models.IChangeResult<models.ActionBase> = {
        isChanged: false,
        value: action,
        changes: []
    }

    if (action.actionType === models.ActionTypes.API_LOCAL) {
        const untypedActionPayload: any = JSON.parse(action.payload)
        if (Array.isArray(untypedActionPayload.arguments)) {
            const legacyActionPayload: models.ActionPayloadSingleArguments = untypedActionPayload
            const callback = callbackMap[legacyActionPayload.payload]

            const actionPayload: models.ActionPayload = callback
                ? getActionPayload(legacyActionPayload, callback)
                : {
                    payload: legacyActionPayload.payload,
                    logicArguments: legacyActionPayload.arguments,
                    renderArguments: []
                }

            const updatedAction = {
                ...action,
                payload: JSON.stringify(actionPayload)
            }

            changeResult.isChanged = true
            changeResult.value = updatedAction
            changeResult.changes.push(`Payload with old format using single array of arguments was updated to use the new form with separate logic and render arguments.`)
        }
    }

    return changeResult
}

export function getActionPayload(legacyActionPayload: models.ActionPayloadSingleArguments, callback: models.Callback): models.ActionPayload {
    return legacyActionPayload.arguments.reduce<models.ActionPayload>((actionPayload, argument) => {
        const isMovedToLogicArgument = callback.logicArguments.some(la => la === argument.parameter)
        if (isMovedToLogicArgument) {
            actionPayload.logicArguments.push(argument)
        }

        const isMovedToRenderArgument = callback.renderArguments.some(la => la === argument.parameter)
        if (isMovedToRenderArgument) {
            actionPayload.renderArguments.push(argument)
        }

        return actionPayload
    }, {
        payload: legacyActionPayload.payload,
        logicArguments: [],
        renderArguments: []
    })
}
