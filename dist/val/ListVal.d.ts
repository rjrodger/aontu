import type { Val, ValList, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { BagVal } from './BagVal';
declare class ListVal extends BagVal {
    isList: boolean;
    spread: {
        cj: Val | undefined;
    };
    constructor(spec: {
        peg: ValList;
    }, ctx?: AontuContext);
    unify(peer: Val, ctx: AontuContext): Val;
    clone(ctx: AontuContext, spec?: ValSpec): Val;
    get canon(): string;
    gen(ctx?: AontuContext): any;
}
export { ListVal, };
