import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { ScalarVal } from './ScalarVal';
declare class NumberVal extends ScalarVal {
    isNumberVal: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    unify(peer: any, ctx: Context): Val;
}
export { NumberVal, };
