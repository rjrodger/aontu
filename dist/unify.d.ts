import type { Val } from './type';
import { FST } from './type';
import { NilVal } from './val/NilVal';
import { Lang } from './lang';
type Path = string[];
declare const unite: (ctx: Context, a: any, b: any, whence: string, explain?: any[]) => any;
declare class Context {
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
    err: any[];
    explain: any[] | null;
    srcpath?: string;
    constructor(cfg: {
        root: Val;
        path?: Path;
        srcpath?: string;
        err?: any[];
        explain?: any[] | null;
        vc?: number;
        cc?: number;
        var?: Record<string, Val>;
        src?: string;
        seenI?: number;
        seen?: Record<string, number>;
        collect?: boolean;
        fs?: any;
    });
    clone(cfg: {
        root?: Val;
        path?: Path;
        err?: any[];
    }): Context;
    descend(key: string): Context;
    adderr(err: NilVal, whence?: string): void;
    errmsg(): string;
    find(path: string[]): Val | undefined;
}
declare class Unify {
    root: Val;
    res: Val;
    err: any[];
    explain: any[] | null;
    cc: number;
    lang: Lang;
    constructor(root: Val | string, lang?: Lang, ctx?: Context | any, src?: string);
}
export { Context, Path, Unify, unite, };
