# ConversationLearner-SKD

Conversation Learner Software Development Kit

This repo is intended to be consumed by your bot. The library exposes middleware which can be used within [BotBuilder](https://github.com/Microsoft/botbuilder-js) message pipeline.  The SDK runs a server and the middleware communicates with it while processing messages which enables the Conversation Learner track the bot's state/memory and reply with messages, adaptive cards, and more.

This repo also includes a way to host the Conversation Learner adminstration website which provides graphical interface to manage, traind, and test your bot.

# Getting started

Install conversationlearner-sdk in consuming project:

```bash
npm install conversationlearner-sdk
```

Using the middlware:

```typescript
import { ConversationLearner, ICLOptions, ClientMemoryManager } from 'conversationlearner-sdk'

...

ConversationLearner.Init({
    serviceUri: process.env.CONVERSATION_LEARNER_SERVICE_URI,
    appId: process.env.CONVERSATION_LEARNER_APP_ID,
    redisServer: process.env.CONVERSATION_LEARNER_REDIS_SERVER,  (Optional)
    redisKey: process.env.CONVERSATION_LEARNER_REDIS_KEY,        (Optional)
    localhost: process.env.DOL_START ? process.env.DOL_START.toLowerCase() === 'true' : true,
    user: process.env.CONVERSATION_LEARNER_USER,
    secret: process.env.CONVERSATION_LEARNER_SECRET
});

...
let cl = new ConversationLearner(appId);

server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async context => {
        let result = await cl.recognize(context)
        
        if (result) {
            cl.SendResult(result);
        }
    })
})
```

Starting the UI server:

```typescript
import { startUiServer } from 'conversationlearner-sdk'

startUiServer()
```


# Contributing

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

# Release Process

See: [RELEASE](/RELEASE.md)