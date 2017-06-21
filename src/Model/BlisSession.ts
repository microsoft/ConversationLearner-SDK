import * as builder from 'botbuilder';
import { BlisDebug } from '../BlisDebug';
import { BlisMemory } from '../BlisMemory';
import { BlisClient_v1 } from '../BlisClient';
import { Utils } from '../Utils';
import { BlisContext} from '../BlisContext';
import { ActionCommand, ActionTypes_v1 } from './Consts';
import { IntCommands, LineCommands } from './Command';
import { EditableResponse } from './EditableResponse';


export class BlisSession
{ 
    public static async EndSession(context : BlisContext, cb : (text) => void) : Promise<void>
    {
        let memory = context.Memory();
        try
        {  
            let appId = await memory.BotState().AppId();
            let sessionId = await memory.BotState().SessionId();

            // Ending teaching session (which trains the model if necessary), update modelId
            sessionId = await BlisClient_v1.client.EndSession(appId, sessionId);
            let modelId = await BlisClient_v1.client.GetModel(appId);
            await memory.EndSession();
            await memory.BotState().SetModelId(modelId);
            cb(sessionId);
        }
        catch (error)
        {
            // End session so user doesn't get trapped
            await memory.EndSession();
            let errMsg = BlisDebug.Error(error); 
            cb(errMsg);
        }
    }

    public static async NewSession(context : BlisContext, teach : boolean, cb : (results : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to create new session, Teach = ${teach}`);

       let memory = context.Memory();

       try {
            let appId = await memory.BotState().AppId();
            let sessionId = await memory.BotState().SessionId();

            // Close any existing session
            let endId = await BlisClient_v1.client.EndSession(appId, sessionId);
            BlisDebug.Log(`Ended session ${endId}`);

            // Start a new session
            sessionId = await BlisClient_v1.client.StartSession(appId, teach);
            await memory.StartSession(sessionId, teach);
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
            await memory.BotState().SetSessionId(null);  // Clear the bad session
            cb([errMsg]);
       }
    }

    /** Return text of current training steps */
    public static async TrainStepText(context : BlisContext) : Promise<string>
    {
        let memory = context.Memory();
        let trainSteps = await memory.TrainHistory().Steps();
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