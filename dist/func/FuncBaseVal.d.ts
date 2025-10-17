import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { FeatureVal } from '../val/FeatureVal';
declare class FuncBaseVal extends FeatureVal {
    isFunc: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    validateArgs(args: Val[], min: number): void;
    make(ctx: Context, _spec: ValSpec): Val;
    unify(peer: Val, ctx: Context): Val;
    get canon(): string;
    funcname(): string;
    resolve(ctx: Context | undefined, _args: Val[]): Val;
    superior(): Val;
}
export { FuncBaseVal, };
