import { JsonProperty } from 'json-typescript-mapper';
import { Action } from './Action';
import { Entity } from './Entity';
import { TrainDialog } from './TrainDialog';

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
}