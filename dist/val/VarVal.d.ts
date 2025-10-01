import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { ValBase } from './ValBase';
declare class VarVal extends ValBase {
    isVarVal: boolean;
    constructor(spec: {
        peg: string | Val;
    }, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    same(peer: Val): boolean;
    clone(ctx: Context, spec?: ValSpec): Val;
    get canon(): string;
    gen(ctx?: Context): undefined;
}
export { VarVal, };
