import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { ValBase } from '../val/ValBase';
declare class OpVal extends ValBase {
    isOpVal: boolean;
    constructor(spec: {
        peg: any[];
    }, ctx?: Context);
    append(part: any): void;
    unify(peer: Val, ctx: Context): Val;
    same(peer: Val): boolean;
    clone(_spec?: ValSpec, ctx?: Context): Val;
    operate(ctx: Context): Val | undefined;
    get canon(): string;
    gen(ctx?: Context): undefined;
}
export { OpVal, };
