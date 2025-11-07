import type { Val, FST, AontuOptions } from './type';
import { NilVal } from './val/NilVal';
type AontuContextConfig = {
    cc?: number;
    err?: any[];
    explain?: any[];
    fs?: any;
    path?: string[];
    root?: Val;
    seen?: Record<string, number>;
    seenI?: number;
    src?: string;
    srcpath?: string;
    vars?: Record<string, Val>;
    vc?: number;
    collect?: boolean;
    opts?: AontuOptions;
    deps?: Record<string, any>;
};
declare class AontuContext {
    root?: Val;
    path: string[];
    vc: number;
    cc: number;
    vars: Record<string, Val>;
    src?: string;
    fs?: FST;
    seenI: number;
    seen: Record<string, number>;
    collect: boolean;
    err: any[];
    explain: any[] | null;
    srcpath?: string;
    deps: Record<string, any>;
    opts: AontuOptions;
    constructor(cfg: AontuContextConfig);
    clone(cfg: {
        root?: Val;
        path?: string[];
        err?: any[];
        explain?: any[];
    }): AontuContext;
    descend(key: string): AontuContext;
    addopts(opts?: AontuOptions): void;
    adderr(err: NilVal): void;
    errmsg(): string;
    find(path: string[]): Val | undefined;
}
export { AontuContext, AontuContextConfig };
