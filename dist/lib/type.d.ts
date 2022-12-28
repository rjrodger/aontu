import { Resolver } from '@jsonic/multisource';
import { Context } from './unify';
import { Site } from './lang';
type Options = {
    src: string;
    print: number;
    resolver?: Resolver;
    base?: string;
};
interface Val {
    isVal: boolean;
    id: number;
    done: number;
    path: string[];
    row: number;
    col: number;
    url: string;
    top?: boolean;
    peg?: any;
    err?: any[];
    deps?: any;
    same(peer: Val): boolean;
    get site(): Site;
    unify(peer: Val, ctx?: Context): Val;
    get canon(): string;
    gen(ctx?: Context): any;
}
type ValMap = {
    [key: string]: Val;
};
type ValList = Val[];
declare const DONE = -1;
declare const TOP: Val;
export type { Val, ValMap, ValList, Options, };
export { DONE, TOP, Resolver, };
