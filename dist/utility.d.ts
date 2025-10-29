import type { Val } from './type';
declare function propagateMarks(source: Val, target: Val): void;
declare function formatPath(path: Val | string[], absolute?: boolean): string;
type WalkApply = (key: string | number | undefined, val: Val, parent: Val | undefined, path: (string | number)[]) => Val;
/**
 * Walk a Val structure depth first, applying functions before and after descending.
 * Only traverses Val instances - stops at non-Val children.
 */
declare function walk(val: Val, before?: WalkApply, after?: WalkApply, maxdepth?: number | null, key?: string | number, parent?: Val, path?: (string | number)[]): Val;
declare function explainOpen(ctx: any, t: any[] | undefined | null | false, note: string, ac?: Val, bc?: Val): any[] | null;
declare function ec(t: any[] | undefined | null, why: string): (string | null)[] | undefined;
declare function explainClose(t: any[] | undefined | null, out?: Val): void;
declare function formatExplain(t: any[], d?: number): string;
export { propagateMarks, formatPath, walk, WalkApply, explainOpen, ec, explainClose, formatExplain, };
