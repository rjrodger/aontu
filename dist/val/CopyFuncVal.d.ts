import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { NilVal } from '../val/NilVal';
import { FuncBaseVal } from './FuncBaseVal';
declare class CopyFuncVal extends FuncBaseVal {
    isCopyFunc: boolean;
    resolved?: Val;
    constructor(spec: ValSpec, ctx?: AontuContext);
    make(_ctx: AontuContext, spec: ValSpec): Val;
    funcname(): string;
    resolve(ctx: AontuContext | undefined, args: Val[]): Val | NilVal;
}
export { CopyFuncVal, };
