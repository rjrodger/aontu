import type { VetFinding, VetVerdict } from './vet';
export type PatchOptions = {
    entryPath?: string;
    overlayPath?: string;
};
export type PatchReport = {
    overlay: string;
    appended: string[];
    verdict: VetVerdict;
    findings: VetFinding[];
};
export declare function parseAssignment(text: string): {
    path: string;
    value: string;
} | undefined;
export declare function overlayLine(path: string, value: string): string;
export declare function patch(entrySrc: string, overlaySrc: string, assignments: string[], opts?: PatchOptions): PatchReport;
