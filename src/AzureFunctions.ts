/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as Request from 'request'
import { CLDebug } from './CLDebug'

export class AzureFunctions {
    public static Call(azureFunctionsUrl: string, azureFunctionsKey: string, funcName: string, args: string): Promise<string> {
        let apiPath = 'app'

        if (azureFunctionsKey) {
            if (args) {
                args += `&code=${azureFunctionsKey}`
            } else {
                args = `?code=${azureFunctionsKey}`
            }
        }
        return new Promise((resolve, reject) => {
            const requestData = {
                url: azureFunctionsUrl + funcName + '/' + args,
                /*          TODO - auth          
                    headers: {
                        'Cookie' : this.credentials.Cookiestring(),
                    },*/
                /* TODO - params
                    body: {
                        name: name,
                        LuisAuthKey: luisKey
                    },
                    */
                json: true
            }
            CLDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(body)
                } else {
                    resolve(body.Result)
                }
            })
        })
    }
}
