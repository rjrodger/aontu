import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { FeatureVal } from './FeatureVal';
import { MapVal } from './MapVal';
import { ListVal } from './ListVal';
declare class SpreadVal extends FeatureVal {
    isSpread: boolean;
    isGenable: boolean;
    cjo: number;
    constructor(spec: ValSpec, ctx?: AontuContext);
    unify(peer: Val, ctx: AontuContext): Val;
    applyToMap(map: MapVal, ctx: AontuContext, te: any): Val;
    applyToList(list: ListVal, ctx: AontuContext, te: any): Val;
    clone(ctx: AontuContext, spec?: ValSpec): Val;
    spreadClone(ctx: AontuContext): Val;
    get canon(): string;
    gen(_ctx: AontuContext): undefined;
    inspection(): string;
}
export { SpreadVal, };
