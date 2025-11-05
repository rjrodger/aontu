import type { ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { FeatureVal } from './FeatureVal';
declare abstract class BagVal extends FeatureVal {
    isBag: boolean;
    closed: boolean;
    optionalKeys: string[];
    constructor(spec: ValSpec, ctx?: AontuContext);
}
export { BagVal, };
