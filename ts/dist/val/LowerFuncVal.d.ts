import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { FuncBaseVal } from './FuncBaseVal';
declare class LowerFuncVal extends FuncBaseVal {
    isLower: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    make(_ctx: AontuContext, spec: ValSpec): Val;
    funcname(): string;
    resolve(ctx: AontuContext | undefined, args: Val[]): Val;
    superior(): Val;
}
export { LowerFuncVal, };
