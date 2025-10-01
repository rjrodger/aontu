import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { Site } from '../lang';
declare class ValBase implements Val {
    #private;
    isVal: boolean;
    id: number;
    dc: number;
    path: string[];
    row: number;
    col: number;
    url: string;
    top: boolean;
    peg: any;
    err: Omit<any[], "push">;
    uh: number[];
    constructor(spec: ValSpec, ctx?: Context);
    ctx(): any;
    same(peer: Val): boolean;
    clone(ctx: Context, spec?: ValSpec): Val;
    get site(): Site;
    unify(_peer: Val, _ctx?: Context): Val;
    get canon(): string;
    errcanon(): string;
    gen(_ctx?: Context): any;
}
export { ValBase, };
