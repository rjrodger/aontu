import type { Val } from '../type';
import { ValBase } from '../val/ValBase';
import { Context } from '../unify';
declare class ConjunctVal extends ValBase {
    constructor(peg: Val[], ctx?: Context);
    append(peer: Val): ConjunctVal;
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    gen(ctx?: Context): any;
}
export { ConjunctVal };
