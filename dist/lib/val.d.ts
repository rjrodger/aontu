import { Context } from './unify';
import { Site } from './lang';
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
    get site(): Site;
    abstract unify(peer: Val, ctx: Context): Val;
    abstract get canon(): string;
    abstract gen(ctx?: Context): any;
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
    gen(_ctx?: Context): undefined;
}
declare class Integer {
}
declare type ScalarConstructor = StringConstructor | NumberConstructor | BooleanConstructor | (typeof Integer.constructor);
declare class ScalarTypeVal extends Val {
    constructor(peg: ScalarConstructor, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    same(peer: Val): boolean;
    gen(_ctx?: Context): undefined;
}
declare class ScalarVal<T> extends Val {
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
declare class MapVal extends Val {
    static SPREAD: symbol;
    spread: {
        cj: Val | undefined;
    };
    constructor(peg: ValMap, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    get canon(): string;
    gen(ctx?: Context): any;
}
declare class ConjunctVal extends Val {
    constructor(peg: Val[], ctx?: Context);
    append(peer: Val): ConjunctVal;
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    gen(ctx?: Context): any;
}
declare class DisjunctVal extends Val {
    constructor(peg: Val[], ctx?: Context, _sites?: Site[]);
    append(peer: Val): DisjunctVal;
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    gen(ctx?: Context): any;
}
declare class RefVal extends Val {
    parts: string[];
    absolute: boolean;
    sep: string;
    constructor(peg: any[], abs?: boolean);
    append(part: any): void;
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    gen(_ctx?: Context): undefined;
}
declare class PrefVal extends Val {
    pref: Val;
    constructor(peg: any, pref?: any, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    gen(ctx?: Context): any;
}
export { DONE, Integer, Val, TOP, Nil, ScalarTypeVal, NumberVal, StringVal, BooleanVal, IntegerVal, MapVal, ConjunctVal, DisjunctVal, RefVal, PrefVal, };
