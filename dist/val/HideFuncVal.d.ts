import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { FuncBaseVal } from './FuncBaseVal';
declare class HideFuncVal extends FuncBaseVal {
    isHideFunc: boolean;
    resolved?: Val;
    constructor(spec: ValSpec, ctx?: AontuContext);
    make(_ctx: AontuContext, spec: ValSpec): Val;
    funcname(): string;
    unify(peer: Val, ctx: AontuContext, trace?: any[]): Val;
    resolve(ctx: AontuContext, args: Val[]): Val;
}
export { HideFuncVal, };
