import * as builder from 'botbuilder';
import { BlisDebug } from '../BlisDebug';
import { BlisMemory } from '../BlisMemory';
import { BlisClient } from '../BlisClient';
import { Utils } from '../Utils';
import { BlisContext} from '../BlisContext';
import { UserStates, ActionCommand, ActionTypes } from './Consts';
import { IntCommands, LineCommands } from './Command';
import { EditableResponse } from './EditableResponse';


export class BlisSession
{ 
    public static async EndSession(context : BlisContext, cb : (text) => void) : Promise<void>
    {
        try
        {        
            // Ending teaching session (which trains the model if necessary), update modelId
            let sessionId = await context.client.EndSession(context.State(UserStates.APP), context.State(UserStates.SESSION));
            let modelId = await context.client.GetModel(context.State(UserStates.APP));
            new BlisMemory(context.session).EndSession();
            context.SetState(UserStates.MODEL, modelId);
            cb(sessionId);
        }
        catch (error)
        {
            // End session so user doesn't get trapped
            new BlisMemory(context.session).EndSession();
            let errMsg = BlisDebug.Error(error); 
            cb(errMsg);
        }
    }

    public static async NewSession(context : BlisContext, teach : boolean, cb : (results : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to create new session, Teach = ${teach}`);

       try {
            // Close any existing session
            let endId = await context.client.EndSession(context.State(UserStates.APP), context.State(UserStates.SESSION));
            BlisDebug.Log(`Ended session ${endId}`);

            // Start a new session
            let sessionId = await context.client.StartSession(context.State(UserStates.APP), teach);
            new BlisMemory(context.session).StartSession(sessionId, teach);
            BlisDebug.Log(`Started session ${sessionId}`)   
            if (teach)
            {
                let body = "Provide your first input for this teach dialog.\n\n\n\n";
                let subtext = `At any point type "${LineCommands.ABANDON}" to abort`;
                let card = Utils.MakeHero("Teach mode started", subtext, body, 
                {
                    "Cancel" : LineCommands.ABANDON
                });
                cb([card]);
            }
            else {
                let card = Utils.MakeHero(`Bot Started`, null, 'Type !done at any time to stop', 
                {
                    "Cancel" : LineCommands.DONE
                });
                cb([card]);
            }
       }
       catch (error) {
            let errMsg = BlisDebug.Error(error); 
            context.SetState(UserStates.SESSION, null);  // Clear the bad session
            cb([errMsg]);
       }
    }

    /** Return text of current training steps */
    public static TrainStepText(context : BlisContext) : string
    {
        let memory = context.Memory();
        let trainSteps = memory.TrainSteps();
        let msg = "** New Dialog Summary **\n\n";
        msg += `-----------------------------\n\n`;

        for (let trainstep of trainSteps)
        {
            msg += trainstep.input;

            if (trainstep.entity)
            {
                msg += `    _${trainstep.entity}_\n\n`;
            }
            else
            {
                msg += "\n\n";
            }
            for (let api of trainstep.api)
            {              
                msg += `     {${api}}\n\n`
            }
            for (let response of trainstep.response)
            {              
                msg += `     ${response}\n\n`
            }
        }
        return msg;
    }
}