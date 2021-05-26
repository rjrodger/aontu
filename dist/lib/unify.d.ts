import { Val, RefVal, MapVal, Nil } from './val';
import { Lang } from './lang';
declare type Path = string[];
declare class Context {
    root: Val;
    path: Path;
    err: Nil[];
    constructor(cfg: {
        root: Val;
        err?: Nil[];
    });
    descend(key: string): Context;
    find(ref: RefVal): MapVal | undefined;
}
declare class Unify {
    root: Val;
    res: Val;
    err: Nil[];
    dc: number;
    lang: Lang;
    constructor(root: Val | string, lang?: Lang);
}
export { Context, Path, Unify, };
