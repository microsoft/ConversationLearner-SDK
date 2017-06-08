export class AdminResponse
{
    constructor(public result: any, public error: string)
    {

    }
    static Error(err : string) : AdminResponse
    {
        return new AdminResponse(err, null);
    }

    static Result(result : any) : AdminResponse
    {
        return new AdminResponse(null, result);
    }
}
