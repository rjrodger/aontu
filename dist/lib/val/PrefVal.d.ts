import type { Val } from '../type';
import { Context } from '../unify';
import { ValBase } from '../val/ValBase';
declare class PrefVal extends ValBase {
    pref: Val;
    constructor(peg: any, pref?: any, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    same(peer: Val): boolean;
    clone(ctx?: Context): Val;
    get canon(): any;
    gen(ctx?: Context): any;
}
export { PrefVal, };
