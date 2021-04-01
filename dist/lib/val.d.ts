declare const TOP: Val;
declare abstract class Val {
    top?: boolean;
    val?: any;
    constructor(val?: any);
    abstract unify(_peer: Val): Val;
    abstract get canon(): string;
    abstract gen(log: any[]): any;
}
declare class Nil extends Val {
    why: any;
    constructor(why?: any);
    unify(_peer: Val): this;
    get canon(): string;
    gen(log: any[]): undefined;
}
declare class Integer {
}
declare type ScalarConstructor = StringConstructor | NumberConstructor | BooleanConstructor | (typeof Integer.constructor);
declare class ScalarTypeVal extends Val {
    constructor(val: ScalarConstructor);
    unify(peer: Val): Val;
    get canon(): any;
    gen(log: any[]): undefined;
}
declare class ScalarVal<T> extends Val {
    type: any;
    constructor(val: T, type: ScalarConstructor);
    unify(peer: Val): Val;
    get canon(): any;
    gen(_log: any[]): any;
}
declare class NumberVal extends ScalarVal<number> {
    constructor(val: number);
    unify(peer: Val): Val;
}
declare class IntegerVal extends ScalarVal<number> {
    constructor(val: number);
    unify(peer: Val): Val;
}
declare class StringVal extends ScalarVal<string> {
    constructor(val: string);
    unify(peer: Val): Val;
    get canon(): string;
}
declare class BooleanVal extends ScalarVal<boolean> {
    constructor(val: boolean);
    unify(peer: Val): Val;
    static TRUE: BooleanVal;
    static FALSE: BooleanVal;
}
declare class MapVal extends Val {
    id: number;
    constructor(val: {
        [key: string]: Val;
    });
    unify(peertop: Val): Val;
    get canon(): string;
    gen(log: any[]): any;
}
declare class DisjunctVal extends Val {
    constructor(val: Val[]);
    append(peer: Val): DisjunctVal;
    unify(peer: Val): Val;
    get canon(): any;
    gen(log: any[]): any;
}
export { Integer, Val, TOP, Nil, ScalarTypeVal, NumberVal, StringVal, BooleanVal, IntegerVal, MapVal, DisjunctVal, };
