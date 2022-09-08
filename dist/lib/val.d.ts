import type { Val, ValList } from './type';
import { TOP } from './type';
import { Context } from './unify';
import { Site } from './lang';
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
declare class ListVal extends ValBase {
    static SPREAD: symbol;
    spread: {
        cj: Val | undefined;
    };
    constructor(peg: ValList, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    get canon(): string;
    gen(ctx?: Context): any;
}
declare class DisjunctVal extends ValBase {
    constructor(peg: Val[], ctx?: Context, _sites?: Site[]);
    append(peer: Val): DisjunctVal;
    unify(peer: Val, ctx: Context): Val;
    get canon(): any;
    gen(ctx?: Context): any;
}
declare class RefVal extends ValBase {
    parts: string[];
    absolute: boolean;
    sep: string;
    constructor(peg: any[], abs?: boolean);
    append(part: any): void;
    unify(peer: Val, ctx: Context): Val;
    same(peer: Val): boolean;
    get canon(): any;
    gen(_ctx?: Context): undefined;
}
declare class PrefVal extends ValBase {
    pref: Val;
    constructor(peg: any, pref?: any, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    same(peer: Val): boolean;
    get canon(): any;
    gen(ctx?: Context): any;
}
export { Integer, TOP, ScalarTypeVal, NumberVal, StringVal, BooleanVal, IntegerVal, ListVal, DisjunctVal, RefVal, PrefVal, };
