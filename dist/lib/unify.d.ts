import type { Val } from './type';
import { Lang } from './lang';
import { MapVal } from '../lib/val/MapVal';
import { RefVal } from '../lib/val/RefVal';
import { Nil } from '../lib/val/Nil';
type Path = string[];
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
