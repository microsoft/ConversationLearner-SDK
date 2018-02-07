# BLIS-SKD

Bot Learning Intelligent Service Software Development Kit

This repos is intended to be consumed by your bot.  The library exposes middleware which can be used within BotBuilder message pipeline.  The SDK runs a server and the middleware communicates with it while processing messages which enables BLIS track the bot's state/memory and reply with messages, adaptive cards, and more.

This repos also includes a way to host the BLIS adminstration website which provides graphical interface to manage, traind, and test your bot.

# Getting started

Install blis-sdk in consuming project:

```bash
npm install blis-sdk
```

Using the middlware:

```typescript
import { Blis, IBlisOptions, ClientMemoryManager } from 'blis-sdk'

...

Blis.Init({
    serviceUri: process.env.BLIS_SERVICE_URI,
    appId: process.env.BLIS_APP_ID,
    azureFunctionsUrl: process.env.BLIS_FUNCTIONS_URL,
    redisServer: process.env.BLIS_REDIS_SERVER,
    redisKey: process.env.BLIS_REDIS_KEY,
    localhost: process.env.BLIS_LOCALHOST ? process.env.BLIS_LOCALHOST.toLowerCase() === 'true' : true,
    user: process.env.BLIS_USER,
    secret: process.env.BLIS_SECRET
});

...

const bot = new BB.Bot(connector)
    .use(Blis.recognizer)
    .use(Blis.templateManager)
```

Starting the UI server:

```typescript
import { startUiServer } from 'blis-sdk'

startUiServer()
```


# Contributing

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

# Release Process

See: [RELEASE](/RELEASE.md)