import * as builder from 'botbuilder'
import { UserStates, SaveStep } from './Consts';

// For keeping track of paging UI elements
export class Pager {

    constructor(public index : number, public numPages : number, public search? : string){
    }

    public static Init(session : builder.Session, search : string) : void {
        let page = new Pager(0, 0, search);
        session.userData.Blis[UserStates.PAGE] = page;
    }

    public static Index(session : builder.Session) : number {
        let page = session.userData.Blis[UserStates.PAGE];
        return page.index;
    }

    /** Update the length */
    public static SetLength(session : builder.Session, length : number) : Pager {
        let page = session.userData.Blis[UserStates.PAGE];
        page.length = length;

        // Make sure still in bounds (i.e. handle deleted items in list)
        if (page.index > page.length-1)
        {
            page.index = page.length-1;
        }
        return page;
    }

    public static SearchTerm(session : builder.Session) : string {
        let page = session.userData.Blis[UserStates.PAGE];
        return page.search;
    }

    public static Next(session : builder.Session) : Pager {
        let page = session.userData.Blis[UserStates.PAGE];
        page.index++;

        // Loop if at end
        if (page.index > page.length-1)
        {
            page.index = 0;
        }
        return page;
    }

    public static Prev(session : builder.Session) : Pager {
        let page = session.userData.Blis[UserStates.PAGE];
        page.index--;

        // Loop if at start
        if (page.index < 0)
        {
            page.index = page.length-1;
        }
        return page;
    }
}