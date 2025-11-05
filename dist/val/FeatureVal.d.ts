import type { ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { BaseVal } from './BaseVal';
declare abstract class FeatureVal extends BaseVal {
    isFeature: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
}
export { FeatureVal, };
