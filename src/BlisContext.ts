import * as builder from 'botbuilder';
import { BlisClient } from './BlisClient';
import { BlisMemory } from './BlisMemory'
import { UserStates } from './Model/Consts';


export class BlisContext
{ 
    public session : builder.Session;
    public bot : builder.UniversalBot;

    constructor(bot : builder.UniversalBot, session : builder.Session) {
        this.bot = bot;
        this.session = session;
    }

    public State(key : string) : any
    { 
        if (key)
        {
            return this.session.userData.Blis[key];
        }
        return this.session.userData.Blis; 
    }

    public SetState(key : string, value : any) : void
    { 
        if (key)
        {
            return this.session.userData.Blis[key] = value;
        } 
    }

    public InitState(appId : string) : void
    {
        this.session.userData.Blis = {};
        this.SetState(UserStates.APP, appId);
        this.SetState(UserStates.MODEL, null);
        this.SetState(UserStates.SESSION, null);
        this.SetState(UserStates.TEACH, false);
        this.SetState(UserStates.DEBUG, false);
        this.SetState(UserStates.MEMORY, {});
        this.SetState(UserStates.ENTITYLOOKUP,{ });
        this.SetState(UserStates.LASTSTEP, null);
        this.SetState(UserStates.CURSTEP, null);
        this.SetState(UserStates.TRAINSTEPS, []);
        this.SetState(UserStates.CUECOMMAND, null);
        this.SetState(UserStates.PAGE, null);
    }

    public Address() : builder.IAddress
    { 
        return this.session.message.address;
    }

    public Memory() : BlisMemory
    {
        return new BlisMemory(this.session);
    }
}