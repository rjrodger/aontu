import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { MapVal } from './MapVal';
import { ListVal } from './ListVal';
import { FuncBaseVal } from './FuncBaseVal';
declare class FilterFuncVal extends FuncBaseVal {
    isFilterFunc: boolean;
    staged: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    funcname(): string;
    prepare(_ctx: AontuContext, _args: Val[]): null;
    unify(peer: Val, ctx: AontuContext): Val;
    resolve(ctx: AontuContext, args: Val[]): ListVal | MapVal | import("./NilVal").NilVal;
}
export { FilterFuncVal, };
