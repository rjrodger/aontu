"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEVERITY_HINT = exports.SEVERITY_INFORMATION = exports.SEVERITY_WARNING = exports.SEVERITY_ERROR = exports.LSP_VERSION = exports.LspHandler = void 0;
exports.computeDiagnostics = computeDiagnostics;
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