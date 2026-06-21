"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMPLETION_KEYWORD = exports.COMPLETION_FUNCTION = exports.SEVERITY_HINT = exports.SEVERITY_INFORMATION = exports.SEVERITY_WARNING = exports.SEVERITY_ERROR = exports.BUILTIN_FUNCS = exports.LSP_VERSION = exports.LspHandler = void 0;
exports.computeDiagnostics = computeDiagnostics;
exports.computeHover = computeHover;
exports.computeCompletions = computeCompletions;
const aontu_1 = require("./aontu");
const err_1 = require("./err");
// LSP DiagnosticSeverity subset.
const SEVERITY_ERROR = 1;
exports.SEVERITY_ERROR = SEVERITY_ERROR;
const SEVERITY_WARNING = 2;
exports.SEVERITY_WARNING = SEVERITY_WARNING;
const SEVERITY_INFORMATION = 3;
exports.SEVERITY_INFORMATION = SEVERITY_INFORMATION;
const SEVERITY_HINT = 4;
exports.SEVERITY_HINT = SEVERITY_HINT;
// Reported to the client in the initialize response.
const LSP_VERSION = '0.1.0';
exports.LSP_VERSION = LSP_VERSION;
// Compute LSP diagnostics for a unit of Aontu source. A valid document —
// including a non-concrete schema such as `a:string` — returns an empty
// array; only genuine errors (conflicts, unresolved references, unknown
// functions, syntax errors) produce diagnostics.
function computeDiagnostics(src, opts) {
    const aontu = new aontu_1.Aontu();
    let root;
    try {
        const ac = aontu.ctx({ collect: true });
        if (opts?.vars) {
            Object.assign(ac.vars, opts.vars);
        }
        root = aontu.unify(src, { collect: true }, ac);
    }
    catch (err) {
        // Hard parse/syntax failure: report a single diagnostic. jsonic
        // errors may carry 1-based line/col; fall back to the document start.
        return [parseErrorDiagnostic(err)];
    }
    const nils = [];
    walkNils(root, nils, new Set());
    return nils.map(nilToDiagnostic);
}
// Walk a unified Val tree collecting every NilVal exactly once. A NilVal
// in the result always represents an error; valid non-concrete values
// (scalar kinds, refs, conjuncts) are never NilVals.
function walkNils(v, out, seen) {
    if (null == v || 'object' !== typeof v || true !== v.isVal)
        return;
    if (seen.has(v))
        return;
    seen.add(v);
    if (v.isNil) {
        out.push(v);
        return;
    }
    const peg = v.peg;
    if (Array.isArray(peg)) {
        for (const c of peg)
            walkNils(c, out, seen);
    }
    else if (null != peg && 'object' === typeof peg) {
        for (const k in peg)
            walkNils(peg[k], out, seen);
    }
    // Spread constraints live off-peg on Map/List Vals.
    const spreadCj = v.spread?.cj;
    if (spreadCj)
        walkNils(spreadCj, out, seen);
}
// Convert a NilVal (1-based site row/col) to an LSP diagnostic (0-based
// line/character).
function nilToDiagnostic(nil) {
    const row = nil.site?.row ?? -1;
    const col = nil.site?.col ?? -1;
    let start;
    let end;
    if (row >= 1 && col >= 1) {
        start = { line: row - 1, character: col - 1 };
        const len = labelLength(nil);
        end = { line: row - 1, character: col - 1 + len };
    }
    else {
        start = { line: 0, character: 0 };
        end = { line: 0, character: 1 };
    }
    return {
        range: { start, end },
        severity: SEVERITY_ERROR,
        code: nil.why,
        source: 'aontu',
        message: nilMessage(nil),
    };
}
// Length (UTF-16 units, like LSP characters) of the offending value's
// canonical form, used to size the diagnostic range (minimum 1).
function labelLength(nil) {
    const c = nil.primary?.canon;
    return 'string' === typeof c && c.length > 0 ? c.length : 1;
}
// Build the human-readable message. Kept identical to the Go port's
// NilVal.Message() (go/val.go) so diagnostics match across
// implementations: "Cannot <attempt> value: X with value: Y\n<hint>".
function nilMessage(nil) {
    if (nil.msg)
        return nil.msg;
    const attempt = nil.attempt ?? (null == nil.secondary ? 'resolve' : 'unify');
    let msg = 'Cannot ' + attempt + ' value';
    if (null != nil.primary) {
        msg += ': ' + nil.primary.canon;
        if (null != nil.secondary) {
            msg += ' with value: ' + nil.secondary.canon;
        }
    }
    const hint = (0, err_1.getHint)(nil.why, nil.details);
    if (hint) {
        msg += '\n' + hint;
    }
    return msg;
}
function parseErrorDiagnostic(err) {
    // jsonic/AontuError may expose 1-based line/col.
    const row = err?.lineNumber ?? err?.row ?? err?.line ?? -1;
    const col = err?.column ?? err?.col ?? -1;
    const start = row >= 1 && col >= 1
        ? { line: row - 1, character: col - 1 }
        : { line: 0, character: 0 };
    return {
        range: { start, end: { line: start.line, character: start.character + 1 } },
        severity: SEVERITY_ERROR,
        code: 'parse',
        source: 'aontu',
        message: ('string' === typeof err?.message ? err.message : String(err)),
    };
}
// initialize result: advertise full-text document sync feeding diagnostics.
function initializeResult() {
    return {
        capabilities: {
            // 1 = TextDocumentSyncKind.Full
            textDocumentSync: 1,
            hoverProvider: true,
            completionProvider: {},
        },
        serverInfo: {
            name: 'aontu-lsp',
            version: LSP_VERSION,
        },
    };
}
function publishDiagnosticsMsg(uri, diagnostics) {
    return {
        jsonrpc: '2.0',
        method: 'textDocument/publishDiagnostics',
        params: { uri, diagnostics },
    };
}
// Resolve the value under the cursor and describe it. Returns null when
// the position is not over a value with a known source location. Because
// hover reads the *unified* tree, a literal shows its resolved value and
// kind (e.g. a reference target resolves to the value it points at).
function computeHover(src, position) {
    let root;
    try {
        root = new aontu_1.Aontu().unify(src, { collect: true });
    }
    catch {
        return null;
    }
    const cands = [];
    collectHoverCandidates(root, cands, new Set());
    let best = null;
    for (const c of cands) {
        if (c.line === position.line &&
            c.start <= position.character && position.character < c.end) {
            // Most specific (smallest) span wins.
            if (null == best || (c.end - c.start) < (best.end - best.start))
                best = c;
        }
    }
    if (null == best)
        return null;
    return {
        contents: { kind: 'markdown', value: hoverMarkdown(best.val) },
        range: {
            start: { line: best.line, character: best.start },
            end: { line: best.line, character: best.end },
        },
    };
}
function collectHoverCandidates(v, out, seen) {
    if (null == v || 'object' !== typeof v || true !== v.isVal)
        return;
    if (seen.has(v))
        return;
    seen.add(v);
    const row = v.site?.row ?? -1;
    const col = v.site?.col ?? -1;
    let canon = '';
    try {
        canon = v.canon;
    }
    catch {
        canon = '';
    }
    // Hover targets concrete values (scalars, kinds, refs, …), not
    // containers: a map/list source span is not reliably reconstructable
    // from a single site, and the same restriction in the Go port keeps
    // hover behaviour identical across implementations. The walk still
    // recurses into containers below to reach their leaf values. Canon is
    // single-line, so its length approximates the on-line source span.
    if (row >= 1 && col >= 1 && canon.length > 0 && !canon.includes('\n') &&
        !v.isMap && !v.isList) {
        out.push({ val: v, line: row - 1, start: col - 1, end: col - 1 + canon.length });
    }
    const peg = v.peg;
    if (Array.isArray(peg)) {
        for (const c of peg)
            collectHoverCandidates(c, out, seen);
    }
    else if (null != peg && 'object' === typeof peg) {
        for (const k in peg)
            collectHoverCandidates(peg[k], out, seen);
    }
    const spreadCj = v.spread?.cj;
    if (spreadCj)
        collectHoverCandidates(spreadCj, out, seen);
}
function hoverMarkdown(val) {
    let canon = '';
    try {
        canon = val.canon;
    }
    catch {
        canon = '';
    }
    return '```aontu\n' + canon + '\n```\n\n' + '*' + valKind(val) + '*';
}
// A short human description of a Val's kind, shown under the hover canon.
function valKind(val) {
    if (val.isNil)
        return 'error';
    if (val.isScalarKind)
        return 'type';
    if (val.isMap)
        return 'map';
    if (val.isList)
        return 'list';
    if (val.isRef)
        return 'reference';
    if (val.isInteger)
        return 'integer';
    if (val.isNumber)
        return 'number';
    if (val.isString)
        return 'string';
    if (val.isBoolean)
        return 'boolean';
    if (val.isScalar)
        return 'scalar';
    return val.constructor.name.replace(/Val$/, '').toLowerCase();
}
// LSP CompletionItemKind subset.
const COMPLETION_FUNCTION = 3;
exports.COMPLETION_FUNCTION = COMPLETION_FUNCTION;
const COMPLETION_KEYWORD = 14;
exports.COMPLETION_KEYWORD = COMPLETION_KEYWORD;
// The twelve built-in functions. Kept in sync with the engine by
// `lsp.test.ts`, which asserts each is recognised and no others are.
const BUILTIN_FUNCS = [
    'close', 'copy', 'hide', 'key', 'lower', 'move',
    'open', 'path', 'pref', 'super', 'type', 'upper',
];
exports.BUILTIN_FUNCS = BUILTIN_FUNCS;
// Scalar-kind and literal keywords.
const KIND_KEYWORDS = ['string', 'number', 'integer', 'boolean'];
const LITERAL_KEYWORDS = ['true', 'false', 'null', 'top'];
// Context-free completion: the built-in functions, scalar-kind keywords
// and literals. Clients filter by the typed prefix.
function computeCompletions() {
    const out = [];
    for (const f of BUILTIN_FUNCS) {
        out.push({ label: f, kind: COMPLETION_FUNCTION, detail: 'Aontu built-in function' });
    }
    for (const k of KIND_KEYWORDS) {
        out.push({ label: k, kind: COMPLETION_KEYWORD, detail: 'scalar kind' });
    }
    for (const k of LITERAL_KEYWORDS) {
        out.push({ label: k, kind: COMPLETION_KEYWORD, detail: 'keyword' });
    }
    return out;
}
// Transport-agnostic LSP message dispatcher. Consumes decoded JSON-RPC
// messages and returns the messages to send back, tracking open document
// text and recomputing diagnostics on open/change/close. Not safe for
// concurrent use; drive it from a single loop (as the stdio server does).
class LspHandler {
    constructor() {
        this.docs = new Map();
        this.shutdownOK = false;
        this.exited = false;
    }
    // True once an `exit` notification has been received.
    get shouldExit() { return this.exited; }
    // Process exit code per the LSP spec: 0 if `shutdown` preceded `exit`,
    // else 1.
    get exitCode() { return this.shutdownOK ? 0 : 1; }
    // Current text of an open document, or undefined.
    doc(uri) { return this.docs.get(uri); }
    // Process one incoming message, returning zero or more to send.
    handle(msg) {
        switch (msg.method) {
            case 'initialize':
                return [{ jsonrpc: '2.0', id: msg.id, result: initializeResult() }];
            case 'initialized':
                return [];
            case 'shutdown':
                this.shutdownOK = true;
                return [{ jsonrpc: '2.0', id: msg.id, result: null }];
            case 'exit':
                this.exited = true;
                return [];
            case 'textDocument/didOpen': {
                const td = msg.params?.textDocument;
                if (null == td?.uri)
                    return [];
                this.docs.set(td.uri, td.text ?? '');
                return [this.publish(td.uri)];
            }
            case 'textDocument/didChange': {
                const uri = msg.params?.textDocument?.uri;
                const changes = msg.params?.contentChanges;
                if (null == uri || !Array.isArray(changes) || 0 === changes.length)
                    return [];
                // Full document sync: the last change holds the entire new text.
                this.docs.set(uri, changes[changes.length - 1].text ?? '');
                return [this.publish(uri)];
            }
            case 'textDocument/didClose': {
                const uri = msg.params?.textDocument?.uri;
                if (null == uri)
                    return [];
                this.docs.delete(uri);
                // Clear diagnostics for the closed document.
                return [publishDiagnosticsMsg(uri, [])];
            }
            case 'textDocument/hover': {
                const uri = msg.params?.textDocument?.uri;
                const pos = msg.params?.position;
                const text = null != uri ? this.docs.get(uri) : undefined;
                const hover = (null != text && null != pos) ? computeHover(text, pos) : null;
                return [{ jsonrpc: '2.0', id: msg.id, result: hover }];
            }
            case 'textDocument/completion':
                return [{ jsonrpc: '2.0', id: msg.id, result: computeCompletions() }];
            default:
                // Unknown request (has an id): reply method-not-found. Unknown
                // notification: ignore.
                if (null != msg.id) {
                    return [{
                            jsonrpc: '2.0',
                            id: msg.id,
                            error: { code: -32601, message: 'method not found: ' + msg.method },
                        }];
                }
                return [];
        }
    }
    publish(uri) {
        return publishDiagnosticsMsg(uri, computeDiagnostics(this.docs.get(uri) ?? ''));
    }
}
exports.LspHandler = LspHandler;
//# sourceMappingURL=lsp.js.map