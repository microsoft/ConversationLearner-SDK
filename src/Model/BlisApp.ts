import * as builder from 'botbuilder';
import { deserialize } from 'json-typescript-mapper';
import { BlisUserState} from '../BlisUserState';
import { BlisDebug} from '../BlisDebug';
import { BlisClient } from '../BlisClient';
import { TakeTurnModes, EntityTypes, UserStates, TeachStep, ActionTypes, SaveStep, APICalls, ActionCommand } from '../Model/Consts';
import { IntCommands, LineCommands } from '../CommandHandler';
import { BlisHelp, Help } from '../Model/Help'; 
import { BlisMemory } from '../BlisMemory';
import { Action } from '../Model/Action';
import { Utils } from '../Utils';import { JsonProperty } from 'json-typescript-mapper';
import { Entity } from './Entity';
import { BlisContext } from '../BlisContext';
import { TrainDialog } from './TrainDialog';
import { Menu } from '../Menu';

export class BlisApp
{
    @JsonProperty('app-name')
    public name : string;

    @JsonProperty('model-id')
    public id : string;

    public constructor(init?:Partial<BlisApp>)
    {
        this.name = undefined;
        this.id = undefined;
        (<any>Object).assign(this, init);
    }

    public static Sort(apps : BlisApp[]) : BlisApp[]
    {
        return apps.sort((n1, n2) => {
            let c1 = n1.name.toLowerCase();
            let c2 = n2.name.toLowerCase();
            if (c1 > c2) {
                return 1;
            }
            if (c1 < c2){
                return -1;
            }
            return 0;
        });
    }

    /** Send No App card and return false if no app loaded */
    public static HaveApp(context : BlisContext, cb : (responses: (string | builder.IIsAttachment)[], actionId? : string) => void) : boolean
    {
        if (context.state[UserStates.APP] == null)
        {
            cb(Menu.AppPanel('No Application has been loaded'));
            return false
        }
        return true;
    }

    public static async Create(context : BlisContext,  appName : string, luisKey, cb : (responses: (string | builder.IIsAttachment)[]) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Create Application`);

        // TODO - temp debug
        if (luisKey == '*')
        {
            luisKey = '5bb9d31334f14bc5a6bd0d7c3d06094d'; // SRAL
        }
        if (luisKey == '**')
        {
            luisKey = '8d7dadb7520044c59518b5203b75e802';
        }
        

        if (!appName)
        {
            let msg = `You must provide a name for your application.`;
            cb(Menu.AppPanel(msg));
            return;
        }
        if (!luisKey)
        {
            let msg = `You must provide a luisKey for your application.`;
            cb(Menu.AppPanel(msg));
            return;
        }

        try
        {       
            let appId = await context.client.CreateApp(appName, luisKey)

            // Initialize
            Object.assign(context.state, new BlisUserState(appId));
            
            let card = Utils.MakeHero("Created App", appName, null, null);
            cb(Menu.AddEditApp(context,[card])); 
        }
        catch (error) {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
    } 

    /** Get all apps, filter by Search term */
    public static async GetAll(context : BlisContext, search : string, cb : (responses: (string | builder.IIsAttachment)[]) => void) : Promise<void>
    {
        BlisDebug.Log(`Getting apps`);

        try
        { 
            let debug = false;
            if (search && search.indexOf(ActionCommand.DEBUG) > -1)
            {
                debug = true;
                search = search.replace(ActionCommand.DEBUG, "");
            }

            // Get app ids
            let appIds = [];
            let json = await context.client.GetApps()
            appIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${appIds.length} apps`);

            if (appIds.length == 0) {
                cb(Menu.AppPanel("This account contains no apps."));
            }
            let msg = "";
            let responses = [];
            let apps : BlisApp[] = [];
            if (search) search = search.toLowerCase();

            for (let appId of appIds)
            {   
                let blisApp = await context.client.GetApp(appId)

                if (!search || blisApp.name.toLowerCase().indexOf(search) > -1)
                { 
                    apps.push(blisApp);
                    BlisDebug.Log(`App lookup: ${blisApp.name} : ${blisApp.id}`);
                }
            }

            // Sort
            apps = BlisApp.Sort(apps);

            // Genrate output
            for (let app of apps) 
            {
                if (debug) 
                {
                    msg += `${app.name} : ${app.id}\n\n`;
                }
                else
                {
                    if (app.id == context.state[UserStates.APP])
                    {
                        responses.push(Utils.MakeHero(app.name + " (LOADED)", null, null, { 
                            "Delete" : `${IntCommands.DELETEAPP} ${app.id}`
                        }));
                    }
                    else
                    {
                        responses.push(Utils.MakeHero(app.name, null, null, 
                        { 
                            "Load" : `${LineCommands.LOADAPP} ${app.id}`,
                            "Import" : `${LineCommands.IMPORTAPP} ${app.id}`,
                            "Delete" : `${IntCommands.DELETEAPP} ${app.id}`,
                            // "Clone" : `${IntCommands.DELETEAPP} ${appId}`,
                        }));
                    }
                }
            }

            if (debug) responses.push(msg);

            if (responses.length == 0)
            {
                responses.push("No Apps match your query.")
            }
            cb(responses);
        }
        catch (error) {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
    }

    /** Delete all apps associated with this account */
    public static async DeleteAll(context : BlisContext, cb : (responses: (string | builder.IIsAttachment)[]) => void) : Promise<void>
    {
        BlisDebug.Log(`Trying to Delete All Applications`);
       
        try
        {
            // Get app ids
            let appIds = [];
            let json = await context.client.GetApps()
            appIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${appIds.length} apps`);

            for (let appId of appIds){
                let text = await context.client.DeleteApp(context.state, appId)
                BlisDebug.Log(`Deleted ${appId} apps`);
            }
            cb(Menu.AddEditApp(context,["Done"]));
        }
        catch (error)
        {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
    }

    public static async Delete(context : BlisContext, appId : string, cb : (responses: (string | builder.IIsAttachment)[]) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Application`);
        if (!appId)
        {
            let msg = BlisHelp.Get(Help.DELETEAPP);
            cb(msg);
            return;
        }

        try
        {       
            await context.client.DeleteApp(context.state, appId)

            let card = Menu.AppPanel("Deleted App", appId, null);

            // Did I delete my loaded app
            if (appId == context.state[UserStates.APP])
            {
                context.state[UserStates.APP] = null;
            }
            cb(card);
        }
        catch (error) {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
    }
}