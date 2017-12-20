import * as BB from 'botbuilder-core';
import { BlisRecognizer } from './BlisRecognizer';
import { BlisTemplateManager } from './BlisTemplateManager';
import { IBlisOptions } from './BlisOptions';
import { BlisMemory } from './BlisMemory';
import { BlisDebug } from './BlisDebug';
import { BlisClient } from './BlisClient';
import { Server } from './Http/Server';
import { InitDOLRunner } from './DOLRunner';
import { AzureFunctions } from './AzureFunctions';
import { Utils } from './Utils';
import { EntityBase, ScoredAction, PredictedEntity,
        ScoreInput, ModelUtils } from 'blis-models'
import { ClientMemoryManager} from './Memory/ClientMemoryManager';
import { BlisIntent } from './BlisIntent';

export class Blis  {

    public static options: IBlisOptions;

    // Mapping between user defined API names and functions
    public static apiCallbacks : { string : (memoryManager: ClientMemoryManager, args : any[]) => Promise<BB.Activity | string | undefined> } | {} = {};
      
    // Optional callback than runs after LUIS but before BLIS.  Allows Bot to substitute entities
    public static luisCallback : (text: string, predictedEntities : PredictedEntity[], memoryManager : ClientMemoryManager) => Promise<ScoreInput>;
    
    // Optional callback that runs after BLIS is called but before the Action is rendered
    public static blisCallback : (text : string, memoryManager : ClientMemoryManager) => Promise<string>
       
    public static bot: BB.Bot;
    public static recognizer : BlisRecognizer;
    public static templateManager : BlisTemplateManager;

    public static Init(options: IBlisOptions) {

        Blis.options = options;

        try {
            BlisDebug.Log("Creating client....");
            BlisClient.SetServiceURI(options.serviceUri);
            BlisClient.Init(options.user, options.secret, options.azureFunctionsUrl, options.azureFunctionsKey);
            BlisMemory.Init(options.redisServer, options.redisKey);

            // If app not set, assume running on localhost init DOL Runner
            if (options.localhost) {
                InitDOLRunner();
            }

            Server.Init();

            BlisDebug.Log("Initialization complete....");
        }
        catch (error) {
            BlisDebug.Error(error, "Dialog Constructor");
        }

        Blis.recognizer = new BlisRecognizer(options);
        Blis.templateManager = new BlisTemplateManager();
    }

    public static SetBot(bot : BB.Bot) {
        if (!Blis.bot) {  
            Blis.bot = bot;
            BlisDebug.InitLogger(Blis.bot);
        }
    }

    public static AddAPICallback(name: string, target : (memoryManager: ClientMemoryManager, args : any[]) => Promise<BB.Activity | string | undefined>)
    {
        Blis.apiCallbacks[name] = target;
    }
    
    public static LuisCallback(target : (text: string, predictedEntities : PredictedEntity[], memoryManager : ClientMemoryManager) => Promise<ScoreInput>)
    {
        Blis.luisCallback = target;
    }
    
    public static BlisCallback(target : (text : string, memoryManager : ClientMemoryManager) => Promise<string> /*LARSOLD | builder.Message*/)
    {
        Blis.blisCallback = target;
    }

    public static async SendIntent(memory: BlisMemory, intent: BlisIntent) : Promise<void> {
        await Utils.SendIntent(Blis.bot, memory, intent);
    }

    public static async SendMessage(memory: BlisMemory, content: string) : Promise<void> {
        await Utils.SendMessage(Blis.bot, memory, content);
    }

    public static async CallLuisCallback(text: string, predictedEntities : PredictedEntity[], memory : BlisMemory, allEntities : EntityBase[]) : Promise<ScoreInput> {
    
        let memoryManager = new ClientMemoryManager(memory, allEntities);

        let scoreInput = null;
        if (Blis.luisCallback) {
            scoreInput = await Blis.luisCallback(text, predictedEntities, memoryManager);
        }
        else {
            scoreInput = await Blis.DefaultLuisCallback(text, predictedEntities, memoryManager);
        }
        return scoreInput;
    }
    
    public static async DefaultLuisCallback(text: string, predictedEntities : PredictedEntity[], memoryManager : ClientMemoryManager) : Promise<ScoreInput>
    {
        for (var predictedEntity of predictedEntities)
        // Update entities in my memory
        {
            // If negative entity will have a positive counter entity
            if (predictedEntity.metadata && predictedEntity.metadata.positiveId)
            {
                await memoryManager.blisMemory.BotMemory.ForgetEntity(predictedEntity);
            }
            else
            {
                await memoryManager.blisMemory.BotMemory.RememberEntity(predictedEntity);
            }

            // If entity is associated with a task, make sure task is active
            /*
            if (predictedEntity.metadata && predictedEntity.metadata.task)
            {
                // If task is no longer active, clear the memory
                let remembered = await memory.BotMemory.WasRemembered(predictedEntity.metadata.task);
                if (!remembered)
                {
                    await memory.BotMemory.ForgetByLabel(predictedEntity);
                }
            }
            */
        }
    
        // Get entities from my memory
        var filledEntities = await memoryManager.blisMemory.BotMemory.FilledEntities();

        let scoreInput = new ScoreInput({   
            filledEntities: filledEntities,
            context: {},
            maskedActions: []
        });
        return scoreInput;
    }
    
    public static async CallBlisCallback(scoredAction : ScoredAction, memory : BlisMemory, allEntities : EntityBase[]) : Promise<string/*LARSTODO | builder.Message*/> {
        
        let memoryManager = new ClientMemoryManager(memory, allEntities);

        let outText = null;
        if (Blis.luisCallback) {
            outText = await Blis.blisCallback(scoredAction.payload, memoryManager);
        }
        else {
            outText = await Blis.DefaultBlisCallback(scoredAction.payload, memoryManager);
        }
        return outText;
    }

    public static async DefaultBlisCallback(text: string, memoryManager : ClientMemoryManager) : Promise<string>
    {
        let outText = await memoryManager.blisMemory.BotMemory.Substitute(text);
        return outText;
    }

    public static async TakeLocalAPIAction(scoredAction : ScoredAction, memory : BlisMemory, allEntities : EntityBase[]) : Promise<Partial<BB.Activity> | string | undefined>
    {
        if (!Blis.apiCallbacks)
        {
            BlisDebug.Error("No Local APIs defined.")
            return undefined;
        }

        // Extract API name and args
        let apiName = ModelUtils.GetPrimaryPayload(scoredAction);
        let args = ModelUtils.GetArguments(scoredAction);

        // Make any entity substitutions
        let argArray = [];
        for (let arg of args)
        {
            argArray.push(await memory.BotMemory.SubstituteEntities(arg));
        }

        let api = Blis.apiCallbacks[apiName];
        if (!api)
        {
            let msg = BlisDebug.Error(`API "${apiName}" is undefined`);
            throw msg;
        }

        let memoryManager = new ClientMemoryManager(memory, allEntities);
        
        return await api(memoryManager, argArray); 
    }

    public static async TakeAzureAPIAction(scoredAction : ScoredAction, memory : BlisMemory, allEntities : EntityBase[]) : Promise<Partial<BB.Activity> | string | undefined>
    {
        // Extract API name and entities
        let apiString = scoredAction.payload;
        let [funcName] = apiString.split(' ');
        let args = ModelUtils.RemoveWords(apiString, 1);

        // Make any entity substitutions
        let entities = await memory.BotMemory.SubstituteEntities(args);

        // Call Azure function and send output (if any)
        return await AzureFunctions.Call(BlisClient.client.azureFunctionsUrl, BlisClient.client.azureFunctionsKey, funcName, entities);        
    }

    public static ValidationErrors() : string {
        let errMsg = "";
        if (!this.options.serviceUri) {
            errMsg += "Options missing serviceUrl. Set BLIS_SERVICE_URI Env value.\n\n";
        }
        if (!this.options.redisKey) {
            errMsg += "Options missing redisKey. Set BLIS_REDIS_KEY Env value.\n\n";
        }
        if (!this.options.redisServer) {
            errMsg += "Options missing redisServer. Set BLIS_REDIS_SERVER Env value.\n\n";
        }
        if (!this.options.localhost && !this.options.appId) {
            errMsg += "Options must specify appId when not running on localhost. Set BLIS_APP_ID Env value.\n\n";
        }
        return errMsg;
    }
}    