declare function unify(orignodes: (Node | string)[]): Node[];
declare function reify(nodes: Node[]): any;
declare class Node {
    path: Path;
    val?: Val;
    vals: Val[];
    constructor(path: Path | string | string[], vals: string | (Val | string)[]);
    clone(to?: Path): Node;
    unify(root_ctx: UnifyContext): Node[];
    toString(): string;
}
declare class Path {
    parts: string[];
    parts_str: string;
    length: number;
    constructor(parts: Path | string | string[]);
    append(other: Path): Path;
    slice(n: number): Path;
    equals(other: Path): boolean;
    deeper(other: Path): boolean;
    toString(): string;
}
declare function parseNode(s: string): Node;
declare function parseVal(s: string): Val;
interface UnifyContext {
    path: Path;
    nodes: Node[];
    index: number;
}
interface Val {
    unify(other: Val, ctx: UnifyContext): Val;
    toString(): string;
}
declare class TopVal implements Val {
    unify(other: Val, ctx: UnifyContext): Val;
    toString(): string;
}
declare const top: TopVal;
declare class BottomVal implements Val {
    unify(): this;
    toString(): string;
}
declare const bottom: BottomVal;
declare class DeferVal implements Val {
    unify(other: Val): this | BottomVal;
    toString(): string;
}
declare const defer: DeferVal;
declare class IntTypeVal implements Val {
    unify(other: Val): Val | this;
    toString(): string;
}
declare class IntScalarVal implements Val {
    scalar: number;
    constructor(val: number);
    unify(other: Val): Val | IntScalarVal;
    toString(): string;
}
declare class RefVal implements Val {
    val: Val | undefined;
    path: Path;
    constructor(path: Path);
    unify(other: Val, ctx: UnifyContext): Val;
    toString(): string;
}
declare class NodesVal implements Val {
    from_index: number;
    from: Path;
    to: Path;
    nodes: Node[];
    constructor(from_index: number, from: Path, to: Path);
    unify(other: Val, ctx: UnifyContext): Val | this;
    toString(): string;
}
declare class MapVal implements Val {
    unify(other: Val): Val | MapVal;
    toString(): string;
}
declare class ListVal implements Val {
    unify(other: Val): Val | ListVal;
    toString(): string;
}
export { unify, reify, Node, Path, Val, BottomVal, IntTypeVal, IntScalarVal, RefVal, NodesVal, MapVal, ListVal, top, defer, bottom, parseVal, parseNode, };
