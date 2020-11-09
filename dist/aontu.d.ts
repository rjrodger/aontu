declare function unify(orignodes: (Node | string)[]): Node[];
declare function reify(nodes: Node[]): any;
declare class Node {
    path: Path;
    val?: Val;
    vals: Val[];
    static clone(node: Node): Node;
    constructor(path: Path | string | string[], vals: string | (Val | string)[]);
    unify(root_ctx: UnifyContext): Val | undefined;
    toString(): string;
}
declare class Path {
    parts: string[];
    parts_str: string;
    constructor(parts: Path | string | string[]);
    equals(other: Path): boolean;
    deeper(other: Path): boolean;
}
declare function parseVal(s: string): Val;
interface UnifyContext {
    path: Path;
    nodes: Node[];
}
interface Val {
    unify(other: Val, ctx: UnifyContext): Val | undefined;
    toString(): string;
}
declare class BottomVal implements Val {
    unify(): this;
    toString(): string;
}
declare const bottom: BottomVal;
declare class IntTypeVal implements Val {
    unify(other: Val): Val | this;
    toString(): string;
}
declare class IntScalarVal implements Val {
    scalar: number;
    constructor(val: number);
    unify(other: Val, ctx: UnifyContext): Val | IntScalarVal;
    toString(): string;
}
declare class RefVal implements Val {
    val: Val | undefined;
    path: Path;
    constructor(path: Path);
    unify(other: Val, ctx: UnifyContext): Val | undefined;
    toString(): string;
}
export { unify, reify, Node, Path, Val, BottomVal, IntTypeVal, IntScalarVal, RefVal, bottom, parseVal, };
