declare const TOP: Val<unknown>;
declare abstract class Val<T> {
    top?: boolean;
    val?: T;
    constructor(val?: T);
    abstract unify(_peer: Val<any>): Val<any>;
    abstract get canon(): string;
}
declare class Nil extends Val<unknown> {
    why: any;
    constructor(why?: any);
    unify(_peer: Val<any>): this;
    get canon(): string;
}
declare class Integer {
}
declare type ScalarConstructor = StringConstructor | NumberConstructor | BooleanConstructor | (typeof Integer.constructor);
declare class ScalarTypeVal extends Val<unknown> {
    constructor(val: ScalarConstructor);
    unify(peer: Val<any>): Val<any>;
    get canon(): any;
}
declare class ScalarVal<T> extends Val<unknown> {
    type: any;
    constructor(val: T, type: ScalarConstructor);
    unify(peer: Val<any>): Val<any>;
    get canon(): any;
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
    get canon(): string;
}
declare class BooleanVal extends ScalarVal<boolean> {
    constructor(val: boolean);
    unify(peer: Val<any>): Val<any>;
    static TRUE: BooleanVal;
    static FALSE: BooleanVal;
}
declare class MapVal extends Val<any> {
    id: number;
    constructor(val: {
        [key: string]: Val<any>;
    });
    unify(peertop: Val<any>): Val<any>;
    get canon(): string;
}
export { Val, TOP, Nil, ScalarTypeVal, NumberVal, StringVal, BooleanVal, IntegerVal, MapVal, Integer, };
