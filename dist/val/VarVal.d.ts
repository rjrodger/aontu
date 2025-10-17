import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { FeatureVal } from './FeatureVal';
declare class VarVal extends FeatureVal {
    isVar: boolean;
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
