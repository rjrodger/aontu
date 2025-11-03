import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { FuncBaseVal } from './FuncBaseVal';
declare class HideFuncVal extends FuncBaseVal {
    isHideFunc: boolean;
    resolved?: Val;
    constructor(spec: ValSpec, ctx?: Context);
    make(_ctx: Context, spec: ValSpec): Val;
    funcname(): string;
    unify(peer: Val, ctx: Context, trace?: any[]): Val;
    resolve(ctx: Context, args: Val[]): Val;
}
export { HideFuncVal, };
