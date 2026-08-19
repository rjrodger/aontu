import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { ListVal } from './ListVal';
import { FuncBaseVal } from './FuncBaseVal';
declare function dataValues(data: Val | undefined): Val[] | string;
declare class EachFuncVal extends FuncBaseVal {
    isEachFunc: boolean;
    staged: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    funcname(): string;
    prepare(_ctx: AontuContext, _args: Val[]): null;
    unify(peer: Val, ctx: AontuContext): Val;
    resolve(ctx: AontuContext, args: Val[]): ListVal | import("./NilVal").NilVal;
}
export { dataValues, EachFuncVal, };
