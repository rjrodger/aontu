import type { Val } from '../type';
import { Context } from '../unify';
import { StringVal } from '../val';
import { ValBase } from '../val/ValBase';
declare class RefVal extends ValBase {
    parts: string[];
    absolute: boolean;
    sep: string;
    root: string;
    attr: undefined | {
        kind: 'KEY';
        part: string;
    };
    constructor(peg: any[], ctx?: Context);
    append(part: any): void;
    unify(peer: Val, ctx: Context): Val;
    find(ctx: Context): Val | StringVal | undefined;
    same(peer: Val): boolean;
    clone(ctx?: Context): Val;
    get canon(): any;
    gen(ctx?: Context): undefined;
}
export { RefVal, };
