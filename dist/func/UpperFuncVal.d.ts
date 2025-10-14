import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { NilVal, StringVal } from '../val';
import { FuncBaseVal } from './FuncBaseVal';
declare class UpperFuncVal extends FuncBaseVal {
    isUpperFuncVal: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    make(_ctx: Context, spec: ValSpec): Val;
    funcname(): string;
    resolve(_ctx: Context | undefined, args: Val[]): NilVal | StringVal;
}
export { UpperFuncVal, };
