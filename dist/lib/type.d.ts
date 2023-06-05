import { Resolver } from '@jsonic/multisource';
import { Context } from './unify';
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
    top: boolean;
    peg: any;
    err: any[];
    deps?: any;
    same(peer: Val): boolean;
    clone(spec?: ValSpec, ctx?: Context): Val;
    unify(peer: Val, ctx?: Context): Val;
    get canon(): string;
    gen(ctx?: Context): any;
}
type ValSpec = {
    peg?: any;
    [name: string]: any;
} | null;
type ValMap = {
    [key: string]: Val;
};
type ValList = Val[];
declare const DONE = -1;
export type { Val, ValSpec, ValMap, ValList, Options, };
export { DONE, Resolver, };
