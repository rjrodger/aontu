import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { Site } from '../site';
import { PrefVal } from '../val/PrefVal';
import { JunctionVal } from '../val/JunctionVal';
declare class DisjunctVal extends JunctionVal {
    isDisjunct: boolean;
    prefsRanked: boolean;
    constructor(spec: {
        peg: Val[];
    }, ctx?: AontuContext, _sites?: Site[]);
    append(peer: Val): DisjunctVal;
    unify(peer: Val, ctx: AontuContext, trace?: any[]): Val;
    rankPrefs(ctx: AontuContext): PrefVal | undefined;
    clone(ctx: AontuContext, spec?: ValSpec): Val;
    getJunctionSymbol(): string;
    gen(ctx: AontuContext): any;
}
export { DisjunctVal, };
