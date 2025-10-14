import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { BaseVal } from '../val/BaseVal';
declare class PrefVal extends BaseVal {
    isPrefVal: boolean;
    superpeg: Val;
    rank: number;
    constructor(spec: ValSpec, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    same(peer: Val): boolean;
    clone(ctx: Context, spec?: ValSpec): Val;
    get canon(): string;
    gen(ctx?: Context): any;
}
export { PrefVal, };
