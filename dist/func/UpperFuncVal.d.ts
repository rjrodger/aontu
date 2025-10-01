import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { Nil, StringVal } from '../val';
import { FuncValBase } from './FuncValBase';
declare class UpperFuncVal extends FuncValBase {
    isUpperFuncVal: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    make(_ctx: Context, spec: ValSpec): Val;
    funcname(): string;
    resolve(_ctx: Context | undefined, args: Val[]): Nil | StringVal;
}
export { UpperFuncVal, };
