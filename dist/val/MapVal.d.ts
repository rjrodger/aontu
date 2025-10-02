import type { Val, ValMap, ValSpec } from '../type';
import { Context } from '../unify';
import { BaseVal } from './BaseVal';
declare class MapVal extends BaseVal {
    isMapVal: boolean;
    static SPREAD: symbol;
    spread: {
        cj: Val | undefined;
    };
    constructor(spec: {
        peg: ValMap;
    }, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    clone(ctx: Context, spec?: ValSpec): Val;
    get canon(): string;
    gen(ctx?: Context): any;
}
export { MapVal };
