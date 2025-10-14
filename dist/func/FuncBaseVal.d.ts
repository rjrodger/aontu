import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { FeatureVal } from '../val/FeatureVal';
declare class FuncBaseVal extends FeatureVal {
    isFuncVal: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    make(ctx: Context, _spec: ValSpec): Val;
    unify(peer: Val, ctx: Context): Val;
    get canon(): string;
    funcname(): string;
    resolve(ctx: Context | undefined, _args: Val[]): Val;
}
export { FuncBaseVal, };
