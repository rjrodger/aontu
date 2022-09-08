import type { Val } from './type';
import { Context } from './unify';
import { ValBase } from './val/ValBase';
declare class Integer {
}
declare type ScalarConstructor = StringConstructor | NumberConstructor | BooleanConstructor | (typeof Integer.constructor);
declare class ScalarTypeVal extends ValBase {
    constructor(peg: ScalarConstructor, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    same(peer: Val): boolean;
    gen(_ctx?: Context): undefined;
}
declare class ScalarVal<T> extends ValBase {
    type: any;
    constructor(peg: T, type: ScalarConstructor, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    same(peer: Val): boolean;
    gen(_ctx?: Context): any;
}
declare class NumberVal extends ScalarVal<number> {
    constructor(peg: number, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
}
declare class IntegerVal extends ScalarVal<number> {
    constructor(peg: number, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
}
declare class StringVal extends ScalarVal<string> {
    constructor(peg: string, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    get canon(): string;
}
declare class BooleanVal extends ScalarVal<boolean> {
    constructor(peg: boolean, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    static TRUE: BooleanVal;
    static FALSE: BooleanVal;
}
export { Integer, ScalarTypeVal, NumberVal, StringVal, BooleanVal, IntegerVal, };
