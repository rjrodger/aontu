import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { OpBaseVal } from './OpBaseVal';
declare function plusText(v: Val): string | undefined;
declare class PlusOpVal extends OpBaseVal {
    isPlusOp: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    make(_ctx: AontuContext, spec: ValSpec): Val;
    opname(): string;
    operate(ctx: AontuContext, args: Val[]): Val | undefined;
    get canon(): string;
}
export { PlusOpVal, plusText, };
