declare class Context {
    path: Path;
    depth: number;
    pathmap: {
        [key: string]: Val;
    };
    refs: Path[];
    resolvemap: {
        [key: string]: Val;
    };
    constructor(path?: Path);
    add(val: Val): this;
    get(pstr: string): Val | undefined;
    descend(part?: string): Context;
    describe(): string;
}
declare abstract class Val {
    val: Val;
    path?: Path;
    constructor(path?: Path);
    toString(): string;
    unify(other: Val, ctx: Context): Val;
    abstract unifier(other: Val, ctx?: Context): Val | undefined;
    abstract str(): string;
}
declare class TopVal extends Val {
    constructor(path?: Path);
    unifier(other: Val, ctx: Context): Val;
    str(): string;
}
declare class BottomVal extends Val {
    constructor(path?: Path);
    unifier(): this;
    str(): string;
}
declare class IntTypeVal extends Val {
    constructor(path?: Path);
    unifier(other: Val, ctx: Context): Val | undefined;
    str(): string;
}
declare class IntScalarVal extends Val {
    scalar: number;
    constructor(scalar: number, path?: Path);
    unifier(other: Val, ctx: Context): Val | undefined;
    str(): string;
}
declare type ValMap = {
    [key: string]: Val;
};
declare class MapVal extends Val {
    map: ValMap;
    constructor(map: ValMap, path?: Path);
    unifier(other: Val, ctx: Context): Val | undefined;
    str(): string;
}
declare type Vals = Val[];
declare class MeetVal extends Val {
    vals: Vals;
    constructor(vals: Vals, path?: Path);
    unifier(other: Val, ctx: Context): Val | undefined;
    str(): string;
}
declare class RefVal extends Val {
    ref: Path;
    constructor(ref: Path, path?: Path);
    unifier(other: Val, ctx: Context): Val | undefined;
    str(): string;
}
declare class Path {
    parts: string[];
    str: string;
    length: number;
    constructor(parts: Path | string | string[], append?: Path | string | string[]);
    resolve(ctx: Context): Val | undefined;
    append(other: Path | string | string[]): Path;
    slice(n: number): Path;
    equals(other: Path | undefined): boolean;
    deeper(other: Path): boolean;
    parseParts(parts: Path | string | string[]): string[];
    toString(): string;
}
export { Context, Path, Val, TopVal, BottomVal, IntTypeVal, IntScalarVal, MapVal, MeetVal, RefVal, };
