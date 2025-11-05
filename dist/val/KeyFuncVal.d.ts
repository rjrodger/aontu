import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { FuncBaseVal } from './FuncBaseVal';
declare class KeyFuncVal extends FuncBaseVal {
    isKeyFunc: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    make(_ctx: AontuContext, spec: ValSpec): Val;
    funcname(): string;
    resolve(_ctx: AontuContext, _args: Val[]): Val;
    gen(_ctx: AontuContext): any;
}
export { KeyFuncVal, };
