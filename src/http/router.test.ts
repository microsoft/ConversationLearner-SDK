/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as supertest from 'supertest'
import * as express from 'express'
import router from './router'
import { ICLClientOptions, CLClient } from '../CLClient'

describe('Test SDK router', () => {
    const options: ICLClientOptions = {
        CONVERSATION_LEARNER_SERVICE_URI: 'https://jsonplaceholder.typicode.com',
        APIM_SUBSCRIPTION_KEY: undefined,
        LUIS_AUTHORING_KEY: undefined
    }
    const clClient = new CLClient(options)
    const sdkRouter = router(clClient, options)
    const app = express()
    app.use(sdkRouter)

    let server: supertest.SuperTest<supertest.Test> = null!

    beforeAll(() => {
        server = supertest(app)
    })

    it('given request to known (sdk) route should return 200', async () => {
        const response = await server.get('/')
        expect(response.status).toBe(200)
    })

    it('given request to unknown route should be forwarded to proxy address', async () => {
        const response = await server.get('/posts/1')
        expect(response.status).toBe(200)
        expect(response.body.userId).toBe(1)
    })
})
