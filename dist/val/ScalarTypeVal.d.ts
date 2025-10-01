import type { Val } from '../type';
import { Context } from '../unify';
import { ValBase } from './ValBase';
declare class Integer {
}
type ScalarConstructor = StringConstructor | NumberConstructor | BooleanConstructor | (typeof Integer.constructor);
declare class ScalarTypeVal extends ValBase {
    isScalarTypeVal: boolean;
    constructor(spec: {
        peg: ScalarConstructor;
    }, ctx?: Context);
    unify(peer: any, ctx?: Context): Val;
    get canon(): any;
    same(peer: any): boolean;
}
export { Integer, ScalarConstructor, ScalarTypeVal, };
