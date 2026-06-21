import type { Val } from './type';
declare const SEVERITY_ERROR = 1;
declare const SEVERITY_WARNING = 2;
declare const SEVERITY_INFORMATION = 3;
declare const SEVERITY_HINT = 4;
declare const LSP_VERSION = "0.1.0";
type Position = {
    line: number;
    character: number;
};
type Range = {
    start: Position;
    end: Position;
};
type Diagnostic = {
    range: Range;
    severity: number;
    code?: string;
    source: string;
    message: string;
};
type Message = {
    jsonrpc?: string;
    id?: number | string | null;
    method?: string;
    params?: any;
};
type OutMessage = {
    jsonrpc: string;
    id?: number | string | null;
    method?: string;
    params?: any;
    result?: any;
    error?: {
        code: number;
        message: string;
    };
};
declare function computeDiagnostics(src: string, opts?: {
    vars?: Record<string, Val>;
}): Diagnostic[];
declare class LspHandler {
    private docs;
    private shutdownOK;
    private exited;
    get shouldExit(): boolean;
    get exitCode(): number;
    doc(uri: string): string | undefined;
    handle(msg: Message): OutMessage[];
    private publish;
}
export { computeDiagnostics, LspHandler, LSP_VERSION, SEVERITY_ERROR, SEVERITY_WARNING, SEVERITY_INFORMATION, SEVERITY_HINT, };
export type { Position, Range, Diagnostic, Message, OutMessage, };
