import { Context } from './unify';
declare const DONE = -1;
declare const TOP: Val;
declare abstract class Val {
    top?: boolean;
    val?: any;
    done: number;
    constructor(val?: any);
    get dc(): string;
    same(peer: Val): boolean;
    abstract unify(peer: Val, ctx?: Context): Val;
    abstract get canon(): string;
    abstract gen(log: any[]): any;
}
declare class Nil extends Val {
    why: any;
    constructor(why?: any);
    unify(_peer: Val, _ctx?: Context): this;
    get canon(): string;
    gen(log: any[]): undefined;
}
declare class Integer {
}
declare type ScalarConstructor = StringConstructor | NumberConstructor | BooleanConstructor | (typeof Integer.constructor);
declare class ScalarTypeVal extends Val {
    constructor(val: ScalarConstructor);
    unify(peer: Val, _ctx?: Context): Val;
    get canon(): any;
    same(peer: Val): boolean;
    gen(log: any[]): undefined;
}
declare class ScalarVal<T> extends Val {
    type: any;
    constructor(val: T, type: ScalarConstructor);
    unify(peer: Val, _ctx?: Context): Val;
    get canon(): any;
    same(peer: Val): boolean;
    gen(_log: any[]): any;
}
declare class NumberVal extends ScalarVal<number> {
    constructor(val: number);
    unify(peer: Val, _ctx?: Context): Val;
}
declare class IntegerVal extends ScalarVal<number> {
    constructor(val: number);
    unify(peer: Val, _ctx?: Context): Val;
}
declare class StringVal extends ScalarVal<string> {
    constructor(val: string);
    unify(peer: Val, _ctx?: Context): Val;
    get canon(): string;
}
declare class BooleanVal extends ScalarVal<boolean> {
    constructor(val: boolean);
    unify(peer: Val): Val;
    static TRUE: BooleanVal;
    static FALSE: BooleanVal;
}
declare class MapVal extends Val {
    id: string;
    constructor(val: {
        [key: string]: Val;
    });
    unify(peer: Val, ctx?: Context): Val;
    get canon(): string;
    gen(log: any[]): any;
}
declare class ConjunctVal extends Val {
    constructor(val: Val[]);
    append(peer: Val): ConjunctVal;
    prepend(peer: Val): ConjunctVal;
    unify(peer: Val, ctx?: Context): Val;
    get canon(): any;
    gen(log: any[]): any;
}
declare class DisjunctVal extends Val {
    constructor(val: Val[]);
    append(peer: Val): DisjunctVal;
    prepend(peer: Val): ConjunctVal;
    unify(peer: Val, ctx?: Context): Val;
    get canon(): any;
    gen(log: any[]): any;
}
declare class RefVal extends Val {
    parts: string[];
    absolute: boolean;
    constructor(val: string);
    append(part: string): void;
    unify(peer: Val, ctx?: Context): Val;
    get canon(): any;
    gen(log: any[]): undefined;
}
declare class PrefVal extends Val {
    pref: Val;
    constructor(val: any, pref?: any);
    unify(peer: Val, ctx?: Context): Val;
    get canon(): any;
    gen(log: any[]): any;
}
export { DONE, Integer, Val, TOP, Nil, ScalarTypeVal, NumberVal, StringVal, BooleanVal, IntegerVal, MapVal, ConjunctVal, DisjunctVal, RefVal, PrefVal, };
