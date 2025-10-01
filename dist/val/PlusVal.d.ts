import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { IntegerVal, NumberVal, StringVal } from '../val';
import { OpVal } from './OpVal';
declare class PlusVal extends OpVal {
    isOpVal: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    make(_ctx: Context, spec: ValSpec): Val;
    opname(): string;
    operate(ctx: Context, args: Val[]): StringVal | IntegerVal | NumberVal | undefined;
    get canon(): string;
}
export { PlusVal, };
