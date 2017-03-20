import { JsonProperty } from 'json-typescript-mapper';
import { Action } from './Action';
import { Entity } from './Entity';
import { TrainDialog } from './TrainDialog';

export class BlisApp
{
    @JsonProperty({clazz: Action, name: 'action'})
    public actions : Action[];

    @JsonProperty({clazz: Entity, name: 'entity'})
    public entities : Entity[];

    @JsonProperty({clazz: TrainDialog, name: 'traindialog'})
    public trainDialogs : TrainDialog[];

    public constructor(init?:Partial<BlisApp>)
    {
        this.actions = undefined;
        this.entities = undefined;
        this.trainDialogs = undefined;
        (<any>Object).assign(this, init);
    }
}