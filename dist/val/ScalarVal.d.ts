import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { ValBase } from './ValBase';
import { ScalarConstructor } from './ScalarTypeVal';
declare class ScalarVal<T> extends ValBase {
    type: any;
    isScalarVal: boolean;
    constructor(spec: {
        peg: T;
        type: ScalarConstructor;
    }, ctx?: Context);
    clone(ctx: Context, spec?: ValSpec): Val;
    unify(peer: any, ctx?: Context): Val;
    get canon(): any;
    same(peer: any): boolean;
    gen(_ctx?: Context): any;
}
export { ScalarVal, };
