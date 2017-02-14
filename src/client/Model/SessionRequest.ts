export class SessionRequest
{
    public Teach : boolean;
    public SaveDialog : boolean;
    public ModelId: string;

    constructor(teach : boolean, saveDialog : boolean, modelId : string)
    {
        this.Teach = teach;
        this.SaveDialog = saveDialog;
        this.ModelId = modelId;
    }
}
