import type { Val } from './type';
import { Lang } from './lang';
import { Nil } from '../lib/val/Nil';
type Path = string[];
declare class Context {
    root: Val;
    path: Path;
    err: Nil[];
    vc: number;
    constructor(cfg: {
        root: Val;
        path?: Path;
        err?: Nil[];
        vc?: number;
    });
    clone(cfg: {
        root?: Val;
        path?: Path;
        err?: Nil[];
    }): Context;
    descend(key: string): Context;
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
