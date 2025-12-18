import type { ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { Val } from './Val';
declare class NilVal extends Val {
    isNil: boolean;
    isGenable: boolean;
    nil: boolean;
    why: any;
    primary?: Val;
    secondary?: Val;
    msg: string;
    attempt?: string;
    details?: Record<string, any>;
    static make: (ctx?: AontuContext, why?: any, av?: Val, bv?: Val, attempt?: string, details?: Record<string, any>) => NilVal;
    constructor(spec?: {
        why?: string;
        msg?: string;
        err?: NilVal | NilVal[] | Error | Error[];
    } | string, ctx?: AontuContext);
    unify(_peer: Val, _ctx: AontuContext): this;
    clone(ctx: AontuContext, spec?: ValSpec): Val;
    get canon(): string;
    gen(ctx: AontuContext): undefined;
    superior(): Val;
    inspection(): any;
}
export { NilVal, };
