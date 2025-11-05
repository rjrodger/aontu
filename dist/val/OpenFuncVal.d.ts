import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { FuncBaseVal } from './FuncBaseVal';
declare class OpenFuncVal extends FuncBaseVal {
    isOpenFunc: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    make(_ctx: AontuContext, spec: ValSpec): Val;
    funcname(): string;
    resolve(ctx: AontuContext | undefined, args: Val[]): any;
}
export { OpenFuncVal, };
