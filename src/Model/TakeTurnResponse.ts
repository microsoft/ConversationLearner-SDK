import * as builder from 'botbuilder';
import { JsonProperty } from 'json-typescript-mapper';
import { Action } from './Action';
import { LabelEntity } from './LabelEntity';
import { LabelAction } from './LabelAction';

export class TakeTurnResponse
{
    @JsonProperty('orig-text')
    public originalText : string;

    @JsonProperty({clazz: LabelEntity, name: 'entities'})
    public entities : LabelEntity[];

    @JsonProperty('mode')
    public mode : string;

    @JsonProperty({clazz: Action, name: 'actions'})
    public actions : Action[];

    @JsonProperty({clazz: Action, name: 'action'})
    public action : Action;

    @JsonProperty('teach_step')
    public teachStep : string;

    @JsonProperty({clazz: LabelEntity, name : 'teach_label_entity'})
    public teachLabelEntities : LabelEntity[];

    @JsonProperty({clazz: LabelAction, name : 'teach_label_action'})
    public teachLabelActions : LabelAction[];

    @JsonProperty('teach_error_msg')
    public teachError : string;

    @JsonProperty('error')
    public error : (string | builder.IIsAttachment);

    public constructor(init?:Partial<TakeTurnResponse>)
    {
        this.originalText = undefined;
        this.entities = undefined;
        this.mode = undefined;
        this.actions = undefined;
        this.action = undefined;
        this.teachStep = undefined;
        this.teachLabelEntities = undefined;
        this.teachLabelActions = undefined;
        this.teachError = undefined;
        this.error = undefined;
        (<any>Object).assign(this, init);
    }
}