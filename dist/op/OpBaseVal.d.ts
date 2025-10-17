import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { FeatureVal } from '../val/FeatureVal';
declare class OpBaseVal extends FeatureVal {
    isPlusOp: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    append(part: any): void;
    make(ctx: Context, _spec: ValSpec): Val;
    opname(): string;
    unify(peer: Val, ctx: Context): Val;
    same(peer: Val): boolean;
    clone(ctx: Context, _spec?: ValSpec): Val;
    operate(ctx: Context, _args: Val[]): Val | undefined;
    get canon(): string;
    primatize(v: any): undefined | null | string | number | boolean;
    gen(ctx?: Context): undefined;
}
export { OpBaseVal, };
