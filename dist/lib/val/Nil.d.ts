import type { Val } from '../type';
import { Context } from '../unify';
import { ValBase } from '../val/ValBase';
declare class Nil extends ValBase {
    nil: boolean;
    why: any;
    primary?: Val;
    secondary?: Val;
    msg: string;
    static make: (ctx?: Context, why?: any, av?: Val, bv?: Val) => Nil;
    constructor(why?: any, ctx?: Context);
    unify(_peer: Val, _ctx: Context): this;
    clone(ctx?: Context): Val;
    get canon(): string;
    gen(_ctx?: Context): undefined;
}
export { Nil, };
