declare const DEFAULT_MARKER = "//-";
declare function markerFor(path: string): string;
declare function desugarTemplate(src: string, marker?: string): string;
declare function resugarTemplate(src: string, marker?: string): string;
export { desugarTemplate, resugarTemplate, markerFor, DEFAULT_MARKER, };
