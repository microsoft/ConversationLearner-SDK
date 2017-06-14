import * as builder from 'botbuilder';
import { JsonProperty } from 'json-typescript-mapper';
import { Action_v1 } from './Action';
import { LabelEntity } from './LabelEntity';
import { LabelAction } from './LabelAction';
import { EditableResponse } from './EditableResponse';


export class TakeTurnResponse
{
    @JsonProperty('orig-text')
    public originalText : string;

    @JsonProperty({clazz: LabelEntity, name: 'entities'})
    public entities : LabelEntity[];

    @JsonProperty('mode')
    public mode : string;

    @JsonProperty({clazz: Action_v1, name: 'actions'})
    public actions : Action_v1[];

    @JsonProperty({clazz: Action_v1, name: 'action'})
    public action : Action_v1;

    @JsonProperty('teach_step')
    public teachStep : string;

    @JsonProperty({clazz: LabelEntity, name : 'teach_label_entity'})
    public teachLabelEntities : LabelEntity[];

    @JsonProperty({clazz: LabelAction, name : 'teach_label_action'})
    public teachLabelActions : LabelAction[];

    @JsonProperty('teach_error_msg')
    public teachError : string;

    @JsonProperty('error')
    public error : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse);

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