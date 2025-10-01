import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { ValBase } from '../val/ValBase';
declare class OpVal extends ValBase {
    isOpVal: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    append(part: any): void;
    make(ctx: Context, _spec: ValSpec): Val;
    opname(): string;
    unify(peer: Val, ctx: Context): Val;
    same(peer: Val): boolean;
    clone(ctx: Context, _spec?: ValSpec): Val;
    operate(ctx: Context, _args: Val[]): Val | undefined;
    get canon(): string;
    gen(ctx?: Context): undefined;
}
export { OpVal, };
