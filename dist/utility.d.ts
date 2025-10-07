import type { Val } from './type';
declare function formatPath(path: Val | string[], absolute?: boolean): string;
type WalkApply = (key: string | number | undefined, val: Val, parent: Val | undefined, path: (string | number)[]) => Val;
/**
 * Walk a Val structure depth first, applying functions before and after descending.
 * Only traverses Val instances - stops at non-Val children.
 */
declare function walk(val: Val, before?: WalkApply, after?: WalkApply, maxdepth?: number | null, key?: string | number, parent?: Val, path?: (string | number)[]): Val;
export { formatPath, walk, WalkApply, };
