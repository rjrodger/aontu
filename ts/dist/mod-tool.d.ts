export type ModLock = {
    mod: string;
    v: string;
    canon: string;
    oci: string;
};
export type ModTidyReport = {
    verdict: 'ok' | 'missing';
    lock: ModLock[];
    missing: string[];
};
export type ModVendorReport = {
    verdict: 'ok' | 'missing';
    vendored: string[];
    missing: string[];
};
export type ModToolEval = (src: string, path: string) => {
    gen: any;
    hash: string;
    canon: string;
};
export type ModToolOptions = {
    cache?: string;
    eval: ModToolEval;
};
export declare function versionCompare(a: string, b: string): number;
export declare function lockText(entries: ModLock[], options: ModToolOptions): string;
export declare function modTidy(root: string, options: ModToolOptions): ModTidyReport;
export declare function modVendor(root: string, options: ModToolOptions): ModVendorReport;
