import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { ValBase } from '../val/ValBase';
declare class ConjunctVal extends ValBase {
    isConjunctVal: boolean;
    constructor(spec: {
        peg: Val[];
    }, ctx?: Context);
    append(peer: Val): ConjunctVal;
    unify(peer: Val, ctx: Context): Val;
    clone(spec?: ValSpec, ctx?: Context): Val;
    get canon(): any;
    gen(ctx?: Context): undefined;
}
declare function norm(terms: Val[]): Val[];
export { norm, ConjunctVal, };
