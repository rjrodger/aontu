import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { BaseVal } from './BaseVal';
declare class ScalarVal extends BaseVal {
    kind: any;
    isScalar: boolean;
    src: string;
    constructor(spec: ValSpec, ctx?: AontuContext);
    clone(ctx: AontuContext, spec?: ValSpec): Val;
    unify(peer: Val, ctx: AontuContext, explain?: any[]): Val;
    get canon(): any;
    same(peer: any): boolean;
    gen(_ctx?: AontuContext): any;
    superior(): Val;
}
export { ScalarVal, };
