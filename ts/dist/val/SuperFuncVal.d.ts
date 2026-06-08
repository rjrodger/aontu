import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { FuncBaseVal } from './FuncBaseVal';
declare class SuperFuncVal extends FuncBaseVal {
    isSuperFunc: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    make(_ctx: AontuContext, spec: ValSpec): Val;
    funcname(): string;
    resolve(_ctx: AontuContext, _args: Val[]): Val;
}
export { SuperFuncVal, };
