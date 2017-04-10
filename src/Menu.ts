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
            "List" : Commands.ENTITIES, 
            "Search" : IntCommands.ENTITIES, 
            "Add" : IntCommands.ADDENTITY
        }));
        cards.push(Utils.MakeHero("Responses", null, null, 
        {
            "List" : Commands.RESPONSES,
            "Search" : IntCommands.RESPONSES, 
            "Add" : IntCommands.ADDRESPONSE
        }));
        cards.push(Utils.MakeHero("API Calls", null, null, 
        {
            "List" : Commands.APICALLS, 
            "Search" : IntCommands.APICALLS, 
            "Add" : IntCommands.ADDAPICALL
        }));
        cards.push(null);
        cards.push(Utils.MakeHero("Train Dialogs", null, null, 
        {
            "List" : Commands.TRAINDIALOGS, 
            "Search" : IntCommands.TRAINDIALOGS, 
            "Add" : Commands.TEACH
        }));
        cards = cards.concat(this.Apps("Apps"));
        cards.push(Utils.MakeHero("Bot", null, null, 
        {
            "Start" : Commands.START, 
            "Teach" : Commands.TEACH,
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
            "List" : Commands.APPS,
            "Search" : IntCommands.APPS, 
            "Create" : IntCommands.CREATEAPP
        }));
        return cards;
    }

    public static EditError(message : string | builder.IIsAttachment) : (string | builder.IIsAttachment)[]
    {
        let responses = [];
        responses.push(message);
        return responses.concat(Menu.EditApp(true));
    }
}
