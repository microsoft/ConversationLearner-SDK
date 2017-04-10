import * as builder from 'botbuilder';
import { BlisClient } from './BlisClient';
import { BlisUserState} from './BlisUserState';


export class BlisContext
{ 
    public client : BlisClient;
    public state : BlisUserState;
    public bot : builder.UniversalBot;
    public address : builder.IAddress;

    constructor(bot : builder.UniversalBot, client : BlisClient, userState : BlisUserState, address : builder.IAddress){
        this.bot = bot;
        this.client = client;
        this.state = userState;
        this.address = address;
    }
}