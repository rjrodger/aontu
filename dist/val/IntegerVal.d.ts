import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { ScalarVal } from './ScalarVal';
declare class IntegerVal extends ScalarVal {
    isInteger: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    unify(peer: any, ctx: Context, explain?: any[]): Val;
}
export { IntegerVal, };
