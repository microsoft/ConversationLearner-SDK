import { JsonProperty } from 'json-typescript-mapper';

export class SnipTurn
{
    @JsonProperty('user_text')  
    public userText : string[];

    @JsonProperty('action')  
    public action : string;

    public constructor(init?:Partial<SnipTurn>)
    {
        this.userText = undefined;
        this.action = undefined;
        (<any>Object).assign(this, init);
    }
}

export class Snippet
{
    @JsonProperty({clazz: SnipTurn, name: 'turns'})
    public turns : SnipTurn[];

    public constructor(init?:Partial<Snippet>)
    {
        this.turns = undefined;
        (<any>Object).assign(this, init);
    }
}

export class SnippetList
{
    @JsonProperty({clazz: Snippet, name: 'snippetlist'})
    public snippets : Snippet[];

    public constructor(init?:Partial<SnippetList>)
    {
        this.snippets = undefined;
        (<any>Object).assign(this, init);
    }
}