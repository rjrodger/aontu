import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { FeatureVal } from '../val/FeatureVal';
declare class FuncBaseVal extends FeatureVal {
    isFunc: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    validateArgs(args: Val[], min: number): void;
    make(ctx: Context, _spec: ValSpec): Val;
    unify(peer: Val, ctx: Context, explain?: any[]): Val;
    get canon(): string;
    funcname(): string;
    prepare(_ctx: Context | undefined, args: Val[]): Val[];
    resolve(ctx: Context | undefined, _args: Val[]): Val;
}
export { FuncBaseVal, };
