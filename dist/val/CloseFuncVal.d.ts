import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { FuncBaseVal } from './FuncBaseVal';
declare class CloseFuncVal extends FuncBaseVal {
    isCloseFunc: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    make(_ctx: AontuContext, spec: ValSpec): Val;
    funcname(): string;
    resolve(ctx: AontuContext, args: Val[]): any;
}
export { CloseFuncVal, };
