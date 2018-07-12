# ConversationLearner-SDK

Conversation Learner Software Development Kit

[![Travis](https://travis-ci.org/Microsoft/ConversationLearner-SDK.svg?branch=master)](https://travis-ci.com/Microsoft/ConversationLearner-SDK)
[![CircleCI](https://circleci.com/gh/Microsoft/ConversationLearner-SDK.svg?style=shield)](https://circleci.com/gh/Microsoft/ConversationLearner-SDK)
[![AppVeyor](https://ci.appveyor.com/api/projects/status/github/Microsoft/ConversationLearner-SDK?branch=master&svg=true)](https://ci.appveyor.com/project/conversationlearner/conversationlearner-sdk)

This repo is intended to be consumed by your bot. The SDK contains 3 major components:
1. Administration UI - provides graphical interface to manage, train, and test
2. [Express](https://expressjs.com/en/guide/routing.html) Router - The router is mounted to your server in development and used by the UI (above) during training
3. Recognizer - Similar to other [BotBuilder](https://github.com/Microsoft/botbuilder-js) recognizers like [LUIS](https://github.com/Microsoft/botbuilder-js/blob/master/samples/luis-bot-es6/app.js#L64) the CL recognizer processes the given Bot context and returns results such as messages, adaptive cards, and more.

# Getting started

Install @conversationlearner/sdk in consuming project:

```bash
npm install @conversationlearner/sdk --save-exact
```

> Note: We recommend using --save-exact to lock the version since we are NOT following SemVer at this time. This can help prevent accidental package updates which may contain breaking changes if you are not using package-lock.json. We will move to following SemVer soon as we improve our release process.

Using the recognizer:

```typescript
import { ConversationLearner, ICLOptions, ClientMemoryManager } from '@conversationlearner/sdk'

...

const sdkRouter = ConversationLearner.Init({
    CONVERSATION_LEARNER_SERVICE_URI: process.env.CONVERSATION_LEARNER_SERVICE_URI
})
if (isDevelopment) {
    server.use('/sdk', sdkRouter)
}

...

const cl = new ConversationLearner(modelId);

server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async context => {
        const result = await cl.recognize(context)
        
        if (result) {
            cl.SendResult(result);
        }
    })
})
```

Starting the UI server:

```typescript
import { startUiServer } from '@conversationlearner/sdk'

startUiServer()
```


# Contributing

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Semantic Release

Semantic release works by analyzing all commits that have occurred since the last release, computing the next version to increment based on the most significant commit found, then tagging and publishing a new package with that version.

See: https://semantic-release.gitbooks.io/semantic-release/content/#how-does-it-work

In order to analyze the commit messages reliably they must be in a known format.  To help writing these commits there is a tool at `npm run commit` which acts a wizard walking you through the options.

For most use cases the only change required is to type a special word in front of your normal commit messages. Instead of "add function to compute X" put "feat: add function to compute X".  Based on the rules "feat" is mapped to a "minor" release.

Video Demo: https://youtu.be/qf7c-KxBBZc?t=37s

# Release Process

See: [RELEASE](/RELEASE.md)