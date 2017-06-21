import * as builder from 'botbuilder';
import { deserialize } from 'json-typescript-mapper';
import { BlisDebug} from '../BlisDebug';
import { BlisClient, BlisClient_v1 } from '../BlisClient';
import { TakeTurnModes, EntityTypes, TeachStep, ActionTypes_v1, APICalls, ActionCommand } from '../Model/Consts';
import { IntCommands, LineCommands, HelpCommands } from './Command';
import { BlisHelp } from '../Model/Help'; 
import { BlisMemory } from '../BlisMemory';
import { Action_v1 } from '../Model/Action';
import { Utils } from '../Utils';import { JsonProperty } from 'json-typescript-mapper';
import { Entity_v1 } from './Entity';
import { BlisContext } from '../BlisContext';
import { TrainDialog_v1 } from './TrainDialog';
import { Menu } from '../Menu';
import { EditableResponse } from './EditableResponse';
import { AdminResponse } from './AdminResponse';

export class BlisAppMetaData
{
    @JsonProperty('botFrameworkApps')  
    public botFrameworkApps : string[];

    public constructor(init?:Partial<BlisAppMetaData>)
    {
        this.botFrameworkApps = undefined;
        (<any>Object).assign(this, init);
    }
}

export class BlisApp
{
    @JsonProperty('appName')
    public appName : string;

    @JsonProperty('appId')
    public appId : string;

    @JsonProperty('luisKey')
    public luisKey : string;

    @JsonProperty('locale')
    public locale : string;

    @JsonProperty({clazz: BlisAppMetaData, name: 'metadata'})
    public metadata : BlisAppMetaData;

    public constructor(init?:Partial<BlisApp>)
    {
        this.appName = undefined;
        this.appId = undefined;
        this.luisKey = undefined;
        this.locale = undefined;
        this.metadata = undefined;
        (<any>Object).assign(this, init);
    }

    public static async Delete(appId : string, key : string) : Promise<AdminResponse>
    {
       BlisDebug.Log(`Trying to Delete Application`);
        if (!appId)
        {
            return AdminResponse.Error('No app provided');
        }

        try
        {       
            let memory = BlisMemory.GetMemory(key);
            let curAppId = await memory.BotState().AppId();

<<<<<<< HEAD
            await BlisClient_v1.client.DeleteApp(curAppId, appId)
=======
            await BlisClient.client.DeleteApp(curAppId, appId)
>>>>>>> master

            // Did I delete my loaded app
            if (appId == curAppId)
            {
                await  memory.BotState().SetAppId(null);
                await memory.BotState().SetModelId(null);
                await memory.BotState().SetSessionId(null);
            }
        }
        catch (error) {
            let errMsg = BlisDebug.Error(error); 
            AdminResponse.Error(errMsg);
        }
    }

    /** Create a new app, return new appId */
    public static async Add(key : string, blisApp : BlisApp) : Promise<AdminResponse>
    {
       BlisDebug.Log(`Trying to Create Application`);

        // TODO - temp debug
        if (blisApp.luisKey == '*')
        {
            blisApp.luisKey = '5bb9d31334f14bc5a6bd0d7c3d06094d'; // SRAL
        }
        if (blisApp.luisKey == '**')
        {
            blisApp.luisKey = '8d7dadb7520044c59518b5203b75e802';
        }
        
        if (!blisApp.appName)
        {
            return AdminResponse.Error(`You must provide a name for your application.`);
        }
        if (!blisApp.luisKey)
        {
            return AdminResponse.Error(`You must provide a luisKey for your application.`);
        }

        try
        {       
            let appId = await BlisClient.client.AddApp(blisApp);

            // Initialize
            await BlisMemory.GetMemory(key).Init(appId);
            return AdminResponse.Result(appId);
        }
        catch (error) {
            let errMsg = BlisDebug.Error(error);        
            return AdminResponse.Error(errMsg);
        }
    } 

    /** Get all apps, filter by Search term */
    public static async GetAll(key : string, search : string) : Promise<AdminResponse>
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
<<<<<<< HEAD
            let json = await BlisClient_v1.client.GetApps()
=======
            let json = await BlisClient.client.GetApps()
>>>>>>> master
            appIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${appIds.length} apps`);

            if (appIds.length == 0) {
                return AdminResponse.Result([]);
            }
            let apps : BlisApp[] = [];
            if (search) search = search.toLowerCase();

            for (let appId of appIds)
            {   
                let blisApp = await BlisClient.client.GetApp(appId)

                if (!search || blisApp.appId.toLowerCase().indexOf(search) > -1)
                { 
                    apps.push(blisApp);
                    BlisDebug.Log(`App lookup: ${blisApp.appName} : ${blisApp.appId}`);
                }
            }

            // Sort
            apps = BlisApp.Sort(apps);
            return AdminResponse.Result(apps);
        }
        catch (error) {
            let errMsg = BlisDebug.Error(error); 
            return AdminResponse.Result(errMsg);
        }
    }

    /** Delete all apps associated with this account */
    public static async DeleteAll(key : string) : Promise<AdminResponse>
    {
        BlisDebug.Log(`Trying to Delete All Applications`);
       
        try
        {
            // Get app ids
            let appIds = [];
<<<<<<< HEAD
            let json = await BlisClient_v1.client.GetApps()
=======
            let json = await BlisClient.client.GetApps()
>>>>>>> master
            appIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${appIds.length} apps`);

            let memory = BlisMemory.GetMemory(key);
            let curAppId = await memory.BotState().AppId();

            for (let appId of appIds){
<<<<<<< HEAD
                let text = await BlisClient_v1.client.DeleteApp(curAppId, appId)
=======
                let text = await BlisClient.client.DeleteApp(curAppId, appId)
>>>>>>> master
                BlisDebug.Log(`Deleted ${appId} apps`);
            }

            // No longer have an active app
            await  memory.BotState().SetAppId(null);
            await memory.BotState().SetModelId(null);
            await memory.BotState().SetSessionId(null);

            return AdminResponse.Result(true);
        }
        catch (error)
        {
            let errMsg = BlisDebug.Error(error);     
            return AdminResponse.Error(errMsg);
        }
    }

    public static Sort(apps : BlisApp[]) : BlisApp[]
    {
        return apps.sort((n1, n2) => {
            let c1 = n1.appName.toLowerCase();
            let c2 = n2.appName.toLowerCase();
            if (c1 > c2) {
                return 1;
            }
            if (c1 < c2){
                return -1;
            }
            return 0;
        });
    }
}
export class BlisApp_v1
{
    @JsonProperty('app-name')
    public name : string;

    @JsonProperty('model-id')
    public id : string;

    public constructor(init?:Partial<BlisApp_v1>)
    {
        this.name = undefined;
        this.id = undefined;
        (<any>Object).assign(this, init);
    }

    public static Sort_v1(apps : BlisApp_v1[]) : BlisApp_v1[]
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
    public static HaveApp_v1(appId : string, context : BlisContext, cb : (responses: (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], actionId? : string) => void) : boolean
    {
        if (appId == null)
        {
            cb(Menu.AppPanel('No Application has been loaded'));
            return false
        }
        return true;
    }

    public static async Create_v1(context : BlisContext,  appName : string, luisKey, cb : (responses: (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]) => void) : Promise<void>
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
<<<<<<< HEAD
            let appId = await BlisClient_v1.client.CreateApp_v1(appName, luisKey)
=======
            let appId = await BlisClient.client.CreateApp_v1(appName, luisKey)
>>>>>>> master

            // Initialize
            await context.Memory().Init(appId);
            
            let card = Utils.MakeHero("Created App", appName, null, null);
            cb(Menu.AddEditCards(context,[card])); 
        }
        catch (error) {
            let errMsg = BlisDebug.Error(error);        
            cb([errMsg]);
        }
    } 

    /** Get all apps, filter by Search term */
    public static async GetAll_v1(context : BlisContext, search : string, cb : (responses: (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]) => void) : Promise<void>
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
            let json = await BlisClient_v1.client.GetApps()
            appIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${appIds.length} apps`);

            if (appIds.length == 0) {
                cb(Menu.AppPanel("This account contains no apps."));
            }
            let msg = "";
            let responses = [];
            let apps : BlisApp_v1[] = [];
            if (search) search = search.toLowerCase();

            for (let appId of appIds)
            {   
<<<<<<< HEAD
                let blisApp = await BlisClient_v1.client.GetApp_v1(appId)
=======
                let blisApp = await BlisClient.client.GetApp_v1(appId)
>>>>>>> master

                if (!search || blisApp.name.toLowerCase().indexOf(search) > -1)
                { 
                    apps.push(blisApp);
                    BlisDebug.Log(`App lookup: ${blisApp.name} : ${blisApp.id}`);
                }
            }

            // Sort
            apps = BlisApp_v1.Sort_v1(apps);

            let memory = context.Memory();
            let appId = await memory.BotState().AppId();

            // Genrate output
            for (let app of apps) 
            {
                if (debug) 
                {
                    msg += `${app.name} : ${app.id}\n\n`;
                }
                else
                {
                    if (!appId)
                    {
                        responses.push(Utils.MakeHero(app.name, null, null, 
                        { 
                            "Load" : `${LineCommands.LOADAPP} ${app.id}`,
                            "Delete" : `${IntCommands.DELETEAPP} ${app.id}`
                        }));
                    }
                    else if (app.id == appId)
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
                            "Delete" : `${IntCommands.DELETEAPP} ${app.id}`
                        }));
                    }
                }
            }

            if (debug) responses.push(msg);

            if (responses.length == 0)
            {
                responses.push("No Apps match your query.")
            }
            responses.push(null, Menu.Home());
            cb(responses);
        }
        catch (error) {
            let errMsg = BlisDebug.Error(error); 
            cb([errMsg]);
        }
    }

    /** Delete all apps associated with this account */
    public static async DeleteAll_v1(context : BlisContext, cb : (responses: (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]) => void) : Promise<void>
    {
        BlisDebug.Log(`Trying to Delete All Applications`);
       
        try
        {
            // Get app ids
            let appIds = [];
            let json = await BlisClient_v1.client.GetApps()
            appIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${appIds.length} apps`);

            let memory = context.Memory();
            let appId = await memory.BotState().AppId();

            for (let appId of appIds){
                let text = await BlisClient_v1.client.DeleteApp(appId, appId)
                BlisDebug.Log(`Deleted ${appId} apps`);
            }

            // No longer have an active app
            await  memory.BotState().SetAppId(null);
            await memory.BotState().SetModelId(null);
            await memory.BotState().SetSessionId(null);

            cb(Menu.AddEditCards(context,["Done"]));
        }
        catch (error)
        {
            let errMsg = BlisDebug.Error(error);     
            cb([errMsg]);
        }
    }

    public static async Delete_v1(context : BlisContext, appId : string, cb : (responses: (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Application`);
        if (!appId)
        {
            let msg = BlisHelp.Get(HelpCommands.DELETEAPP);
            cb(msg);
            return;
        }

        try
        {       
            let memory = context.Memory();
            let curAppId = await memory.BotState().AppId();

            await BlisClient_v1.client.DeleteApp(curAppId, appId)

            let cards = [];
            cards.push(Utils.MakeHero("Deleted App", appId, null, null));

            // Did I delete my loaded app
            if (appId == curAppId)
            {
                await  memory.BotState().SetAppId(null);
                await memory.BotState().SetModelId(null);
                await memory.BotState().SetSessionId(null);
                cards.push(null);  // Line break
                cards = cards.concat(Menu.AppPanel('No App Loaded','Load or Create one'));
                cb(cards);
            }
            else
            {
                cb(Menu.AddEditCards(context,cards));
            }
        }
        catch (error) {
            let errMsg = BlisDebug.Error(error); 
            cb([errMsg]);
        }
    }
}