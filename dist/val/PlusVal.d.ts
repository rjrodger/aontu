import { Context } from '../unify';
import { IntegerVal, NumberVal, StringVal } from '../val';
import { OpVal } from '../val/OpVal';
declare class PlusVal extends OpVal {
    isOpVal: boolean;
    constructor(spec: {
        peg: any[];
    }, ctx?: Context);
    operate(ctx: Context): StringVal | IntegerVal | NumberVal | undefined;
    get canon(): string;
}
export { PlusVal, };
