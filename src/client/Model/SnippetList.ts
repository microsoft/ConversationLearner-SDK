import { JsonProperty } from 'json-typescript-mapper';

export class SnipTurn
{
    @JsonProperty('user_text')  
    public userText : string[];

    @JsonProperty('action')  
    public action : string;
}

export class Snippet
{
    @JsonProperty({clazz: SnipTurn, name: 'turns'})
    public turns : SnipTurn[];
}

export class SnippetList
{
    @JsonProperty({clazz: Snippet, name: 'snippetlist'})
    public snippets : Snippet[];
}