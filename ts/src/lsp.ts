/* Copyright (c) 2025 Richard Rodger, MIT License */

// Aontu Language Server library.
//
// This module is the reusable, transport-free core of the language
// server, deliberately split from the process that serves it:
//
//   - `computeDiagnostics(src)` turns Aontu source into LSP diagnostics.
//   - `LspHandler` implements the LSP message flow (document sync ->
//     publishDiagnostics) over decoded JSON-RPC *objects*, with no
//     stdin/stdout. It is fully unit-testable and embeddable.
//   - the server (`lsp-server.ts`) is a thin stdio JSON-RPC loop that
//     frames bytes and feeds decoded messages to an `LspHandler`.
//
// The Go port mirrors this split in go/lsp (library) and
// go/cmd/aontu-lsp (server). Diagnostic messages are built the same way
// in both so editors see identical text regardless of implementation.

import type { Val } from './type'

import { Aontu } from './aontu'
import { getHint } from './err'


// LSP DiagnosticSeverity subset.
const SEVERITY_ERROR = 1
const SEVERITY_WARNING = 2
const SEVERITY_INFORMATION = 3
const SEVERITY_HINT = 4

// Reported to the client in the initialize response.
const LSP_VERSION = '0.1.0'


// Zero-based line / UTF-16 character offset (LSP Position).
type Position = { line: number, character: number }

// Inclusive-start, exclusive-end span (LSP Range).
type Range = { start: Position, end: Position }

// A single LSP diagnostic.
type Diagnostic = {
  range: Range
  severity: number
  code?: string
  source: string
  message: string
}


// Incoming JSON-RPC message (request or notification).
type Message = {
  jsonrpc?: string
  id?: number | string | null
  method?: string
  params?: any
}

// Outgoing JSON-RPC message (response or notification).
type OutMessage = {
  jsonrpc: string
  id?: number | string | null
  method?: string
  params?: any
  result?: any
  error?: { code: number, message: string }
}


// Compute LSP diagnostics for a unit of Aontu source. A valid document —
// including a non-concrete schema such as `a:string` — returns an empty
// array; only genuine errors (conflicts, unresolved references, unknown
// functions, syntax errors) produce diagnostics.
function computeDiagnostics(
  src: string,
  opts?: { vars?: Record<string, Val> }
): Diagnostic[] {
  const aontu = new Aontu()

  let root: any
  try {
    const ac = aontu.ctx({ collect: true })
    if (opts?.vars) {
      Object.assign(ac.vars, opts.vars)
    }
    root = aontu.unify(src, { collect: true }, ac)
  }
  catch (err: any) {
    // Hard parse/syntax failure: report a single diagnostic. jsonic
    // errors may carry 1-based line/col; fall back to the document start.
    return [parseErrorDiagnostic(err)]
  }

  const nils: any[] = []
  walkNils(root, nils, new Set())

  return nils.map(nilToDiagnostic)
}


// Walk a unified Val tree collecting every NilVal exactly once. A NilVal
// in the result always represents an error; valid non-concrete values
// (scalar kinds, refs, conjuncts) are never NilVals.
function walkNils(v: any, out: any[], seen: Set<any>) {
  if (null == v || 'object' !== typeof v || true !== v.isVal) return
  if (seen.has(v)) return
  seen.add(v)

  if (v.isNil) {
    out.push(v)
    return
  }

  const peg = v.peg
  if (Array.isArray(peg)) {
    for (const c of peg) walkNils(c, out, seen)
  }
  else if (null != peg && 'object' === typeof peg) {
    for (const k in peg) walkNils(peg[k], out, seen)
  }

  // Spread constraints live off-peg on Map/List Vals.
  const spreadCj = v.spread?.cj
  if (spreadCj) walkNils(spreadCj, out, seen)
}


// Convert a NilVal (1-based site row/col) to an LSP diagnostic (0-based
// line/character).
function nilToDiagnostic(nil: any): Diagnostic {
  const row = nil.site?.row ?? -1
  const col = nil.site?.col ?? -1

  let start: Position
  let end: Position
  if (row >= 1 && col >= 1) {
    start = { line: row - 1, character: col - 1 }
    const len = labelLength(nil)
    end = { line: row - 1, character: col - 1 + len }
  }
  else {
    start = { line: 0, character: 0 }
    end = { line: 0, character: 1 }
  }

  return {
    range: { start, end },
    severity: SEVERITY_ERROR,
    code: nil.why,
    source: 'aontu',
    message: nilMessage(nil),
  }
}


// Length (UTF-16 units, like LSP characters) of the offending value's
// canonical form, used to size the diagnostic range (minimum 1).
function labelLength(nil: any): number {
  const c = nil.primary?.canon
  return 'string' === typeof c && c.length > 0 ? c.length : 1
}


// Build the human-readable message. Kept identical to the Go port's
// NilVal.Message() (go/val.go) so diagnostics match across
// implementations: "Cannot <attempt> value: X with value: Y\n<hint>".
function nilMessage(nil: any): string {
  if (nil.msg) return nil.msg

  const attempt = nil.attempt ?? (null == nil.secondary ? 'resolve' : 'unify')
  let msg = 'Cannot ' + attempt + ' value'
  if (null != nil.primary) {
    msg += ': ' + nil.primary.canon
    if (null != nil.secondary) {
      msg += ' with value: ' + nil.secondary.canon
    }
  }
  const hint = getHint(nil.why, nil.details)
  if (hint) {
    msg += '\n' + hint
  }
  return msg
}


function parseErrorDiagnostic(err: any): Diagnostic {
  // jsonic/AontuError may expose 1-based line/col.
  const row = err?.lineNumber ?? err?.row ?? err?.line ?? -1
  const col = err?.column ?? err?.col ?? -1
  const start: Position = row >= 1 && col >= 1
    ? { line: row - 1, character: col - 1 }
    : { line: 0, character: 0 }
  return {
    range: { start, end: { line: start.line, character: start.character + 1 } },
    severity: SEVERITY_ERROR,
    code: 'parse',
    source: 'aontu',
    message: ('string' === typeof err?.message ? err.message : String(err)),
  }
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
  }
}


function publishDiagnosticsMsg(uri: string, diagnostics: Diagnostic[]): OutMessage {
  return {
    jsonrpc: '2.0',
    method: 'textDocument/publishDiagnostics',
    params: { uri, diagnostics },
  }
}


// Transport-agnostic LSP message dispatcher. Consumes decoded JSON-RPC
// messages and returns the messages to send back, tracking open document
// text and recomputing diagnostics on open/change/close. Not safe for
// concurrent use; drive it from a single loop (as the stdio server does).
class LspHandler {
  private docs = new Map<string, string>()
  private shutdownOK = false
  private exited = false

  // True once an `exit` notification has been received.
  get shouldExit(): boolean { return this.exited }

  // Process exit code per the LSP spec: 0 if `shutdown` preceded `exit`,
  // else 1.
  get exitCode(): number { return this.shutdownOK ? 0 : 1 }

  // Current text of an open document, or undefined.
  doc(uri: string): string | undefined { return this.docs.get(uri) }

  // Process one incoming message, returning zero or more to send.
  handle(msg: Message): OutMessage[] {
    switch (msg.method) {
      case 'initialize':
        return [{ jsonrpc: '2.0', id: msg.id, result: initializeResult() }]

      case 'initialized':
        return []

      case 'shutdown':
        this.shutdownOK = true
        return [{ jsonrpc: '2.0', id: msg.id, result: null }]

      case 'exit':
        this.exited = true
        return []

      case 'textDocument/didOpen': {
        const td = msg.params?.textDocument
        if (null == td?.uri) return []
        this.docs.set(td.uri, td.text ?? '')
        return [this.publish(td.uri)]
      }

      case 'textDocument/didChange': {
        const uri = msg.params?.textDocument?.uri
        const changes = msg.params?.contentChanges
        if (null == uri || !Array.isArray(changes) || 0 === changes.length) return []
        // Full document sync: the last change holds the entire new text.
        this.docs.set(uri, changes[changes.length - 1].text ?? '')
        return [this.publish(uri)]
      }

      case 'textDocument/didClose': {
        const uri = msg.params?.textDocument?.uri
        if (null == uri) return []
        this.docs.delete(uri)
        // Clear diagnostics for the closed document.
        return [publishDiagnosticsMsg(uri, [])]
      }

      default:
        // Unknown request (has an id): reply method-not-found. Unknown
        // notification: ignore.
        if (null != msg.id) {
          return [{
            jsonrpc: '2.0',
            id: msg.id,
            error: { code: -32601, message: 'method not found: ' + msg.method },
          }]
        }
        return []
    }
  }

  private publish(uri: string): OutMessage {
    return publishDiagnosticsMsg(uri, computeDiagnostics(this.docs.get(uri) ?? ''))
  }
}


export {
  computeDiagnostics,
  LspHandler,
  LSP_VERSION,
  SEVERITY_ERROR,
  SEVERITY_WARNING,
  SEVERITY_INFORMATION,
  SEVERITY_HINT,
}

export type {
  Position,
  Range,
  Diagnostic,
  Message,
  OutMessage,
}
