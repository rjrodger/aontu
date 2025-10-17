import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { FeatureVal } from './FeatureVal';
declare abstract class JunctionVal extends FeatureVal {
    isBinaryOp: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    append(peer: Val): JunctionVal;
    clone(ctx: Context, spec?: ValSpec): Val;
    get canon(): any;
    abstract getJunctionSymbol(): string;
}
export { JunctionVal, };
