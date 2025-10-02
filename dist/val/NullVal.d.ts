import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { BaseVal } from './BaseVal';
declare class NullVal extends BaseVal {
    isNullVal: boolean;
    constructor(spec: {
        peg: null;
    }, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    same(peer: Val): boolean;
    clone(ctx: Context, spec?: ValSpec): Val;
    get canon(): string;
    gen(_ctx?: Context): null;
}
export { NullVal, };
