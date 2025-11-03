import type { ValSpec } from '../type';
import { Context } from '../unify';
import { BaseVal } from './BaseVal';
declare abstract class FeatureVal extends BaseVal {
    isFeature: boolean;
    constructor(spec: ValSpec, ctx?: Context);
}
export { FeatureVal, };
