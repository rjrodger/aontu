import { Val, RefVal, MapVal } from './val';
import { Lang } from './lang';
declare type Path = string[];
declare class Context {
    root: MapVal;
    path: Path;
    constructor(cfg: any);
    descend(key: string): Context;
    find(ref: RefVal): MapVal | undefined;
}
declare class Unify {
    root: Val;
    res: Val;
    dc: number;
    lang: Lang;
    constructor(root: Val | string, lang?: Lang);
}
export { Context, Path, Unify, };
