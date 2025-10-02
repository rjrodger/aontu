import type { Val, ValList, ValSpec } from '../type';
import { Context } from '../unify';
import { BaseVal } from './BaseVal';
declare class ListVal extends BaseVal {
    isListVal: boolean;
    static SPREAD: symbol;
    spread: {
        cj: Val | undefined;
    };
    constructor(spec: {
        peg: ValList;
    }, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    clone(ctx: Context, spec?: ValSpec): Val;
    get canon(): string;
    gen(ctx?: Context): any;
}
export { ListVal, };
