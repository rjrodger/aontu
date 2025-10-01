import { Context } from '../unify';
import { IntegerVal, NumberVal, StringVal } from '../val';
import { OpVal } from './OpVal';
declare class PlusVal extends OpVal {
    isOpVal: boolean;
    constructor(spec: {
        peg: any[];
    }, ctx?: Context);
    operate(ctx: Context): IntegerVal | StringVal | NumberVal | undefined;
    get canon(): string;
}
export { PlusVal, };
