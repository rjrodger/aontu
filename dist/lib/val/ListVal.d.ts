import type { Val, ValList, ValSpec } from '../type';
import { Context } from '../unify';
import { ValBase } from '../val/ValBase';
declare class ListVal extends ValBase {
    static SPREAD: symbol;
    spread: {
        cj: Val | undefined;
    };
    constructor(spec: {
        peg: ValList;
    }, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    clone(spec?: ValSpec, ctx?: Context): Val;
    get canon(): string;
    gen(ctx?: Context): any;
}
export { ListVal, };
