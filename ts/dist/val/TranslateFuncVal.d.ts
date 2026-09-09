import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { FuncBaseVal } from './FuncBaseVal';
declare function expandSet(set: string): string[] | undefined;
declare class TranslateFuncVal extends FuncBaseVal {
    isTranslateFunc: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    make(_ctx: AontuContext, spec: ValSpec): Val;
    funcname(): string;
    resolve(ctx: AontuContext, args: Val[]): Val;
}
export { expandSet, TranslateFuncVal, };
