import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { Site } from '../lang';
import { PrefVal } from '../val/PrefVal';
import { FeatureVal } from '../val/FeatureVal';
declare class DisjunctVal extends FeatureVal {
    isDisjunct: boolean;
    isBinaryOp: boolean;
    prefsRanked: boolean;
    constructor(spec: {
        peg: Val[];
    }, ctx?: Context, _sites?: Site[]);
    append(peer: Val): DisjunctVal;
    unify(peer: Val, ctx: Context): Val;
    rankPrefs(ctx: Context): PrefVal | undefined;
    clone(ctx: Context, spec?: ValSpec): Val;
    get canon(): any;
    gen(ctx: Context): any;
}
export { DisjunctVal, };
