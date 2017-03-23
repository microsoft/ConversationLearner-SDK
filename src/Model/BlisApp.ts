import { JsonProperty } from 'json-typescript-mapper';
import { Action } from './Action';
import { Entity } from './Entity';
import { TrainDialog } from './TrainDialog';
import { BlisClient } from '../BlisClient';

export class BlisApp
{
    @JsonProperty({clazz: Action, name: 'actions'})
    public actions : Action[];

    @JsonProperty({clazz: Entity, name: 'entities'})
    public entities : Entity[];

    @JsonProperty({clazz: TrainDialog, name: 'traindialogs'})
    public trainDialogs : TrainDialog[];

    @JsonProperty({clazz: TrainDialog, name: 'blis-app-version'})
    public appVersion : string[];

    public constructor(init?:Partial<BlisApp>)
    {
        this.actions = undefined;
        this.entities = undefined;
        this.trainDialogs = undefined;
        this.appVersion = undefined;
        (<any>Object).assign(this, init);
    }

    public async findTrainDialogs(client : BlisClient, appId : string, searchTerm : string) : Promise<{'dialogId': string, 'text': string}[]>
    {
        let dialogs = [];
        for (let trainDialog of this.trainDialogs)
        {
            let dialog = await trainDialog.toText(client, appId);
            if (!searchTerm || dialog.indexOf(searchTerm) > 0)
            {
                dialogs.push({'dialogId' : trainDialog.id, 'text' : dialog});
            }
        }
        return dialogs;
    }
}