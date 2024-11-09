import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { Site } from '../lang';
declare class ValBase implements Val {
    #private;
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
    uh: number[];
    constructor(spec: ValSpec, ctx?: Context);
    ctx(): any;
    same(peer: Val): boolean;
    clone(spec?: ValSpec, ctx?: Context): Val;
    get site(): Site;
    unify(_peer: Val, _ctx?: Context): Val;
    get canon(): string;
    gen(_ctx?: Context): any;
}
export { ValBase, };
