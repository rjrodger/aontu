import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { BaseVal } from './BaseVal';
declare class TopVal extends BaseVal {
    isTop: boolean;
    id: number;
    dc: number;
    constructor(spec: ValSpec, ctx?: AontuContext);
    same(peer: Val): boolean;
    unify(peer: Val, _ctx?: AontuContext): Val;
    get canon(): string;
    superior(): Val;
    clone(_ctx: AontuContext, _spec?: ValSpec): this;
    gen(_ctx?: AontuContext): undefined;
}
export { TopVal, };
