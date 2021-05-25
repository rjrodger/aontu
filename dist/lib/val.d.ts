import { Context, Path } from './unify';
declare const DONE = -1;
declare const TOP: Val;
declare abstract class Val {
    id: string;
    done: number;
    path: string[];
    row: number;
    col: number;
    url: string;
    top?: boolean;
    peg?: any;
    map?: any;
    constructor(peg?: any, path?: Path);
    same(peer: Val): boolean;
    abstract unify(peer: Val, ctx: Context): Val;
    abstract get canon(): string;
    abstract gen(log: any[]): any;
}
declare class Nil extends Val {
    why: any;
    static make: (ctx: Context, why?: any, av?: Val | undefined, bv?: Val | undefined) => Nil;
    constructor(path: Path, why?: any);
    unify(_peer: Val, _ctx: Context): this;
    get canon(): string;
    gen(log: any[]): undefined;
}
declare class Integer {
}
declare type ScalarConstructor = StringConstructor | NumberConstructor | BooleanConstructor | (typeof Integer.constructor);
declare class ScalarTypeVal extends Val {
    constructor(peg: ScalarConstructor);
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    same(peer: Val): boolean;
    gen(log: any[]): undefined;
}
declare class ScalarVal<T> extends Val {
    type: any;
    constructor(peg: T, type: ScalarConstructor);
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    same(peer: Val): boolean;
    gen(_log: any[]): any;
}
declare class NumberVal extends ScalarVal<number> {
    constructor(peg: number);
    unify(peer: Val, ctx: Context): Val;
}
declare class IntegerVal extends ScalarVal<number> {
    constructor(peg: number);
    unify(peer: Val, ctx: Context): Val;
}
declare class StringVal extends ScalarVal<string> {
    constructor(peg: string);
    unify(peer: Val, ctx: Context): Val;
    get canon(): string;
}
declare class BooleanVal extends ScalarVal<boolean> {
    constructor(peg: boolean);
    unify(peer: Val, ctx: Context): Val;
    static TRUE: BooleanVal;
    static FALSE: BooleanVal;
}
declare class MapVal extends Val {
    static SPREAD: symbol;
    spread: {
        cj: Val | undefined;
        dj: Val | undefined;
    };
    constructor(peg: {
        [key: string]: Val;
    });
    unify(peer: Val, ctx: Context): Val;
    get canon(): string;
    gen(log: any[]): any;
}
declare class ConjunctVal extends Val {
    constructor(peg: Val[]);
    append(peer: Val): ConjunctVal;
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    gen(log: any[]): any;
}
declare class DisjunctVal extends Val {
    constructor(peg: Val[]);
    append(peer: Val): DisjunctVal;
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    gen(log: any[]): any;
}
declare class RefVal extends Val {
    parts: string[];
    absolute: boolean;
    constructor(peg: string);
    append(part: string): void;
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    gen(log: any[]): undefined;
}
declare class PrefVal extends Val {
    pref: Val;
    constructor(peg: any, pref?: any);
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    gen(log: any[]): any;
}
export { DONE, Integer, Val, TOP, Nil, ScalarTypeVal, NumberVal, StringVal, BooleanVal, IntegerVal, MapVal, ConjunctVal, DisjunctVal, RefVal, PrefVal, };
