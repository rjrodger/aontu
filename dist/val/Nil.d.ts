import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { BaseVal } from './BaseVal';
declare class Nil extends BaseVal {
    isNil: boolean;
    nil: boolean;
    why: any;
    primary?: Val;
    secondary?: Val;
    msg: string;
    attempt?: string;
    static make: (ctx?: Context, why?: any, av?: Val, bv?: Val, attempt?: string) => Nil;
    constructor(spec?: {
        why?: string;
        msg?: string;
        err?: Nil | Nil[] | Error | Error[];
    } | string, ctx?: Context);
    unify(_peer: Val, _ctx: Context): this;
    clone(ctx: Context, spec?: ValSpec): Val;
    get canon(): string;
    gen(ctx?: Context): undefined;
}
export { Nil, };
