import { ActionBase } from 'blis-models';   

export class Action extends ActionBase
{
  
    /** Returns true if content of action is equal */
    /** ID, version and package do not matter      */
    public Equal(action : Action) : boolean
    {
        if (this.payload != action.payload) return false;
        if (this.isTerminal != action.isTerminal) return false;
        if (this.negativeEntities.length != action.negativeEntities.length) return false;
        if (this.requiredEntities.length != action.requiredEntities.length) return false;
        for (var negEntity of this.negativeEntities)
        {
            if (action.negativeEntities.indexOf(negEntity) < 0) return false;
        }
        for (var reqEntity of this.requiredEntities)
        {
            if (action.requiredEntities.indexOf(reqEntity) < 0) return false;
        }
        return this.metadata.Equal(action.metadata);
    }

    public static Sort(actions : Action[]) : Action[]
    {
        return actions.sort((n1, n2) => {
            let c1 = n1.payload.toLowerCase();
            let c2 = n2.payload.toLowerCase();
            if (c1 > c2) {
                return 1;
            }
            if (c1 < c2){
                return -1;
            }
            return 0;
        });
    }
}
