import type { Val, ValSpec } from './type';
import { Context } from './unify';
import { Site } from './lang';
import { ValBase } from './val/ValBase';
declare class TopVal extends ValBase {
    isTop: boolean;
    id: number;
    top: boolean;
    peg: undefined;
    done: number;
    path: never[];
    row: number;
    col: number;
    url: string;
    constructor();
    unify(peer: Val, _ctx?: Context): Val;
    get canon(): string;
    get site(): Site;
    same(peer: Val): boolean;
    clone(): this;
    gen(_ctx?: Context): undefined;
}
declare const TOP: TopVal;
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
    gen(_ctx?: Context): undefined;
}
declare class ScalarVal<T> extends ValBase {
    type: any;
    isScalarVal: boolean;
    constructor(spec: {
        peg: T;
        type: ScalarConstructor;
    }, ctx?: Context);
    clone(spec?: ValSpec, ctx?: Context): Val;
    unify(peer: any, ctx?: Context): Val;
    get canon(): any;
    same(peer: any): boolean;
    gen(_ctx?: Context): any;
}
declare class NumberVal extends ScalarVal<number> {
    isNumberVal: boolean;
    constructor(spec: {
        peg: number;
    }, ctx?: Context);
    unify(peer: any, ctx?: Context): Val;
}
declare class IntegerVal extends ScalarVal<number> {
    isIntegerVal: boolean;
    constructor(spec: {
        peg: number;
    }, ctx?: Context);
    unify(peer: any, ctx?: Context): Val;
}
declare class StringVal extends ScalarVal<string> {
    isStringVal: boolean;
    constructor(spec: {
        peg: string;
    }, ctx?: Context);
    unify(peer: Val, ctx?: Context): Val;
    get canon(): string;
}
declare class BooleanVal extends ScalarVal<boolean> {
    isBooleanVal: boolean;
    constructor(spec: {
        peg: boolean;
    }, ctx?: Context);
    unify(peer: Val, ctx?: Context): Val;
    static TRUE: BooleanVal;
    static FALSE: BooleanVal;
}
export { TOP, Integer, ScalarTypeVal, NumberVal, StringVal, BooleanVal, IntegerVal, };
