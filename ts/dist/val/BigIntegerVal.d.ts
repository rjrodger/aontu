import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { ScalarVal } from './ScalarVal';
declare class BigIntegerVal extends ScalarVal {
    isBigInteger: boolean;
    peg: bigint;
    constructor(spec: ValSpec, ctx?: AontuContext);
    unify(peer: any, ctx: AontuContext): Val;
    get canon(): string;
}
export { BigIntegerVal, };
