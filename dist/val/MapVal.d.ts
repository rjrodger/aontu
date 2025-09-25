import type { Val, ValMap, ValSpec } from '../type';
import { Context } from '../unify';
import { ValBase } from '../val/ValBase';
declare class MapVal extends ValBase {
    isMapVal: boolean;
    static SPREAD: symbol;
    spread: {
        cj: Val | undefined;
    };
    constructor(spec: {
        peg: ValMap;
    }, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    clone(spec?: ValSpec, ctx?: Context): Val;
    get canon(): string;
    gen(ctx?: Context): any;
}
export { MapVal };
