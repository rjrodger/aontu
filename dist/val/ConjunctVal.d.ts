import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { JunctionVal } from './JunctionVal';
declare class ConjunctVal extends JunctionVal {
    isConjunct: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    append(peer: Val): ConjunctVal;
    unify(peer: Val, ctx: Context, trace?: any[]): Val;
    clone(ctx: Context, spec?: ValSpec): Val;
    getJunctionSymbol(): string;
    gen(ctx?: Context): undefined;
}
declare function norm(terms: Val[]): Val[];
export { norm, ConjunctVal, };
