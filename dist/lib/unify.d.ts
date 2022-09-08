import type { Val } from './type';
import { RefVal } from './val';
import { Lang } from './lang';
import { MapVal } from '../lib/val/MapVal';
import { Nil } from '../lib/val/Nil';
declare type Path = string[];
declare class Context {
    root: Val;
    path: Path;
    err: Nil[];
    vc: number;
    constructor(cfg: {
        root: Val;
        err?: Nil[];
        vc?: number;
    });
    clone(cfg: {
        root?: Val;
        path?: Path;
        err?: Nil[];
    }): Context;
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
