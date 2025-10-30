import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { BaseVal } from './BaseVal';
declare class ScalarVal extends BaseVal {
    kind: any;
    isScalar: boolean;
    src: string;
    constructor(spec: ValSpec, ctx?: Context);
    clone(ctx: Context, spec?: ValSpec): Val;
    unify(peer: Val, ctx: Context, explain?: any[]): Val;
    get canon(): any;
    same(peer: any): boolean;
    gen(_ctx?: Context): any;
    superior(): Val;
}
export { ScalarVal, };
