import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { IntegerVal } from '../val/IntegerVal';
import { NumberVal } from '../val/NumberVal';
import { StringVal } from '../val/StringVal';
import { BooleanVal } from '../val/BooleanVal';
import { OpBaseVal } from './OpBaseVal';
declare class PlusOpVal extends OpBaseVal {
    isPlusOp: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    make(_ctx: Context, spec: ValSpec): Val;
    opname(): string;
    operate(_ctx: Context, args: Val[]): StringVal | BooleanVal | IntegerVal | NumberVal | undefined;
    get canon(): string;
}
export { PlusOpVal, };
