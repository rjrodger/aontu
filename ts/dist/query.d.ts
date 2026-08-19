import type { VetFinding } from './vet';
export type QueryView = 'json' | 'canon' | 'types' | 'keys';
export type QueryOptions = {
    view?: QueryView;
    depth?: number;
    path?: string;
};
export type QueryReport = {
    ok: boolean;
    out: string;
    findings: VetFinding[];
};
export declare function nearestKey(want: string, have: string[]): string | undefined;
export declare function pathParts(path: string): string[];
export declare function projectFor(v: any, view: QueryView, depth: number): string;
export declare function get(src: string, path: string, opts?: QueryOptions): QueryReport;
