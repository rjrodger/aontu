import type { VetFinding } from './vet';
import type { IncludeOptions } from './utility';
export declare const ALLOW_AT = "$.roles";
export type AllowVerdict = 'allowed' | 'refused' | 'error';
export type AllowReason = 'allow' | 'deny' | 'uncovered' | 'no_role';
export type AllowDecision = {
    path: string;
    allowed: boolean;
    reason: AllowReason;
    by?: string;
    pattern?: string;
};
export type AllowReport = {
    verdict: AllowVerdict;
    role: string;
    paths: AllowDecision[];
    findings: VetFinding[];
};
export type AllowOptions = IncludeOptions & {
    path?: string;
    at?: string;
};
export declare function allow(src: string, role: string, paths: string[], opts?: AllowOptions): AllowReport;
