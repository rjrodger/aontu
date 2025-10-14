import type { Val, ValList, ValSpec } from '../type';
import { Context } from '../unify';
import { FeatureVal } from './FeatureVal';
declare class ListVal extends FeatureVal {
    isListVal: boolean;
    spread: {
        cj: Val | undefined;
    };
    constructor(spec: {
        peg: ValList;
    }, ctx?: Context);
    unify(peer: Val, ctx: Context): Val;
    clone(ctx: Context, spec?: ValSpec): Val;
    get canon(): string;
    gen(ctx?: Context): any;
}
export { ListVal, };
