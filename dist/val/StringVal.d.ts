import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { ScalarVal } from './ScalarVal';
declare class StringVal extends ScalarVal {
    isString: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    unify(peer: Val, ctx: AontuContext): Val;
    get canon(): string;
}
export { StringVal, };
