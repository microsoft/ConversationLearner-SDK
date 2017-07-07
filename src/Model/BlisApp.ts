import { BlisAppBase } from 'blis-models';

export class BlisApp extends BlisAppBase
{
    public static Sort(apps : BlisApp[]) : BlisApp[]
    {
        return apps.sort((n1, n2) => {
            let c1 = n1.appName.toLowerCase();
            let c2 = n2.appName.toLowerCase();
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