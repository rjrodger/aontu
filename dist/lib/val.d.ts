interface Val {
    unify(other: Val, ctx: Context): Val;
    clone(): Val;
    toString(): string;
}
declare class Context {
    pathmap: {
        [key: string]: Val;
    };
}
declare class TopVal implements Val {
    unify(other: Val, ctx: Context): Val;
    clone(): TopVal;
    toString(): string;
}
declare class BottomVal implements Val {
    unify(): BottomVal;
    clone(): BottomVal;
    toString(): string;
}
declare class IntTypeVal implements Val {
    unify(other: Val): Val;
    clone(): IntTypeVal;
    toString(): string;
}
declare class IntScalarVal implements Val {
    scalar: number;
    constructor(scalar: number);
    unify(other: Val | undefined): Val | IntScalarVal;
    clone(): IntScalarVal;
    toString(): string;
}
declare type ValMap = {
    [key: string]: Val;
};
declare class MapVal implements Val {
    map: ValMap;
    constructor(map: ValMap);
    unify(other: Val, ctx: Context): Val;
    clone(): MapVal;
    toString(): string;
}
declare type Vals = Val[];
declare class MeetVal implements Val {
    vals: Vals;
    constructor(vals: Vals);
    unify(other: Val, ctx: Context): Val;
    clone(): MeetVal;
    toString(): string;
}
declare class RefVal implements Val {
    path: Path;
    constructor(path: Path | string);
    unify(other: Val, ctx: Context): Val;
    clone(): RefVal;
    toString(): string;
}
declare class Path {
    parts: string[];
    parts_str: string;
    length: number;
    constructor(parts: Path | string | string[]);
    resolve(ctx: Context): Val | undefined;
    append(other: Path): Path;
    slice(n: number): Path;
    equals(other: Path): boolean;
    deeper(other: Path): boolean;
    toString(): string;
}
export { Context, Val, TopVal, BottomVal, IntTypeVal, IntScalarVal, MapVal, MeetVal, RefVal, };
