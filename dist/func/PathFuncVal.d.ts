import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { FuncBaseVal } from './FuncBaseVal';
declare class PathFuncVal extends FuncBaseVal {
    isPathFunc: boolean;
    prepared: number;
    constructor(spec: ValSpec, ctx?: Context);
    make(_ctx: Context, spec: ValSpec): Val;
    funcname(): string;
    prepare(ctx: Context, args: Val[]): Val[];
    resolve(ctx: Context, args: Val[]): Val;
}
export { PathFuncVal, };
