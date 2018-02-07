import * as BB from 'botbuilder';
import { Blis } from './Blis';
import { BlisIntent } from './BlisIntent';
import { ActionTypes } from 'blis-models'

export class BlisTemplateRenderer implements BB.TemplateRenderer {

    public async renderTemplate(botContext: BotContext, language: string, templateId: string, blisIntent: BlisIntent): Promise<Partial<BB.Activity> | string | undefined> {

        // Get filled entities from memory
        let filledEntityMap = await blisIntent.memory.BotMemory.FilledEntityMap();

        let message = null;
        switch (blisIntent.scoredAction.metadata.actionType)  {
            case ActionTypes.TEXT:
                message = await Blis.TakeTextAction(blisIntent.scoredAction, filledEntityMap);
                break;
            /* TODO
            case ActionTypes.API_AZURE:
                message = await Blis.TakeAzureAPIAction(blisIntent.scoredAction, blisIntent.memory, blisIntent.blisEntities);
                break;
            */
            case ActionTypes.API_LOCAL:
                message = await Blis.TakeLocalAPIAction(blisIntent.scoredAction, filledEntityMap, blisIntent.memory, blisIntent.blisEntities);
                break;
            case ActionTypes.CARD:
                message = await Blis.TakeCardAction(blisIntent.scoredAction, filledEntityMap);
            break;
        }
        
        // If action wasn't terminal loop through BLIS again after a short delay
        if (!blisIntent.scoredAction.isTerminal) {
            setTimeout(async () =>
            {
                let app = await blisIntent.memory.BotState.AppAsync();
                let sessionId = await blisIntent.memory.BotState.SessionIdAsync(botContext.conversationReference.user.id);        
                let bestAction = await Blis.recognizer.Score(app.appId, sessionId, blisIntent.memory, "", [], blisIntent.blisEntities, blisIntent.inTeach);

                // If not inTeach, send message to user
                if (!blisIntent.inTeach) {
                    blisIntent.scoredAction = bestAction;
                    let message = await this.renderTemplate(botContext, language, bestAction.actionId, blisIntent);
                    Blis.SendMessage(blisIntent.memory, message);
                }

            },100)
        }
        return message ? message : " ";
    }
}
