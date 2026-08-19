export type RelationVerdict = 'pass' | 'fail' | 'error';
export type RelationFinding = {
    code: string;
    relation: string;
    at: string;
    detail: string[];
};
export type RelationReport = {
    verdict: RelationVerdict;
    findings: RelationFinding[];
};
export type RelationOptions = {
    path?: string;
};
export declare function relationCheck(src: string, opts?: RelationOptions): RelationReport;
