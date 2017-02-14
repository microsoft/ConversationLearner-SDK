process.stdin.resume();
process.stdin.setEncoding('utf8');
var util = require('util');
import { BlisClient } from '../client/client'
import { Entity, TakeTurnResponse, TakeTurnModes } from '../client/Model/TakeTurnResponse'
import { TakeTurnRequest } from '../client/Model/TakeTurnRequest'

function done() {
    console.log('Now that process.stdin is paused, there is nothing more I can do.');
    process.exit();
}

export class ConsoleBase {
    
    protected blisclient : BlisClient;
    protected appId : String;
    protected sessionId : String;
    protected modelId : String;
    protected entityName2Id : {};

    private hist = {}

    protected async CreateClient() : Promise<void> 
    {
    }

    public async Run()
    {
        await this.CreateClient();

        console.log("How can I help you?");

        this.start();
    }

    protected LUCallback (text: String, luisEntities : [{}]) : TakeTurnRequest 
    {
        return new TakeTurnRequest({text : text, entities: luisEntities});
    }

    private InsertEntities(text: String)
    {
        let words = [];
        let tokens = text.split(' ').forEach((item) => 
        {
            if (item.startsWith('$')) 
            {
                let name = item;                  // LARS TODO WAS: ent_name = item[1:] - why the 1:?
                let value = this.hist[name];
                words.push(value);
            }
            else
            {
                words.push(item);
            }
        });
        return words.join(' ');
    }

    public start () {
        process.stdin.on('data', async (text) => {

            text = text.trim();
             var words = text.split(' ');

            if (words[0] == "!reset")
            {
                //TODO: reset
            }
            if (words[0] === '!exit') {
                done();
            }

            try 
            {
                var response = await this.blisclient.TakeTurn(this.appId, this.sessionId, text, this.LUCallback);

                if (response.mode == TakeTurnModes.Teach)
                {
                    console.log("> " + response.action.content);
                }
                else if (response.mode == TakeTurnModes.Action)
                {
                    let outText = this.InsertEntities(response.actions[0].content);
                    console.log("> " + outText);
                } 
                else {
                    console.log(`> Don't know mode: ${response.mode}`)
                }
            }
            catch (error)
            {
                console.log("> !!! " + error);
            }
        
        });
    }
}