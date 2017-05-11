// Internal command prefix
const INTPREFIX = "%int%"

// Command the cue user text entry
const CUEPREFIX = "%cue%"

// Command line prefix
export const COMMANDPREFIX = "!"

// Help commands
const HELPPREFIX = "%help%"

// Internal commands. (Not for user)
export const CueCommands =
{
    ADDAPICALL : CUEPREFIX + "addapicall",
    ADDENTITY : CUEPREFIX + "addentity",
    ADDRESPONSE : CUEPREFIX + "addresponse",
    APPS : CUEPREFIX + "apps",
    CREATEAPP : CUEPREFIX + "createapp",
    ADDAPIAZURE : CUEPREFIX + "addapiazure",
    ADDAPILOCAL : CUEPREFIX + "addapilocal",
    ADDRESPONSETEXT : CUEPREFIX + "addresponsetext",
    ADDRESPONSEINTENT : CUEPREFIX + "addresponseintent",
    EDITAPICALL : CUEPREFIX + "editapicall",
    EDITENTITY : CUEPREFIX + "editentity",
    EDITRESPONSE : CUEPREFIX + "editresponse",
    ENTITIES: CUEPREFIX + "entities",
    RESPONSES: CUEPREFIX + "responses",
    TRAINDIALOGS: CUEPREFIX + "traindialogs",

} 
// Internal commands. (Not for user)
export const IntCommands =
{
    APICALLS : INTPREFIX + "apicalls",
    CANCEL : INTPREFIX + "cancel",
    CHOOSEAPITYPE : INTPREFIX + "chooseapitype",
    CHOOSERESPONSETYPE : INTPREFIX + "chooseresponsetype",
    DELETEAPP : INTPREFIX + "deleteapp",
    DELETEDIALOG : INTPREFIX + "deletedialog",
    DONETEACH : INTPREFIX + "doneteach",
    EDITAPP : INTPREFIX + "editapp",
    FORGETTEACH : INTPREFIX + "forgetteach",
    SAVETEACH: INTPREFIX + "saveteach",
    TRAINDIALOG_NEXT: INTPREFIX + "nexttraindialogs",
    TRAINDIALOG_PREV: INTPREFIX + "prevtraindialogs"
}

export const LineCommands =
{
    ABANDON: COMMANDPREFIX + "abandon",
    ACTIONS: COMMANDPREFIX + "actions",
    ADDAPICALL : COMMANDPREFIX + "addapicall", 
    ADDAPIAZURE : COMMANDPREFIX + "addazureapi",
    ADDAPILOCAL : COMMANDPREFIX + "addlocalapi",
    ADDENTITY : COMMANDPREFIX + "addentity",  
    ADDRESPONSE : COMMANDPREFIX + "addresponse",  
    ADDRESPONSETEXT: COMMANDPREFIX + "addresponsetext",  
    ADDRESPONSEINTENT: COMMANDPREFIX + "addresponseintent",  
    CUEAPICALLS: COMMANDPREFIX + "apicalls",
    APPS : COMMANDPREFIX + "apps",
    CREATEAPP : COMMANDPREFIX + "createapp",
    DEBUG : COMMANDPREFIX + "debug",
    DEBUGHELP : COMMANDPREFIX + "debughelp",
    DELETEACTION : COMMANDPREFIX + "deleteaction",
    DELETEALLAPPS: COMMANDPREFIX + "deleteallapps",
    DELETEAPP : COMMANDPREFIX + "deleteapp",
    DELETEENTITY : COMMANDPREFIX + "deleteentity",
    DONE : COMMANDPREFIX + "done",
    DUMP : COMMANDPREFIX + "dump",
    EDITAPICALL : COMMANDPREFIX + "editapicall",
    EDITENTITY : COMMANDPREFIX + "editentity",
    EDITRESPONSE : COMMANDPREFIX + "editresponse",
    ENTITIES : COMMANDPREFIX + "entities",
    EXPORTAPP : COMMANDPREFIX + "exportapp",
    HELP : COMMANDPREFIX + "help",
    IMPORTAPP : COMMANDPREFIX + "importapp",
    LOADAPP: COMMANDPREFIX + "loadapp",
    RESPONSES : COMMANDPREFIX + "responses",
    START: COMMANDPREFIX + "start",
    TEACH : COMMANDPREFIX + "teach",
    TRAINDIALOGS : COMMANDPREFIX + "traindialogs"
}

export const HelpCommands =
{
    ADDAPICALL: HELPPREFIX+"addapicall",
    ADDENTITY: HELPPREFIX+"addentity",
    ADDRESPONSE: HELPPREFIX+"addresponse",
    ADDRESPONSETEXT: HELPPREFIX+"addresponsetext",
    ADDRESPONSEINTENT: HELPPREFIX+"addresponseintent",
    ADDAZUREAPI: HELPPREFIX+"addazure",
    DELETEACTION: HELPPREFIX+"deleteaction",
    DELETEAPP : HELPPREFIX+"deleteapp",
    EDITAPICALL: HELPPREFIX+"addapicall",
    EDITENTITY: HELPPREFIX+"addentity",
    EDITRESPONSE: HELPPREFIX+"addresponse",
    PICKENTITY : HELPPREFIX+"pickentity"
}

export class Command {

    constructor(public name : string, public description : string, public detail : string[], public args : string, public examples : string[]){
    }

    
    public static IsCueCommand(text : string) 
    {
        return text.startsWith(CUEPREFIX);
    }

    public static IsIntCommand(text : string) 
    {
        return text.startsWith(INTPREFIX);
    }

    public static IsLineCommand(text : string) 
    {
        return text.startsWith(COMMANDPREFIX);
    }

    public static IsHelpCommand(text: string) : boolean
    {
        return text.startsWith(HELPPREFIX);
    }
}
