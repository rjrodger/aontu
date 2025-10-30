import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { FeatureVal } from './FeatureVal';
declare class VarVal extends FeatureVal {
    isVar: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    unify(peer: Val, ctx: Context, explain?: any[]): Val;
    same(peer: Val): boolean;
    clone(ctx: Context, spec?: ValSpec): Val;
    get canon(): string;
    gen(ctx?: Context): undefined;
}
export { VarVal, };
