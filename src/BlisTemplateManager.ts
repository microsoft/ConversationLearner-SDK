import * as BB from 'botbuilder-core';
import { Blis } from './Blis';
import { BlisIntent } from './BlisIntent';
import { ActionTypes } from 'blis-models'

export class BlisTemplateManager extends BB.TemplateManager {
    
    constructor() {
        super();
        this.register(new BlisTemplateRenderer());
    }
}

export class BlisTemplateRenderer implements BB.TemplateRenderer {

    public async renderTemplate(botContext: BotContext, language: string, templateId: string, blisIntent: BlisIntent): Promise<Partial<BB.Activity> | string | undefined> {

        let message = null;
        switch (blisIntent.scoredAction.metadata.actionType)  {
            case ActionTypes.TEXT:
                message = await Blis.CallBlisCallback(blisIntent.scoredAction, blisIntent.memory, blisIntent.blisEntities);
                break;
            case ActionTypes.API_AZURE:
                message = await Blis.TakeAzureAPIAction(blisIntent.scoredAction, blisIntent.memory, blisIntent.blisEntities);
                break;
            case ActionTypes.API_LOCAL:
                message = await Blis.TakeLocalAPIAction(blisIntent.scoredAction, blisIntent.memory, blisIntent.blisEntities);
                break;
            case ActionTypes.CARD:
                message = await Blis.TakeCardAction(blisIntent.scoredAction, blisIntent.memory, blisIntent.blisEntities);
            break;
        }
        
        // If action wasn't terminal loop through BLIS again after a short delay
        if (!blisIntent.scoredAction.isTerminal) {
            setTimeout(async () =>
            {
                let app = await blisIntent.memory.BotState.AppAsync();
                let sessionId = await blisIntent.memory.BotState.SessionIdAsync(botContext.conversationReference.user.id);
                
                Blis.recognizer.Score(app.appId, sessionId, blisIntent.memory, "", [], blisIntent.blisEntities);
            },100)
        }
        return message;
    }
}
