import type { ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { Val } from './Val';
import { FeatureVal } from './FeatureVal';
declare abstract class BagVal extends FeatureVal {
    isBag: boolean;
    closed: boolean;
    optionalKeys: string[];
    spread: {
        cj: Val | undefined;
    };
    from?: Val;
    constructor(spec: ValSpec, ctx?: AontuContext);
    gen(ctx: AontuContext): any;
}
export { BagVal, };
