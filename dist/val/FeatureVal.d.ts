import type { ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { Val } from './Val';
declare abstract class FeatureVal extends Val {
    isFeature: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    superior(): Val;
}
export { FeatureVal, };
