import type { RenderLoss } from './render';
export type LowerCtx = {
    profile: any;
    family: string;
    unit: string;
    lossy: RenderLoss[];
};
export declare function splitWords(name: string): string[];
export declare function lowerASCII(s: string): string;
export declare function upperASCII(s: string): string;
export declare function capitalise(word: string, acronyms: string[]): string;
export declare function caseName(name: string, style: string, acronyms: string[]): string;
export declare function ident(name: string, role: string, ctx: LowerCtx, path: string, bare: boolean): string;
export declare function quote(s: string, profile: any): string;
export declare function literal(v: any, ctx: LowerCtx): string;
type Expr = {
    text: string;
    prec: number;
};
export declare function typeExpr(t: any, ctx: LowerCtx, path: string): Expr;
export declare function lowerHeader(unit: any, source: any, ctx: LowerCtx): any[];
export declare function lowerDecl(decl: any, path: string, ctx: LowerCtx): any[];
export {};
