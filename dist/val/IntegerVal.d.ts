import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { ScalarVal } from './ScalarVal';
declare class IntegerVal extends ScalarVal {
    isInteger: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    unify(peer: any, ctx: AontuContext, explain?: any[]): Val;
}
export { IntegerVal, };
