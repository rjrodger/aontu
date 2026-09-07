declare const DEFAULT_MARKER = "//-";
declare function markerFor(path: string): string;
declare function desugarTemplate(src: string, marker?: string): string;
declare function resugarTemplate(src: string, marker?: string): string;
declare function templateOutputs(src: string, marker: string): boolean[];
export { desugarTemplate, resugarTemplate, templateOutputs, markerFor, DEFAULT_MARKER, };
