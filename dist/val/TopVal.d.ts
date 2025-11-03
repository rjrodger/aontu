import { inspect } from 'node:util';
import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { BaseVal } from './BaseVal';
declare class TopVal extends BaseVal {
    isTop: boolean;
    id: number;
    dc: number;
    constructor(spec: ValSpec, ctx?: Context);
    same(peer: Val): boolean;
    unify(peer: Val, _ctx?: Context): Val;
    get canon(): string;
    clone(_ctx: Context, _spec?: any): this;
    gen(_ctx?: Context): undefined;
    [inspect.custom](_d: number, _o: any, _inspect: any): string;
}
export { TopVal, };
