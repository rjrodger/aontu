import type { ValSpec } from '../type';
import { Context } from '../unify';
import { FeatureVal } from './FeatureVal';
declare abstract class BagVal extends FeatureVal {
    isBag: boolean;
    closed: boolean;
    optionalKeys: string[];
    constructor(spec: ValSpec, ctx?: Context);
}
export { BagVal, };
