import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { BagVal } from './BagVal';
declare class MapVal extends BagVal {
    isMap: boolean;
    spread: {
        cj: Val | undefined;
    };
    constructor(spec: ValSpec, ctx?: Context);
    unify(peer: Val, ctx: Context, explain?: any[] | false): Val;
    clone(ctx: Context, spec?: ValSpec): Val;
    get canon(): string;
    gen(ctx?: Context): any;
}
export { MapVal };
