import type { Val } from '../type';
import { Context } from '../unify';
import { ValBase } from '../val/ValBase';
declare class ConjunctVal extends ValBase {
    constructor(peg: Val[], ctx?: Context);
    append(peer: Val): ConjunctVal;
    unify(peer: Val, ctx: Context): Val;
    clone(ctx?: Context): Val;
    get canon(): any;
    gen(ctx?: Context): void;
}
declare function norm(terms: Val[]): Val[];
export { norm, ConjunctVal, };
