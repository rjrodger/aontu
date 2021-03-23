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
    static subsume(child: ScalarVal): boolean;
}
declare class ScalarVal extends Val<unknown> {
    constructor(val: String | Number | Boolean);
    unify(peer: Val<any>): Val<any>;
}
declare class NumVal extends Val<number> {
    constructor(val: number);
    unify(peer: Val<any>): Val<any>;
}
export { Val, TOP, Bottom, ScalarVal, NumVal, Integer, };
