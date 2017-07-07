
export const BLIS_INTENT_WRAPPER = "BLIS_INTENT_WRAPPER";

export const EntityTypes =
{
    LOCAL : "LOCAL",
    LUIS : "LUIS"
}

export const SaveStep =
{
    INPUT : "input",
    ENTITY : "entity",
    RESPONSES : "response",
    APICALLS : "api",
    CHOICES: "choices"
}

export const ActionCommand =
{
    SUGGEST : "*",
    REQUIRE : "+",
    BLOCK : "-",
    SUBSTITUTE: "$",
    BUCKET: "#",
    NEGATIVE: "~",       // Remove the entity
    TERMINAL: "WAIT",
    DEBUG: "/d"
}
