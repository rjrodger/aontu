import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { FuncBaseVal } from './FuncBaseVal';
type CmpDef = {
    children: string[];
    text: string;
};
declare const CMP_DEF: Record<string, CmpDef>;
declare class CmpFuncVal extends FuncBaseVal {
    isCmpFunc: boolean;
    cmp: string;
    constructor(cmp: string, spec: ValSpec, ctx?: AontuContext);
    funcname(): string;
    resolve(ctx: AontuContext, args: Val[]): Val;
}
declare class FolderFuncVal extends CmpFuncVal {
    isFolderFunc: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    make(_ctx: AontuContext, spec: ValSpec): Val;
}
declare class FileFuncVal extends CmpFuncVal {
    isFileFunc: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    make(_ctx: AontuContext, spec: ValSpec): Val;
}
declare class ContentFuncVal extends CmpFuncVal {
    isContentFunc: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    make(_ctx: AontuContext, spec: ValSpec): Val;
}
export { CMP_DEF, CmpFuncVal, FolderFuncVal, FileFuncVal, ContentFuncVal, };
