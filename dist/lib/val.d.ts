declare const TOP: Val<unknown>;
declare abstract class Val<T> {
    val?: T;
    constructor(val?: T);
    abstract unify(_peer: Val<any>): Val<any>;
}
declare class Bottom extends Val<unknown> {
    why: any;
    constructor(why: any);
    unify(_peer: Val<any>): this;
}
declare class Integer {
}
declare type ScalarConstructor = StringConstructor | NumberConstructor | BooleanConstructor | (typeof Integer.constructor);
declare class ScalarTypeVal extends Val<unknown> {
    constructor(val: ScalarConstructor);
    unify(peer: Val<any>): Val<any>;
}
declare class ScalarVal<T> extends Val<unknown> {
    type: any;
    constructor(val: T, type: ScalarConstructor);
    unify(peer: Val<any>): Val<any>;
}
declare class NumberVal extends ScalarVal<number> {
    constructor(val: number);
    unify(peer: Val<any>): Val<any>;
}
declare class IntegerVal extends ScalarVal<number> {
    constructor(val: number);
    unify(peer: Val<any>): Val<any>;
}
declare class StringVal extends ScalarVal<string> {
    constructor(val: string);
    unify(peer: Val<any>): Val<any>;
}
declare class BooleanVal extends ScalarVal<boolean> {
    constructor(val: boolean);
    unify(peer: Val<any>): Val<any>;
    static TRUE: BooleanVal;
    static FALSE: BooleanVal;
}
export { Val, TOP, Bottom, ScalarTypeVal, NumberVal, StringVal, BooleanVal, IntegerVal, Integer };
