import { Context } from './unify';
declare type ValMap = {
    [key: string]: Val;
};
declare const DONE = -1;
declare const TOP: Val;
declare abstract class Val {
    id: number;
    done: number;
    path: string[];
    row: number;
    col: number;
    url: string;
    top?: boolean;
    peg?: any;
    err?: any[];
    deps?: any;
    constructor(peg?: any, ctx?: Context);
    same(peer: Val): boolean;
    abstract unify(peer: Val, ctx: Context): Val;
    abstract get canon(): string;
    abstract gen(log: any[]): any;
}
declare class Nil extends Val {
    nil: boolean;
    why: any;
    primary?: Val;
    secondary?: Val;
    static make: (ctx?: Context | undefined, why?: any, av?: Val | undefined, bv?: Val | undefined) => Nil;
    constructor(why?: any, ctx?: Context);
    unify(_peer: Val, _ctx: Context): this;
    get canon(): string;
    gen(log: any[]): undefined;
}
declare class Integer {
}
declare type ScalarConstructor = StringConstructor | NumberConstructor | BooleanConstructor | (typeof Integer.constructor);
declare class ScalarTypeVal extends Val {
    constructor(peg: ScalarConstructor, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    same(peer: Val): boolean;
    gen(log: any[]): undefined;
}
declare class ScalarVal<T> extends Val {
    type: any;
    constructor(peg: T, type: ScalarConstructor, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    same(peer: Val): boolean;
    gen(_log: any[]): any;
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
declare class MapVal extends Val {
    static SPREAD: symbol;
    spread: {
        cj: Val | undefined;
    };
    constructor(peg: ValMap, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    get canon(): string;
    gen(log: any[]): any;
}
declare class ConjunctVal extends Val {
    constructor(peg: Val[], ctx?: Context);
    append(peer: Val): ConjunctVal;
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    gen(log: any[]): any;
}
declare class DisjunctVal extends Val {
    constructor(peg: Val[], ctx?: Context);
    append(peer: Val): DisjunctVal;
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    gen(log: any[]): any;
}
declare class RefVal extends Val {
    parts: string[];
    absolute: boolean;
    constructor(peg: string, ctx?: Context);
    append(part: string): void;
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    gen(log: any[]): undefined;
}
declare class PrefVal extends Val {
    pref: Val;
    constructor(peg: any, pref?: any, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    gen(log: any[]): any;
}
export { DONE, Integer, Val, TOP, Nil, ScalarTypeVal, NumberVal, StringVal, BooleanVal, IntegerVal, MapVal, ConjunctVal, DisjunctVal, RefVal, PrefVal, };
