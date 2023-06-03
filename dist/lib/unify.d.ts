import type { Val } from './type';
import { Lang } from './lang';
import { Nil } from '../lib/val/Nil';
type Path = string[];
declare class Context {
    root: Val;
    path: Path;
    err: Nil[];
    vc: number;
    cc: number;
    var: Record<string, Val>;
    constructor(cfg: {
        root: Val;
        path?: Path;
        err?: Nil[];
        vc?: number;
        cc?: number;
        var?: Record<string, Val>;
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
    cc: number;
    lang: Lang;
    constructor(root: Val | string, lang?: Lang, ctx?: Context);
}
export { Context, Path, Unify, };
