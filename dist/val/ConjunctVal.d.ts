import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { ValBase } from './ValBase';
declare class ConjunctVal extends ValBase {
    isBinaryOp: boolean;
    isConjunctVal: boolean;
    constructor(spec: {
        peg: Val[];
    }, ctx?: Context);
    append(peer: Val): ConjunctVal;
    unify(peer: Val, ctx: Context): Val;
    clone(ctx: Context, spec?: ValSpec): Val;
    get canon(): any;
    gen(ctx?: Context): undefined;
}
declare function norm(terms: Val[]): Val[];
export { norm, ConjunctVal, };
