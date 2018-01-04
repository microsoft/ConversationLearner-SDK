import * as BB from 'botbuilder-core';
import { UserInput, PredictedEntity,
    EntityBase, ScoredAction } from 'blis-models'
import { BlisDebug } from './BlisDebug';
import { BlisMemory } from './BlisMemory';
import { BlisClient } from './BlisClient';
import { BlisContext} from './BlisContext';
import { BlisIntent } from './BlisIntent';
import { Blis } from './Blis';
import { IBlisOptions } from './BlisOptions';

export const BLIS_INTENT_WRAPPER = "BLIS_INTENT_WRAPPER";

export class BlisRecognizer extends BB.IntentRecognizer {

    constructor(options: IBlisOptions) {
       super();

        this.onRecognize((botContext) => {
            Blis.SetBot(botContext);

            const intents: BB.Intent[] = [];
            return this.ProcessInput(botContext)
                .then((res) => {
                    if (res) {
                        intents.push(res);
                    }
                    return intents;
                });
        });
    }

    private async StartSessionAsync(botContext: BotContext, memory: BlisMemory, appId: string): Promise<string> {

        let sessionResponse = await BlisClient.client.StartSession(appId);
        await memory.StartSessionAsync(sessionResponse.sessionId, botContext.request.from.id, false);
        BlisDebug.Verbose(`Started Session: ${sessionResponse.sessionId} - ${botContext.request.from.id}`);
        return sessionResponse.sessionId;
    }

    private async ProcessInput(botContext: BotContext) : Promise<BB.Intent>
    {
        let errComponent = "ProcessInput";
        let memory: BlisMemory = null;
        try {
            BlisDebug.Verbose(`Process Input...`);
            let blisContext = await BlisContext.CreateAsync(Blis.bot, botContext);

            memory = blisContext.Memory();

            // Validate setup
            let validationError = Blis.ValidationErrors();
            if (validationError) {
                BlisDebug.Error(validationError);
                await Blis.SendMessage(memory, validationError);
                return null;
            }

            let inTeach = await memory.BotState.InTeachAsync();
            let app = await memory.BotState.AppAsync();
            let sessionId = null;

            // If I don't have an app yet, or app does not match
            if (!app || (Blis.options.appId && app.appId !== Blis.options.appId)) {
                if (Blis.options.appId) {
                    BlisDebug.Log(`Selecting app: ${Blis.options.appId}`);
                    app = await BlisClient.client.GetApp(Blis.options.appId, null);
                    await memory.BotState.SetAppAsync(app);
                }
                else {
                    throw "BLIS AppID not specified"
                }
            } 
            else {
                // Attempt to load the session
                sessionId = await memory.BotState.SessionIdAsync(botContext.request.from.id);
            }

            // If no session for this conversation (or it's expired), create a new one
            if (!sessionId) {
                sessionId = await this.StartSessionAsync(botContext, memory, app.appId);
            }

            // Process any form data
            let buttonResponse = await this.ProcessFormData(botContext, memory, app.appId);

            // Teach inputs are handled via API calls from the BLIS api
            if (!inTeach)
            {
                let scoredAction : ScoredAction = null;
                let entities : EntityBase[] = null;

                errComponent = "SessionExtract";
                let userInput = new UserInput({text: buttonResponse || botContext.request.text || "  "});
                let extractResponse = await BlisClient.client.SessionExtract(app.appId, sessionId, userInput);
                entities = extractResponse.definitions.entities;
                errComponent = "ProcessExtraction";
                scoredAction = await this.Score(app.appId, sessionId, memory, extractResponse.text, extractResponse.predictedEntities, entities); 

                return { 
                    name: scoredAction.actionId,
                    score: 1.0,
                    scoredAction: scoredAction,
                    blisEntities: entities,
                    memory: memory
                } as BlisIntent;
            }
            return null;
        }
        catch (error) {
            // Session is invalid
            if (memory) {
                BlisDebug.Verbose("ProcessInput Failure. Clearing Session");
                memory.EndSession();
            }
            let msg = BlisDebug.Error(error, errComponent);
            await Blis.SendMessage(memory, msg);
            return null;
        }
    }

    private async ProcessFormData(context: BotContext, blisMemory: BlisMemory, appId: string) : Promise<string> {
    
        const data = context.request.value as FormData;
        if (data) {

            // Get list of all entities
            let entityList = await BlisClient.client.GetEntities(appId, null);

            // For each form entry
            for (let entityName of Object.keys(data)) {

                // Reserved parameter
                if (entityName == 'submit') {
                    continue;
                }
                                
                // Find the entity
                let entity = entityList.entities.find(e => e.entityName == entityName);
                
                if (!entity) {
                    BlisDebug.Error(`Form - Can't find Entity named: ${entityName}`);
                    return null;
                }
                // Set it
                let isBucket = entity.metadata ? entity.metadata.isBucket : false;
                await blisMemory.BotMemory.Remember(entity.entityName, entity.entityId, data[entityName], isBucket);
                 
            }

            // If submit type return as a response
            if (data['submit'] === "submit") {
                return data['submit'];
            }
        }
        return null;
    }

    public async Score(appId : string, sessionId : string, memory : BlisMemory, text : string, predictedEntities : PredictedEntity[], allEntities : EntityBase[]) : Promise<ScoredAction>
    {
            // Call LUIS callback
            let scoreInput = await Blis.CallEntityDetectionCallback(text, predictedEntities, memory, allEntities);
            
            // Call the scorer
            let scoreResponse = await BlisClient.client.SessionScore(appId, sessionId, scoreInput);

            // Get best action
            let bestAction = scoreResponse.scoredActions[0];

            // Return the action
            return bestAction;
    }
}