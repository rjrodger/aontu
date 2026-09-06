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
export type RenderReport = {
    verdict: RenderVerdict;
    units: RenderUnit[];
    lossy: RenderLoss[];
    errors?: VetFinding[];
};
export type RenderOptions = IncludeOptions & {
    at?: string;
    path?: string;
    profiles?: any[];
    unit?: string;
    strict?: boolean;
};
export declare function render(src: string, options?: RenderOptions): RenderReport;
export declare function renderValue(instance: any, options?: RenderOptions): RenderReport;
