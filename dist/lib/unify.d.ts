import { Val, RefVal, MapVal, Nil } from './val';
import { Lang } from './lang';
declare type Path = string[];
declare type MapMap = {
    [name: string]: {
        [key: string]: any;
    };
};
declare class Context {
    root: Val;
    path: Path;
    err: Nil[];
    map: MapMap;
    constructor(cfg: {
        root: Val;
        err?: Nil[];
        map?: MapMap;
    });
    descend(key: string): Context;
    find(ref: RefVal): MapVal | undefined;
}
declare class Unify {
    root: Val;
    res: Val;
    err: Nil[];
    map: MapMap;
    dc: number;
    lang: Lang;
    constructor(root: Val | string, lang?: Lang);
}
export { Context, Path, Unify, };
