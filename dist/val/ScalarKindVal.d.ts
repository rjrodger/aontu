import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { FeatureVal } from './FeatureVal';
declare class Integer {
}
declare class Null {
}
type ScalarConstructor = StringConstructor | NumberConstructor | BooleanConstructor | (typeof Integer.constructor);
declare class ScalarKindVal extends FeatureVal {
    isScalarKind: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    unify(peer: Val, ctx: AontuContext, trace?: any[]): Val;
    get canon(): any;
    same(peer: any): boolean;
}
export { Integer, Null, ScalarConstructor, ScalarKindVal, };
