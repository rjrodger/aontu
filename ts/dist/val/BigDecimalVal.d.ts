import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { ScalarVal } from './ScalarVal';
import { Decimal } from './Decimal';
declare class BigDecimalVal extends ScalarVal {
    isBigDecimal: boolean;
    peg: Decimal;
    constructor(spec: ValSpec, ctx?: AontuContext);
    unify(peer: any, ctx: AontuContext): Val;
    samePeg(peg: any): boolean;
    get canon(): string;
}
export { BigDecimalVal, };
