import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { ValBase } from '../val/ValBase';
declare class Nil extends ValBase {
    isNil: boolean;
    nil: boolean;
    why: any;
    primary?: Val;
    secondary?: Val;
    msg: string;
    static make: (ctx?: Context, why?: any, av?: Val, bv?: Val) => Nil;
    constructor(spec?: {
        why?: string;
        msg?: string;
        err?: Nil | Nil[] | Error | Error[];
    } | string, ctx?: Context);
    unify(_peer: Val, _ctx: Context): this;
    clone(spec?: ValSpec, ctx?: Context): Val;
    get canon(): string;
    gen(ctx?: Context): undefined;
}
export { Nil, };
