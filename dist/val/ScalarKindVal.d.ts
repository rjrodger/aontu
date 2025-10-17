import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { BaseVal } from './BaseVal';
declare class Integer {
}
declare class Null {
}
type ScalarConstructor = StringConstructor | NumberConstructor | BooleanConstructor | (typeof Integer.constructor);
declare class ScalarKindVal extends BaseVal {
    isScalarKind: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    same(peer: any): boolean;
    superior(): Val;
}
export { Integer, Null, ScalarConstructor, ScalarKindVal, };
