declare class Val {
    val: any;
    constructor(val: any);
}
declare class DefaultVal extends Val {
    type: any;
    constructor(type: any, val: any);
}
declare function unify(basetop: any, peertop: any): any;
declare function evaluate(top: any): any;
declare function Aontu(base: any, peer: any): any;
export { Aontu, evaluate, unify, DefaultVal, };
