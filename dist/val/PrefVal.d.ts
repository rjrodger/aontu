import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { ValBase } from '../val/ValBase';
declare class PrefVal extends ValBase {
    isPrefVal: boolean;
    superpeg: Val;
    rank: number;
    constructor(spec: {
        peg: any;
    }, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    same(peer: Val): boolean;
    clone(ctx: Context, spec?: ValSpec): Val;
    get canon(): string;
    gen(ctx?: Context): any;
}
export { PrefVal, };
