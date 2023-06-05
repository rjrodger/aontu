import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { ValBase } from '../val/ValBase';
declare class VarVal extends ValBase {
    constructor(spec: {
        peg: string | Val;
    }, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    same(peer: Val): boolean;
    clone(spec?: ValSpec, ctx?: Context): Val;
    get canon(): string;
    gen(ctx?: Context): undefined;
}
export { VarVal, };
