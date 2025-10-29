import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { Site } from '../lang';
import { PrefVal } from '../val/PrefVal';
import { JunctionVal } from '../val/JunctionVal';
declare class DisjunctVal extends JunctionVal {
    isDisjunct: boolean;
    prefsRanked: boolean;
    constructor(spec: {
        peg: Val[];
    }, ctx?: Context, _sites?: Site[]);
    append(peer: Val): DisjunctVal;
    unify(peer: Val, ctx: Context, trace?: any[]): Val;
    rankPrefs(ctx: Context): PrefVal | undefined;
    clone(ctx: Context, spec?: ValSpec): Val;
    getJunctionSymbol(): string;
    gen(ctx: Context): any;
}
export { DisjunctVal, };
