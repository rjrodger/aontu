import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { MapVal } from './MapVal';
import { FuncBaseVal } from './FuncBaseVal';
declare function dataKeys(data: Val | undefined): string[] | string;
declare class PackFuncVal extends FuncBaseVal {
    isPackFunc: boolean;
    staged: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    funcname(): string;
    prepare(_ctx: AontuContext, _args: Val[]): null;
    unify(peer: Val, ctx: AontuContext): Val;
    resolve(ctx: AontuContext, args: Val[]): MapVal | import("./NilVal").NilVal;
}
export { dataKeys, PackFuncVal, };
