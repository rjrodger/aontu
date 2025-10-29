import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { NilVal } from '../val';
import { FuncBaseVal } from './FuncBaseVal';
declare class CopyFuncVal extends FuncBaseVal {
    isCopyFunc: boolean;
    resolved?: Val;
    constructor(spec: ValSpec, ctx?: Context);
    make(_ctx: Context, spec: ValSpec): Val;
    funcname(): string;
    resolve(ctx: Context | undefined, args: Val[]): Val | NilVal;
}
export { CopyFuncVal, };
