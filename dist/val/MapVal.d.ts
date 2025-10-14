import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { FeatureVal } from './FeatureVal';
declare class MapVal extends FeatureVal {
    isMapVal: boolean;
    static SPREAD: symbol;
    spread: {
        cj: Val | undefined;
    };
    constructor(spec: ValSpec, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    clone(ctx: Context, spec?: ValSpec): Val;
    get canon(): string;
    gen(ctx?: Context): any;
}
export { MapVal };
