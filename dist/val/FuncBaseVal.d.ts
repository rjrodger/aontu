import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { FeatureVal } from '../val/FeatureVal';
declare class FuncBaseVal extends FeatureVal {
    isFunc: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    validateArgs(args: Val[], min: number): void;
    make(ctx: AontuContext, _spec: ValSpec): Val;
    unify(peer: Val, ctx: AontuContext): Val;
    get canon(): string;
    funcname(): string;
    prepare(_ctx: AontuContext, args: Val[]): Val[] | null;
    resolve(ctx: AontuContext, _args: Val[]): Val;
}
export { FuncBaseVal, };
