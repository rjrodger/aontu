import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { Site } from '../lang';
import { Nil } from '../val/Nil';
import { PrefVal } from '../val/PrefVal';
import { ValBase } from '../val/ValBase';
declare class DisjunctVal extends ValBase {
    isDisjunctVal: boolean;
    isBinaryOp: boolean;
    prefsRanked: boolean;
    constructor(spec: {
        peg: Val[];
    }, ctx?: Context, _sites?: Site[]);
    append(peer: Val): DisjunctVal;
    unify(peer: Val, ctx: Context): Val;
    rankPrefs(ctx: Context): Nil | PrefVal | undefined;
    clone(spec?: ValSpec, ctx?: Context): Val;
    get canon(): any;
    gen(ctx?: Context): any;
}
export { DisjunctVal, };
