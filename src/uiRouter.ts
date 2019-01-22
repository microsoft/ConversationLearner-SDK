/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as express from 'express'
import * as clUI from '@conversationlearner/ui'

// console.log(`@conversationlearner/ui directory path: `, clUI.directoryPath)
// console.log(`@conversationlearner/ui default file path: `, clUI.defaultFilePath)

const router = express.Router({ caseSensitive: false })
router.use('/ui', express.static(clUI.directoryPath));
router.get('/ui/*', (_, res) => {
    res.sendFile(clUI.defaultFilePath)
})

export default router
