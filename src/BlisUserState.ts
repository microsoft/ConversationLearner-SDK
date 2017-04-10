import * as builder from 'botbuilder';
import { UserStates } from './Model/Consts';
import { BlisDebug} from './BlisDebug';
import { BlisContext} from './BlisContext';

export class BlisUserState {

    // Application Id
    appId : string;

    // Dialog session Id
    sessionId? : string;

    // Training model to use
    modelId? : string;

    // In teach Model
    inTeach? : boolean;

    public constructor(appId : string)
    {
        this[UserStates.APP] = appId;
        this[UserStates.MODEL] = null;
        this[UserStates.SESSION] = null;
        this[UserStates.TEACH] = false;
        this[UserStates.DEBUG] = false;
        this[UserStates.MEMORY] = {};
        this[UserStates.ENTITYLOOKUP] = {};
        this[UserStates.LASTSTEP] = null;
        this[UserStates.APILOOKUP] = {};
        this[UserStates.CURSTEP] = null;
        this[UserStates.TRAINSTEPS] = [];
        this[UserStates.CUECOMMAND] = null;
    }

    public static Get(bot : builder.UniversalBot, address : builder.IAddress, defaultApp : string,
                        cb : (err: Error, state: BlisUserState, isNew : boolean) => void )  {

        bot.loadSession(address, (error, session) => 
        {
            if (error) {
                cb(error, null, null);
            }
            else if (!session.userData.Blis)
            {
                session.userData.Blis = new BlisUserState(defaultApp);
                cb(null, session.userData.Blis, true);
            }
            else {
                cb(null, session.userData.Blis, false);
            }
        });
    }

    public static Save(context : BlisContext)  
    {
        context.bot.loadSession(context.address, (error, session) => 
        {
            if (error) {
                BlisDebug.LogObject(error);
            }
            else 
            {
                if (!session.userData.Blis)
                {
                    session.userData.Blis = {};
                }
                session.userData.Blis[UserStates.APP] = context.state[UserStates.APP];
                session.userData.Blis[UserStates.MODEL] = context.state[UserStates.MODEL];
                session.userData.Blis[UserStates.SESSION] = context.state[UserStates.SESSION];
                session.userData.Blis[UserStates.TEACH] = context.state[UserStates.TEACH];
                session.userData.Blis[UserStates.DEBUG] = context.state[UserStates.DEBUG];
                session.userData.Blis[UserStates.MEMORY] = context.state[UserStates.MEMORY];
                session.userData.Blis[UserStates.ENTITYLOOKUP] = context.state[UserStates.ENTITYLOOKUP];
                session.userData.Blis[UserStates.LASTSTEP] = context.state[UserStates.LASTSTEP];
                session.userData.Blis[UserStates.APILOOKUP] = context.state[UserStates.APILOOKUP];
                session.userData.Blis[UserStates.CURSTEP] = context.state[UserStates.CURSTEP];
                session.userData.Blis[UserStates.TRAINSTEPS] = context.state[UserStates.TRAINSTEPS];
                session.userData.Blis[UserStates.CUECOMMAND] = context.state[UserStates.CUECOMMAND];
                session.save();
            }
        });
    }
}

