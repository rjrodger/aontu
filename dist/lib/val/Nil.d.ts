import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { ValBase } from '../val/ValBase';
declare class Nil extends ValBase {
    nil: boolean;
    why: any;
    primary?: Val;
    secondary?: Val;
    msg: string;
    static make: (ctx?: Context, why?: any, av?: Val, bv?: Val) => Nil;
    constructor(spec?: any, ctx?: Context);
    unify(_peer: Val, _ctx: Context): this;
    clone(spec?: ValSpec, ctx?: Context): Val;
    get canon(): string;
    gen(_ctx?: Context): undefined;
}
export { Nil, };
