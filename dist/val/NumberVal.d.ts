import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { ScalarVal } from './ScalarVal';
declare class NumberVal extends ScalarVal {
    isNumber: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    unify(peer: any, ctx: Context, trace?: any[]): Val;
}
export { NumberVal, };
