import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { StringVal } from '../val';
import { ValBase } from '../val/ValBase';
declare class RefVal extends ValBase {
    absolute: boolean;
    prefix: boolean;
    constructor(spec: {
        peg: any[];
        absolute?: boolean;
        prefix?: boolean;
    }, ctx?: Context);
    append(part: any): void;
    unify(peer: Val, ctx: Context): Val;
    find(ctx: Context): Val | StringVal | undefined;
    same(peer: Val): boolean;
    clone(spec?: ValSpec, ctx?: Context): Val;
    get canon(): string;
    gen(ctx?: Context): undefined;
}
export { RefVal, };
