import type { Val } from '../type';
import { Context } from '../unify';
import { ValBase } from '../val/ValBase';
declare class RefVal extends ValBase {
    parts: string[];
    absolute: boolean;
    sep: string;
    constructor(peg: any[], abs?: boolean);
    append(part: any): void;
    unify(peer: Val, ctx: Context): Val;
    same(peer: Val): boolean;
    get canon(): any;
    gen(_ctx?: Context): undefined;
}
export { RefVal, };
