import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { FuncBaseVal } from './FuncBaseVal';
import type { EmitOrigin } from './Val';
type Template = {
    match: Val;
    body: Val;
    replace?: Val;
    esc: string;
    lits: LitSpot[];
    idx: number;
};
type LitSpot = {
    i: number;
    of?: number;
    text?: boolean;
    s: string;
};
type Refusal = {
    code: string;
    details?: Record<string, string>;
};
type Pair = [string, string];
type Fail = {
    ref?: string;
    code?: string;
    details?: Record<string, string>;
};
declare class EmitFuncVal extends FuncBaseVal {
    isEmitFunc: boolean;
    staged: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    funcname(): string;
    prepare(_ctx: AontuContext, _args: Val[]): null;
    unify(peer: Val, ctx: AontuContext): Val;
    resolve(ctx: AontuContext, args: Val[]): import("./NilVal").NilVal | Val;
    refuse(ctx: AontuContext, r: Refusal): Val;
    dispatch(ctx: AontuContext, node: Val, templates: Template[]): Template | string;
    replacements(ctx: AontuContext, node: Val, tmpl: Template, fail: Fail): Pair[] | undefined;
    instantiate(ctx: AontuContext, node: Val, tmpl: Template, out: Val[], fail: Fail, mark?: EmitOrigin): void;
}
export { EmitFuncVal, };
