import * as builder from 'botbuilder';
import { deserialize } from 'json-typescript-mapper';
import { BlisUserState} from '../BlisUserState';
import { BlisDebug} from '../BlisDebug';
import { BlisClient } from '../BlisClient';
import { TakeTurnModes, EntityTypes, UserStates, TeachStep, Commands, IntCommands, ActionTypes, SaveStep, APICalls, ActionCommand } from '../Model/Consts';
import { BlisHelp, Help } from '../Model/Help'; 
import { BlisMemory } from '../BlisMemory';
import { Action } from '../Model/Action';
import { Utils } from '../Utils';import { JsonProperty } from 'json-typescript-mapper';
import { Entity } from './Entity';
import { TrainDialog } from './TrainDialog';

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
            if (n1.name > n2.name) {
                return 1;
            }
            if (n1.name < n2.name){
                return -1;
            }
            return 0;
        });
    }

    public static async Create(blisClient: BlisClient, userState : BlisUserState,  
            appName : string, luisKey, cb : (responses: (string | builder.IIsAttachment)[]) => void) : Promise<void>
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
            let msg = BlisHelp.CommandHelpString(Commands.CREATEAPP, `You must provide a name for your application.`);
            cb([msg]);
            return;
        }
        if (!luisKey)
        {
            let msg = BlisHelp.CommandHelpString(Commands.CREATEAPP, `You must provide a luisKey for your application.`);
            cb([msg]);
            return;
        }

        try
        {       
            let appId = await blisClient.CreateApp(appName, luisKey)

            // Initialize
            Object.assign(userState, new BlisUserState(appId));

            let card = Utils.MakeHero("Created App", appName, null, {"Help" : Help.NEWAPP});
            cb([card]);
        }
        catch (error) {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
    } 

    /** Get all apps, filter by Search term */
    public static async GetAll(blisClient : BlisClient, address : builder.IAddress, 
        search : string, cb : (text) => void) : Promise<void>
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
            let json = await blisClient.GetApps()
            appIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${appIds.length} apps`);

            if (appIds.length == 0) {
                cb(["This account contains no apps."]);
            }
            let msg = "";
            let responses = [];
            let apps : BlisApp[] = [];
            for (let appId of appIds)
            {   
                let blisApp = await blisClient.GetApp(appId)

                if (!search || blisApp.name.indexOf(search) > -1)
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
                    responses.push(Utils.MakeHero(app.name, null, null, 
                    { 
                        "Load" : `${Commands.LOADAPP} ${app.id}`,
                        "Import" : `${Commands.IMPORTAPP} ${app.id}`,
                        "Delete" : `${IntCommands.DELETEAPP} ${app.id}`,
                        // "Clone" : `${IntCommands.DELETEAPP} ${appId}`,
                    }));
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
    public static async DeleteAll(blisClient : BlisClient, userState : BlisUserState,
        address : builder.IAddress, cb : (text) => void) : Promise<void>
    {
        BlisDebug.Log(`Trying to Delete All Applications`);
       
        try
        {
            // Get app ids
            let appIds = [];
            let json = await blisClient.GetApps()
            appIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${appIds.length} apps`);

            for (let appId of appIds){
                let text = await blisClient.DeleteApp(userState, appId)
                BlisDebug.Log(`Deleted ${appId} apps`);
            }
            cb("Done");
        }
        catch (error)
        {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
    }

    public static async Delete(blisClient : BlisClient, userState : BlisUserState, 
        appId : string, cb : (text) => void) : Promise<void>
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
            await blisClient.DeleteApp(userState, appId)
            let card = Utils.MakeHero("Deleted App", appId, null, null);
            cb(card);
        }
        catch (error) {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(errMsg);
        }
    }
}