import * as builder from 'botbuilder';
import { Commands, IntCommands } from './Model/Consts';
import { Utils } from './Utils';

export class Menu {

    public static EditApp(newLine? : boolean) : (string|builder.IIsAttachment)[]
    {
        let cards = [];
        if (newLine) cards.push(null);
        cards.push(Utils.MakeHero("Entities", null, null, 
        {
            "View" : Commands.ENTITIES, 
            "Add" : IntCommands.ADDENTITY
        }));
        cards.push(Utils.MakeHero("Responses", null, null, 
        {
            "View" : Commands.RESPONSES, 
            "Add" : IntCommands.ADDRESPONSE
        }));
        cards.push(Utils.MakeHero("API Calls", null, null, 
        {
            "View" : Commands.APICALLS, 
            "Add" : IntCommands.ADDAPICALL
        }));
        cards = cards.concat(this.Apps("Apps"));
        cards.push(Utils.MakeHero(null, null, null, 
        {
            "DONE" : IntCommands.HOME
        }));
        return cards;
    }

    public static NotLoaded(title : string, subheader? : string, body? : string) : (string|builder.IIsAttachment)[]
    { 
        let cards = [];
        cards.push(Utils.MakeHero(title, subheader, body, 
        {
            "My Apps" : `${Commands.APPS}`,
            "Create" : `${Commands.CREATEAPP}`,
        }));
        return cards;
    }

    public static Home(title : string, subheader? : string, body? : string) : (string|builder.IIsAttachment)[]
    { 
        let cards = [];
        cards.push(Utils.MakeHero(title, subheader, body, 
        {
            "Start" : Commands.START, 
            "Teach" : Commands.TEACH,
            "Edit" : IntCommands.EDITAPP
        }));
        return cards;
    }

    public static Apps(title : string, subheader? : string, body? : string) : (string|builder.IIsAttachment)[]
    { 
        let cards = [];
        cards.push(Utils.MakeHero(title, subheader, body, 
        {
            "View" : Commands.APPS,
            "Create" : Commands.CREATEAPP
        }));
        return cards;
    }
}
