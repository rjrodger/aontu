import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { BaseVal } from './BaseVal';
declare abstract class FeatureVal extends BaseVal {
    isScalarKindVal: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    superior(): Val;
}
export { FeatureVal, };
