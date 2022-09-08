import type { Val, ValList } from '../type';
import { Context } from '../unify';
import { ValBase } from '../val/ValBase';
declare class ListVal extends ValBase {
    static SPREAD: symbol;
    spread: {
        cj: Val | undefined;
    };
    constructor(peg: ValList, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    get canon(): string;
    gen(ctx?: Context): any;
}
export { ListVal, };
