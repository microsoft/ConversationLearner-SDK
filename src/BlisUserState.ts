import * as builder from 'botbuilder';
import { UserStates } from './Model/Consts';
import { BlisDebug} from './BlisDebug';

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
        this[UserStates.EDITCOMMAND] = null;
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

    public static Save(bot : builder.UniversalBot, address : builder.IAddress, userData : BlisUserState)  
    {
        bot.loadSession(address, (error, session) => 
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
                session.userData.Blis[UserStates.APP] = userData[UserStates.APP];
                session.userData.Blis[UserStates.MODEL] = userData[UserStates.MODEL];
                session.userData.Blis[UserStates.SESSION] = userData[UserStates.SESSION];
                session.userData.Blis[UserStates.TEACH] = userData[UserStates.TEACH];
                session.userData.Blis[UserStates.DEBUG] = userData[UserStates.DEBUG];
                session.userData.Blis[UserStates.MEMORY] = userData[UserStates.MEMORY];
                session.userData.Blis[UserStates.ENTITYLOOKUP] = userData[UserStates.ENTITYLOOKUP];
                session.userData.Blis[UserStates.LASTSTEP] = userData[UserStates.LASTSTEP];
                session.userData.Blis[UserStates.APILOOKUP] = userData[UserStates.APILOOKUP];
                session.userData.Blis[UserStates.CURSTEP] = userData[UserStates.CURSTEP];
                session.userData.Blis[UserStates.TRAINSTEPS] = userData[UserStates.TRAINSTEPS];
                session.userData.Blis[UserStates.EDITCOMMAND] = userData[UserStates.EDITCOMMAND];
                session.save();
            }
        });
    }
}

