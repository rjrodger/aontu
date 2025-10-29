import type { Val, ValList, ValSpec } from '../type';
import { Context } from '../unify';
import { BagVal } from './BagVal';
declare class ListVal extends BagVal {
    isList: boolean;
    spread: {
        cj: Val | undefined;
    };
    constructor(spec: {
        peg: ValList;
    }, ctx?: Context);
    unify(peer: Val, ctx: Context, explain?: any[] | false): Val;
    clone(ctx: Context, spec?: ValSpec): Val;
    get canon(): string;
    gen(ctx?: Context): any;
}
export { ListVal, };
