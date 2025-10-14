import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { Nil, StringVal } from '../val';
import { FuncBaseVal } from './FuncBaseVal';
declare class LowerFuncVal extends FuncBaseVal {
    isLowerFuncVal: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    make(_ctx: Context, spec: ValSpec): Val;
    funcname(): string;
    resolve(_ctx: Context | undefined, args: Val[]): StringVal | Nil;
}
export { LowerFuncVal, };
