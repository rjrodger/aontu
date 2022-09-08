import type { Val } from '../type';
import { Context } from '../unify';
import { Site } from '../lang';
declare abstract class ValBase implements Val {
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
    constructor(peg?: any, ctx?: Context);
    same(peer: Val): boolean;
    get site(): Site;
    abstract unify(peer: Val, ctx?: Context): Val;
    abstract get canon(): string;
    abstract gen(ctx?: Context): any;
}
export { ValBase, };