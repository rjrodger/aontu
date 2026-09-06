import type { VetFinding } from './vet';
import type { IncludeOptions } from './utility';
export type RenderVerdict = 'ok' | 'lossy' | 'error';
export type RenderUnit = {
    path: string;
    lang: string;
    text: string;
};
export type RenderLoss = {
    unit: string;
    path: string;
    tier: 1 | 2 | 3;
    construct: string;
    reason: string;
};
export type RenderTrace = {
    unit: string;
    piece: string;
    node: string;
    rule: string;
};
export type RenderCoverage = {
    read: string[];
    dead: string[];
    unruled: {
        unit: string;
        path: string;
    }[];
};
export type RenderReport = {
    verdict: RenderVerdict;
    units: RenderUnit[];
    lossy: RenderLoss[];
    errors?: VetFinding[];
    trace?: RenderTrace[];
    coverage?: RenderCoverage;
};
export type RenderOptions = IncludeOptions & {
    at?: string;
    path?: string;
    profiles?: any[];
    unit?: string;
    strict?: boolean;
    trace?: boolean;
    coverage?: boolean;
    coverageAt?: string;
};
export declare function render(src: string, options?: RenderOptions): RenderReport;
export declare function renderProfile(src: string, options?: RenderOptions): {
    profile?: any;
    errors?: VetFinding[];
};
export declare function renderValue(instance: any, options?: RenderOptions): RenderReport;
