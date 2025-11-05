import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { FeatureVal } from './FeatureVal';
declare class OpBaseVal extends FeatureVal {
    isPlusOp: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    append(part: any): void;
    make(ctx: AontuContext, _spec: ValSpec): Val;
    opname(): string;
    unify(peer: Val, ctx: AontuContext, trace?: any[]): Val;
    same(peer: Val): boolean;
    clone(ctx: AontuContext, _spec?: ValSpec): Val;
    operate(ctx: AontuContext, _args: Val[]): Val | undefined;
    get canon(): string;
    primatize(v: any): undefined | null | string | number | boolean;
    gen(ctx?: AontuContext): undefined;
}
export { OpBaseVal, };
