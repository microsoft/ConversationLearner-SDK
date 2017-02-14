export function HandleError(text : string)
{
    console.log("!!!! " + text);
    throw new Error(text);
}

export function Debug(obj : any)
{
    console.log("-> " + JSON.stringify(obj));
}