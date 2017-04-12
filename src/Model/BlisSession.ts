import * as builder from 'botbuilder';
import { BlisDebug } from '../BlisDebug';
import { BlisUserState} from '../BlisUserState';
import { BlisMemory } from '../BlisMemory';
import { BlisClient } from '../BlisClient';
import { Utils } from '../Utils';
import { BlisContext} from '../BlisContext';
import { UserStates, ActionCommand, ActionTypes } from './Consts';
import { IntCommands, LineCommands } from '../CommandHandler';

export class BlisSession
{ 
    public static async EndSession(context : BlisContext, cb : (text) => void) : Promise<void>
    {
        try
        {        
            // Ending teaching session (which trains the model if necessary), update modelId
            new BlisMemory(context).EndSession();
            let sessionId = await context.client.EndSession(context.state[UserStates.APP], context.state[UserStates.SESSION]);
            let modelId = await context.client.GetModel(context.state[UserStates.APP]);
            context.state[UserStates.MODEL]  = modelId;
            cb(sessionId);
        }
        catch (error)
        {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(errMsg);
        }
    }

    public static async NewSession(context : BlisContext, teach : boolean, cb : (results : (string | builder.IIsAttachment)[]) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to create new session, Teach = ${teach}`);

       try {
            // Close any existing session
            let endId = await context.client.EndSession(context.state[UserStates.APP], context.state[UserStates.SESSION]);
            BlisDebug.Log(`Ended session ${endId}`);

            // Start a new session
            let sessionId = await context.client.StartSession(context.state[UserStates.APP], teach);
            new BlisMemory(context).StartSession(sessionId, teach);
            BlisDebug.Log(`Started session ${sessionId}`)   
            if (teach)
            {
                let body = "Provide your first input for this teach dialog.\n\n\n\n";
                let subtext = `At any point type "${LineCommands.ABANDON}" to abort`;
                let card = Utils.MakeHero("Teach mode started", subtext, body, null);
                cb([card]);
            }
            else {
                cb([`_Bot started..._`]);
            }
       }
       catch (error) {
           let errMsg = Utils.ErrorString(error);
           BlisDebug.Error(errMsg);
           context.state[UserStates.SESSION] = null;  // Clear the bad session
           cb([errMsg]);
       }
    }

    /** Return text of current training steps */
    public static TrainStepText(context : BlisContext) : string
    {
        let memory = new BlisMemory(context);
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
            msg += `     ${trainstep.response}\n\n`
        }
        return msg;
    }
}