import { JsonProperty } from 'json-typescript-mapper';

export class Turn
{
    @JsonProperty('user_text')  
    public userText : string[];

    @JsonProperty('action')  
    public action : string;
}

export class Snippet
{
    @JsonProperty({clazz: Turn, name: 'turns'})
    public turns : Turn[];
}

export class SnippetList
{
    @JsonProperty({clazz: Snippet, name: 'snippetlist'})
    public snippets : Snippet[];
}