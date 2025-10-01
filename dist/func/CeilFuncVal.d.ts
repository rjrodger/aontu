import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { Nil, IntegerVal } from '../val';
import { FuncValBase } from './FuncValBase';
declare class CeilFuncVal extends FuncValBase {
    isCeilFuncVal: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    make(_ctx: Context, spec: ValSpec): Val;
    funcname(): string;
    resolve(_ctx: Context | undefined, args: Val[]): Nil | IntegerVal;
}
export { CeilFuncVal, };
