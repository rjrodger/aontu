import type { Val } from '../type';
import { Context } from '../unify';
import { Site } from '../lang';
declare class ValBase implements Val {
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
    constructor(peg?: any, ctx?: Context);
    same(peer: Val): boolean;
    clone(ctx?: Context): Val;
    get site(): Site;
    unify(peer: Val, ctx?: Context): Val;
    get canon(): string;
    gen(ctx?: Context): any;
}
export { ValBase, };
