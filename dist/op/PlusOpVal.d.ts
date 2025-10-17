import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { IntegerVal, NumberVal, StringVal, BooleanVal } from '../val';
import { OpBaseVal } from './OpBaseVal';
declare class PlusOpVal extends OpBaseVal {
    isOpVal: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    make(_ctx: Context, spec: ValSpec): Val;
    opname(): string;
    operate(_ctx: Context, args: Val[]): StringVal | NumberVal | BooleanVal | IntegerVal | undefined;
    get canon(): string;
}
export { PlusOpVal, };
