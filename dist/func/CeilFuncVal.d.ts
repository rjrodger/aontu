import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { NilVal, IntegerVal } from '../val';
import { FuncBaseVal } from './FuncBaseVal';
declare class CeilFuncVal extends FuncBaseVal {
    isCeilFuncVal: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    make(_ctx: Context, spec: ValSpec): Val;
    funcname(): string;
    resolve(_ctx: Context | undefined, args: Val[]): NilVal | IntegerVal;
}
export { CeilFuncVal, };
