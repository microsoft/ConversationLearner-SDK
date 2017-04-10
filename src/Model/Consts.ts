export const TakeTurnModes =
{
    CALLBACK : "lu_callback",
    TEACH :  "teach",
    ACTION :  "action",
    ERROR : "error"
}

export const ActionTypes =
{
    TEXT : "text",
    API : "api"
}

export const EntityTypes =
{
    LOCAL : "LOCAL",
    LUIS : "LUIS"
}

export const TeachStep =
{
    LABELENTITY : "label_entity",
    LABELACTION : "label_action"
}

export const SaveStep =
{
    INPUT : "input",
    ENTITY : "entity",
    RESPONSE : "response",
    API : "api",
    CHOICES: "choices"
}

export const Commands =
{
    ABANDON: "!abandon",
    ACTIONS: "!actions",
    ADDENTITY : "!addentity",
    ADDAPICALL : "!addapicall",   // Duplicates for usablitity
    ADDRESPONSE: "!addresponse",  // Duplicates for usablitity
    APICALLS: "!apicalls",
    APPS : "!apps",
    CREATEAPP : "!createapp",
    DEBUG : "!debug",
    DEBUGHELP : "!debughelp",
    DELETEACTION : "!deleteaction",
    DELETEALLAPPS: "!deleteallapps",
    DELETEAPP : "!deleteapp",
    DELETEENTITY : "!deleteentity",
    DUMP : "!dump",
    EDITACTION : "!editaction",
    EDITENTITY : "!editentity",
    ENTITIES : "!entities",
    EXPORTAPP : "!exportapp",
    HELP : "!help",
    IMPORTAPP : "!importapp",
    LOADAPP: "!loadapp",
    RESPONSES : "!responses",
    START: "!start",
    TEACH : "!teach",
    TRAINDIALOGS : "!traindialogs"
}

// Internal commands. (Not for user)
export const IntCommands =
{
    ADDAPICALL : '~addapicall',
    ADDENTITY : '~addentity',
    ADDRESPONSE : '~addresponse',
    APICALLS : `~apicalls`,
    APPS : `~apps`,
    CREATEAPP : '~createapp',
    DELETEAPP : '~deleteapp',
    DELETEDIALOG : '~deletedialog',
    DONETEACH : "~doneteach",
    EDITACTION : "~editaction",
    EDITAPP : "~editapp",
    EDITENTITY : "~editentity",
    ENTITIES: `~entities`,
    FORGETTEACH : "~forgetteach",
    HOME: "~home",
    RESPONSES: "~responses",
    SAVETEACH: "~saveteach",
    TRAINDIALOGS: "~traindialogs"
}

// Internal commands. (Not for user)
export const APICalls =
{
    SAVEENTITY : "saveEntity"
}

export const ActionCommand =
{
    SUGGEST : "*",
    REQUIRE : "++",
    BLOCK : "--",
    SUBSTITUTE: "$",
    BUCKET: "#",
    NEGATIVE: "~",       // Remove the entity
    DEBUG: "/d"
}

export const Help =
{
    NEWAPP : "#newapp"
}

export const UserStates =
{
    APP : "APP",
    SESSION : "SESSION",
    MODEL : "MODEL",
    TEACH: "TEACH",
    DEBUG: "DEBUG",
    MEMORY: "MEMORY",
    ENTITYLOOKUP: "ENTITYLOOKUP",
    LASTSTEP: "LASTSTEP", 
    APILOOKUP: "APILOOKUP",           // ENTITY NAME -> SAVE API ACTION ID 
    CURSTEP: "CURSTEP", 
    TRAINSTEPS: "TRAINSTEPS",
    CUECOMMAND: "CUECOMMAND"
}
