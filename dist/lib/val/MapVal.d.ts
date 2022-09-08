import type { Val, ValMap } from '../type';
import { Context } from '../unify';
import { ValBase } from '../val/ValBase';
declare class MapVal extends ValBase {
    static SPREAD: symbol;
    spread: {
        cj: Val | undefined;
    };
    constructor(peg: ValMap, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    get canon(): string;
    gen(ctx?: Context): any;
}
export { MapVal };
