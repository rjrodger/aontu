import type { Val } from '../type';
import { Context } from '../unify';
import { ScalarVal } from './ScalarVal';
declare class BooleanVal extends ScalarVal {
    isBoolean: boolean;
    constructor(spec: {
        peg: boolean;
    }, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
}
export { BooleanVal, };
