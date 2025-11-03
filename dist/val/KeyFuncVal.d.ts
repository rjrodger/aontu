import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { FuncBaseVal } from './FuncBaseVal';
declare class KeyFuncVal extends FuncBaseVal {
    isKeyFunc: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    make(_ctx: Context, spec: ValSpec): Val;
    funcname(): string;
    resolve(ctx: Context, args: Val[]): Val;
    gen(ctx?: Context): any;
}
export { KeyFuncVal, };
