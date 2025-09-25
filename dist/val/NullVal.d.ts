import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { ValBase } from '../val/ValBase';
declare class NullVal extends ValBase {
    isNullVal: boolean;
    constructor(spec: {
        peg: null;
    }, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    same(peer: Val): boolean;
    clone(spec?: ValSpec, ctx?: Context): Val;
    get canon(): string;
    gen(_ctx?: Context): null;
}
export { NullVal, };
