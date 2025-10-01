import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { ValBase } from '../val/ValBase';
declare class FuncValBase extends ValBase {
    isFuncVal: boolean;
    constructor(spec: ValSpec, ctx?: Context);
    make(ctx: Context, _spec: ValSpec): Val;
    unify(peer: Val, ctx: Context): Val;
    get canon(): string;
    funcname(): string;
    resolve(ctx: Context | undefined, _args: Val[]): Val;
}
export { FuncValBase, };
