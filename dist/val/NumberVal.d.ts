import type { Val } from '../type';
import { Context } from '../unify';
import { ScalarVal } from './ScalarVal';
declare class NumberVal extends ScalarVal<number> {
    isNumberVal: boolean;
    constructor(spec: {
        peg: number;
    }, ctx?: Context);
    unify(peer: any, ctx?: Context): Val;
}
export { NumberVal, };
