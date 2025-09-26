import * as Fs from 'node:fs';
import { Resolver } from '@jsonic/multisource';
import { Context } from './unify';
type FST = typeof Fs;
type Options = {
    src: string;
    print: number;
    resolver?: Resolver;
    base?: string;
    path?: string;
    debug?: boolean;
    trace?: boolean;
    fs?: FST;
    deps?: any;
    log?: any;
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
    err: Omit<any[], "push">;
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
type ErrContext = {
    src?: string;
    fs?: FST;
};
export type { Val, ValSpec, ValMap, ValList, Options, ErrContext, FST, };
export { DONE, Resolver, };
