import type { Val } from '../type';
import { Context } from '../unify';
import { Site } from '../lang';
import { ValBase } from './ValBase';
declare class TopVal extends ValBase {
    isTop: boolean;
    id: number;
    top: boolean;
    peg: undefined;
    dc: number;
    path: never[];
    row: number;
    col: number;
    url: string;
    constructor();
    unify(peer: Val, _ctx?: Context): Val;
    get canon(): string;
    get site(): Site;
    same(peer: Val): boolean;
    clone(_ctx: Context, _spec?: any): this;
    gen(_ctx?: Context): undefined;
}
declare const TOP: TopVal;
export { TOP, TopVal, };
