import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { FuncBaseVal } from './FuncBaseVal';
declare const NAMER_STYLES: string[];
declare class NamerFuncVal extends FuncBaseVal {
    isNamerFunc: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    make(_ctx: AontuContext, spec: ValSpec): Val;
    funcname(): string;
    resolve(ctx: AontuContext, args: Val[]): Val;
}
export { NAMER_STYLES, NamerFuncVal, };
