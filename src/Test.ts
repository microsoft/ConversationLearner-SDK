import { BlisClient } from './BlisClient';
import { BlisApp } from './Model/BlisApp';
import { BlisDebug } from './BlisDebug';
import { Entity } from './Model/Entity';
import { Action } from './Model/Action';

export class TestResult {
    constructor(public pass: boolean, public message: string)
    {

    }
    public static Pass() : TestResult
    {
        return new TestResult(true, "PASS");
    }

    public static Fail(reason : string)
    {
        return new TestResult(false, `FAIL: ${reason}`);
    }
}

/** Descriptor used to add a method as a test function */
function AddTest(target : Object, propertyKey : string, descriptor : TypedPropertyDescriptor<any>)
{
    Test.AddTest(propertyKey, descriptor.value);
    return descriptor;
}

export class Test {

    public static tests = {};

    public static AddTest(testName : string, obj : Object) 
    {
        this.tests[testName.toLowerCase()] = obj;
    }

    public static async RunTest(testName : string) : Promise<string[]>
    {
        if (testName == "all")
        {
            let results = [];
            for (let test in this.tests)
            {
                let result = await this.tests[test]();
                results.push(result.message);
            }
            return results;
        }
        var test = this.tests[testName.toLowerCase()];
        if (test)
        {
            let result = await test();
            return [result.message];
        }
        return ["FAIL: No test of this name found."];
    }

    private static InitClient() : void
    {
        let serviceUrl = "http://blis-service.azurewebsites.net/api/v1/";
        let user = "testuser";
        let secret = "none";
        let azureFunctionsUrl = "";
        let azureFunctionsKey = "";
        BlisClient.Init(serviceUrl, user, secret, azureFunctionsUrl, azureFunctionsKey);
    }

    private static async InitApp() : Promise<string>
    {
        Test.InitClient();
        let blisApp = Test.MakeApp();
        return await BlisClient.client.AddApp(blisApp, null);
    } 

    @AddTest
    public static async GetApps() : Promise<TestResult>
    {
        Test.InitClient();
        let apps = await BlisClient.client.GetApps(null);
        return TestResult.Pass();
    }

    @AddTest
    public static async AppRoundtrip() : Promise<TestResult>
    {
        try
        {
            Test.InitClient();
            let inApp = Test.MakeApp();
            let appId = await BlisClient.client.AddApp(inApp, null);
            let outApp = await BlisClient.client.GetApp(appId, null);
            if (outApp.appId != appId) return TestResult.Fail("appId");
            if (outApp.appName != inApp.appName) return TestResult.Fail("appName");
            if (outApp.luisKey != inApp.luisKey) return TestResult.Fail("luisKey");
            if (outApp.locale != inApp.locale) return TestResult.Fail("luisKey");

            // Now delete the app
            await BlisClient.client.ArchiveApp(appId);
 
            // Try to reload
            let deletedApp = await BlisClient.client.GetApp(appId, null);
            if (deletedApp) return TestResult.Fail("Delete");
            return TestResult.Pass();
        }
        catch (error)
        {
            let errMsg = BlisDebug.Error(error); 
            return TestResult.Fail(errMsg);
        }
    }

    @AddTest
    public static async EntityRoundtrip() : Promise<TestResult>
    {
        try
       { 
            let appId = await Test.InitApp();
            let inEntity = Test.MakeEntity();
            let entityId = await BlisClient.client.AddEntity(appId, inEntity);

            let outEntity = await BlisClient.client.GetEntity(appId, entityId, null);
            if (outEntity.entityId != entityId) return TestResult.Fail("entityId");
            if (outEntity.entityName != inEntity.entityName) return TestResult.Fail("entityName");
            if (outEntity.entityType != inEntity.entityType) return TestResult.Fail("entityType");
            if (outEntity.version != inEntity.version) return TestResult.Fail("version");
            if (outEntity.packageCreationId != inEntity.packageCreationId) return TestResult.Fail("packageCreationId");
            if (outEntity.packageDeletionId != inEntity.packageDeletionId) return TestResult.Fail("packageDeletionId");
            if (outEntity.metadata != inEntity.metadata) return TestResult.Fail("metadata");

             // Now delete 
            await BlisClient.client.DeleteEntity(appId, entityId);
 
            // Try to reload
            let deletedEntity = await BlisClient.client.GetEntity(appId, entityId, null);
            if (deletedEntity) return TestResult.Fail("Delete");

            return TestResult.Pass();
        }
        catch (error)
        {
            let errMsg = BlisDebug.Error(error); 
            return TestResult.Fail(errMsg);
        }
    }

    @AddTest
    public static async ActionRoundtrip() : Promise<TestResult>
    {
        try
       { 
            let appId = await Test.InitApp();
            let inAction = Test.MakeAction();
            let actionId = await BlisClient.client.AddAction(appId, inAction);

            let outAction = await BlisClient.client.GetAction(appId, actionId, null);
            if (outAction.actionId != actionId) return TestResult.Fail("actionId");
            if (outAction.payload != inAction.payload) return TestResult.Fail("payload");
            if (outAction.isTerminal != inAction.isTerminal) return TestResult.Fail("isTerminal");
            if (!Test.IsSame(outAction.requiredEntities, inAction.requiredEntities)) return TestResult.Fail("requiredEntities");
            if (!Test.IsSame(outAction.negativeEntities, inAction.negativeEntities)) return TestResult.Fail("negativeEntities");
            if (outAction.version != inAction.version) return TestResult.Fail("version");
            if (outAction.packageCreationId != inAction.packageCreationId) return TestResult.Fail("packageCreationId");
            if (outAction.packageDeletionId != inAction.packageDeletionId) return TestResult.Fail("packageDeletionId");
            if (outAction.metadata != inAction.metadata) return TestResult.Fail("metadata");

            // Now delete 
            await BlisClient.client.DeleteAction(appId, actionId);
 
            // Try to reload
            let deletedAction = await BlisClient.client.GetAction(appId, actionId, null);
            if (deletedAction) return TestResult.Fail("Delete");

            return TestResult.Pass();
        }
        catch (error)
        {
            let errMsg = BlisDebug.Error(error); 
            return TestResult.Fail(errMsg);
        }
    }

    //===================================================
    // Tools
    //===================================================
    private static IsSame(arr1 : any[], arr2 : any[]) : boolean
    {
        if (arr1.length != arr2.length)
        {
            return false;
        }
        for (let element1 of arr1) {
            let found = false;
            for (let element2 of arr2)
            {
                if (element1 == element2)
                {
                    found = true;
                    break;
                }
            }
            if (!found)
            {
                return false;
            }
        }
        return true;
    }

    //===================================================
    // Random generators
    //===================================================
    private static s = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static MakeRandomWord(size : number) : string
    {
        return "test_" + Array(size).join().split(',').map(function() { return Test.s.charAt(Math.floor(Math.random() * Test.s.length)); }).join('');
    }

    private static MakeRandomInt(min, max) : number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private static MakeRandomBool() : boolean {
        return Math.random() >= 0.5;
    }

    //===================================================
    // Object generators
    //===================================================
    private static MakeApp() : BlisApp {
        return new BlisApp(
        {
            appName : this.MakeRandomWord(10),
            luisKey : '5bb9d31334f14bc5a6bd0d7c3d06094d',
            locale : 'en-us'
        });
    }

    private static MakeEntity() : Entity {
        return new Entity(
        {
            entityName : this.MakeRandomWord(10),
            entityType : "LUIS",
            version : this.MakeRandomInt(0,100),
            packageCreationId : this.MakeRandomInt(0,100),
            packageDeletionId : this.MakeRandomInt(0,100),
            metadata : undefined
        });
    }

    private static MakeAction() : Action {
        return new Action(
        {
            payload : this.MakeRandomWord(10),
            isTerminal : this.MakeRandomBool(),
            requiredEntities : [],
            negativeEntities : [],
            version : this.MakeRandomInt(0,100),
            packageCreationId : this.MakeRandomInt(0,100),
            packageDeletionId : this.MakeRandomInt(0,100),
            metadata : undefined
        });
    }
}