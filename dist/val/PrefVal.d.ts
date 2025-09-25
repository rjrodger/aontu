import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { ValBase } from '../val/ValBase';
declare class PrefVal extends ValBase {
    isPrefVal: boolean;
    pref: Val;
    constructor(spec: {
        peg: any;
        pref?: any;
    }, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    same(peer: Val): boolean;
    clone(spec?: ValSpec, ctx?: Context): Val;
    get canon(): any;
    gen(ctx?: Context): any;
}
export { PrefVal, };
