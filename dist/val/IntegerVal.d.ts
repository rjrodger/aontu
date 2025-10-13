import type { Val } from '../type';
import { Context } from '../unify';
import { ScalarVal } from './ScalarVal';
declare class IntegerVal extends ScalarVal {
    isIntegerVal: boolean;
    constructor(spec: {
        peg: number;
    }, ctx?: Context);
    unify(peer: any, ctx: Context): Val;
}
export { IntegerVal, };
