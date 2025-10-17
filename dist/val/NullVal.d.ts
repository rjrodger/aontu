import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { ScalarVal } from './ScalarVal';
declare class NullVal extends ScalarVal {
    isNull: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
}
export { NullVal, };
