import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { FuncBaseVal } from './FuncBaseVal';
declare class MoveFuncVal extends FuncBaseVal {
    isMoveFunc: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    make(_ctx: AontuContext, spec: ValSpec): Val;
    funcname(): string;
    prepare(_ctx: AontuContext, _args: Val[]): null;
    resolve(ctx: AontuContext, args: Val[]): Val;
}
export { MoveFuncVal, };
