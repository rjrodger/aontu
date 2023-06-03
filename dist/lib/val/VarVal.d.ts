import type { Val } from '../type';
import { Context } from '../unify';
import { ValBase } from '../val/ValBase';
declare class VarVal extends ValBase {
    constructor(peg: string | Val, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    same(peer: Val): boolean;
    clone(ctx?: Context): Val;
    get canon(): string;
    gen(ctx?: Context): undefined;
}
export { VarVal, };
