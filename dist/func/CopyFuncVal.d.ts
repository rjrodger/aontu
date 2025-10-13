import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { Nil } from '../val';
import { FuncBaseVal } from './FuncBaseVal';
declare class CopyFuncVal extends FuncBaseVal {
    isCopyFuncVal: boolean;
    resolved?: Val;
    constructor(spec: ValSpec, ctx?: Context);
    make(_ctx: Context, spec: ValSpec): Val;
    funcname(): string;
    unify(peer: Val, ctx: Context): Val;
    resolve(ctx: Context | undefined, args: Val[]): Val | Nil;
}
export { CopyFuncVal, };
