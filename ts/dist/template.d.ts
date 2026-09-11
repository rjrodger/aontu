declare const DEFAULT_MARKER = "//-";
declare function markerFor(path: string): string;
declare function markerFromProfiles(profiles: any[], path: string): string | undefined;
declare function desugarTemplate(src: string, marker?: string): string;
declare function resugarTemplate(src: string, marker?: string): string;
declare function templateOutputs(src: string, marker: string): boolean[];
export { desugarTemplate, resugarTemplate, templateOutputs, markerFor, markerFromProfiles, DEFAULT_MARKER, };
