import type { Val } from './type';
import { FST } from './type';
import { Nil } from './val';
import { Lang } from './lang';
type Path = string[];
declare const unite: (ctx: Context, a: any, b: any, whence: string) => any;
declare class Context {
    #private;
    root: Val;
    path: Path;
    vc: number;
    cc: number;
    var: Record<string, Val>;
    src?: string;
    fs?: FST;
    seenI: number;
    seen: Record<string, number>;
    collect: boolean;
    constructor(cfg: {
        root: Val;
        path?: Path;
        err?: Omit<Nil[], "push">;
        vc?: number;
        cc?: number;
        var?: Record<string, Val>;
        src?: string;
        seenI?: number;
        seen?: Record<string, number>;
        collect?: boolean;
    });
    clone(cfg: {
        root?: Val;
        path?: Path;
        err?: Omit<Nil[], "push">;
    }): Context;
    descend(key: string): Context;
    get err(): any;
    adderr(err: Nil, whence?: string): void;
    errmsg(): string;
    find(path: string[]): Val | undefined;
}
declare class Unify {
    root: Val;
    res: Val;
    err: Omit<Nil[], "push">;
    cc: number;
    lang: Lang;
    constructor(root: Val | string, lang?: Lang, ctx?: Context, src?: string);
}
export { Context, Path, Unify, unite, };
