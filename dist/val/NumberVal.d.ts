import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { ScalarVal } from './ScalarVal';
declare class NumberVal extends ScalarVal {
    isNumber: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    unify(peer: any, ctx: AontuContext): Val;
}
export { NumberVal, };
