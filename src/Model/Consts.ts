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

export const APITypes =
{
    AZURE : "AZURE",
    LOCAL : "LOCAL"
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


export const TeachAction =
{
    RETRAIN : "retrain",
    PICKACTION : "pickaction"
}

export const SaveStep =
{
    INPUT : "input",
    ENTITY : "entity",
    RESPONSE : "response",
    API : "api",
    CHOICES: "choices"
}

// Internal commands. (Not for user)
export const APICalls =
{
    SAVEENTITY : "saveEntity",
    SETTASK : "setTask",
    AZUREFUNCTION: "azureFunction"
}

export const ActionCommand =
{
    SUGGEST : "*",
    REQUIRE : "+",
    BLOCK : "-",
    SUBSTITUTE: "$",
    BUCKET: "#",
    NEGATIVE: "~",       // Remove the entity
    DEBUG: "/d"
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
    SAVELOOKUP: "SAVELOOKUP",        // ENTITY NAME -> SAVE API ACTION ID 
    CURSTEP: "CURSTEP", 
    TRAINSTEPS: "TRAINSTEPS",
    CUECOMMAND: "CUECOMMAND",       // Command to call after input prompt
    PAGE: "PAGE",                   // Current page on paging UI
    POSTS: "POSTS"                  // Array of last messages sent to user
}
