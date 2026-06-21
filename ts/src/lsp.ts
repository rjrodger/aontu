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
      hoverProvider: true,
      completionProvider: {},
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


// --- Hover ------------------------------------------------------------

type MarkupContent = { kind: 'markdown' | 'plaintext', value: string }
type Hover = { contents: MarkupContent, range?: Range }


// Resolve the value under the cursor and describe it. Returns null when
// the position is not over a value with a known source location. Because
// hover reads the *unified* tree, a literal shows its resolved value and
// kind (e.g. a reference target resolves to the value it points at).
function computeHover(src: string, position: Position): Hover | null {
  let root: any
  try {
    root = new Aontu().unify(src, { collect: true })
  }
  catch {
    return null
  }

  const cands: { val: any, line: number, start: number, end: number }[] = []
  collectHoverCandidates(root, cands, new Set())

  let best: { val: any, line: number, start: number, end: number } | null = null
  for (const c of cands) {
    if (c.line === position.line &&
      c.start <= position.character && position.character < c.end) {
      // Most specific (smallest) span wins.
      if (null == best || (c.end - c.start) < (best.end - best.start)) best = c
    }
  }
  if (null == best) return null

  return {
    contents: { kind: 'markdown', value: hoverMarkdown(best.val) },
    range: {
      start: { line: best.line, character: best.start },
      end: { line: best.line, character: best.end },
    },
  }
}


function collectHoverCandidates(
  v: any,
  out: { val: any, line: number, start: number, end: number }[],
  seen: Set<any>,
) {
  if (null == v || 'object' !== typeof v || true !== v.isVal) return
  if (seen.has(v)) return
  seen.add(v)

  const row = v.site?.row ?? -1
  const col = v.site?.col ?? -1
  let canon = ''
  try { canon = v.canon } catch { canon = '' }
  // Hover targets concrete values (scalars, kinds, refs, …), not
  // containers: a map/list source span is not reliably reconstructable
  // from a single site, and the same restriction in the Go port keeps
  // hover behaviour identical across implementations. The walk still
  // recurses into containers below to reach their leaf values. Canon is
  // single-line, so its length approximates the on-line source span.
  if (row >= 1 && col >= 1 && canon.length > 0 && !canon.includes('\n') &&
    !v.isMap && !v.isList) {
    out.push({ val: v, line: row - 1, start: col - 1, end: col - 1 + canon.length })
  }

  const peg = v.peg
  if (Array.isArray(peg)) {
    for (const c of peg) collectHoverCandidates(c, out, seen)
  }
  else if (null != peg && 'object' === typeof peg) {
    for (const k in peg) collectHoverCandidates(peg[k], out, seen)
  }
  const spreadCj = v.spread?.cj
  if (spreadCj) collectHoverCandidates(spreadCj, out, seen)
}


function hoverMarkdown(val: any): string {
  let canon = ''
  try { canon = val.canon } catch { canon = '' }
  return '```aontu\n' + canon + '\n```\n\n' + '*' + valKind(val) + '*'
}


// A short human description of a Val's kind, shown under the hover canon.
function valKind(val: any): string {
  if (val.isNil) return 'error'
  if (val.isScalarKind) return 'type'
  if (val.isMap) return 'map'
  if (val.isList) return 'list'
  if (val.isRef) return 'reference'
  if (val.isInteger) return 'integer'
  if (val.isNumber) return 'number'
  if (val.isString) return 'string'
  if (val.isBoolean) return 'boolean'
  if (val.isScalar) return 'scalar'
  return val.constructor.name.replace(/Val$/, '').toLowerCase()
}


// --- Completion -------------------------------------------------------

type CompletionItem = {
  label: string
  kind?: number   // LSP CompletionItemKind
  detail?: string
}

// LSP CompletionItemKind subset.
const COMPLETION_FUNCTION = 3
const COMPLETION_KEYWORD = 14

// The twelve built-in functions. Kept in sync with the engine by
// `lsp.test.ts`, which asserts each is recognised and no others are.
const BUILTIN_FUNCS = [
  'close', 'copy', 'hide', 'key', 'lower', 'move',
  'open', 'path', 'pref', 'super', 'type', 'upper',
]

// Scalar-kind and literal keywords.
const KIND_KEYWORDS = ['string', 'number', 'integer', 'boolean']
const LITERAL_KEYWORDS = ['true', 'false', 'null', 'top']


// Context-free completion: the built-in functions, scalar-kind keywords
// and literals. Clients filter by the typed prefix.
function computeCompletions(): CompletionItem[] {
  const out: CompletionItem[] = []
  for (const f of BUILTIN_FUNCS) {
    out.push({ label: f, kind: COMPLETION_FUNCTION, detail: 'Aontu built-in function' })
  }
  for (const k of KIND_KEYWORDS) {
    out.push({ label: k, kind: COMPLETION_KEYWORD, detail: 'scalar kind' })
  }
  for (const k of LITERAL_KEYWORDS) {
    out.push({ label: k, kind: COMPLETION_KEYWORD, detail: 'keyword' })
  }
  return out
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

      case 'textDocument/hover': {
        const uri = msg.params?.textDocument?.uri
        const pos = msg.params?.position
        const text = null != uri ? this.docs.get(uri) : undefined
        const hover = (null != text && null != pos) ? computeHover(text, pos) : null
        return [{ jsonrpc: '2.0', id: msg.id, result: hover }]
      }

      case 'textDocument/completion':
        return [{ jsonrpc: '2.0', id: msg.id, result: computeCompletions() }]

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
  computeHover,
  computeCompletions,
  LspHandler,
  LSP_VERSION,
  BUILTIN_FUNCS,
  SEVERITY_ERROR,
  SEVERITY_WARNING,
  SEVERITY_INFORMATION,
  SEVERITY_HINT,
  COMPLETION_FUNCTION,
  COMPLETION_KEYWORD,
}

export type {
  Position,
  Range,
  Diagnostic,
  Message,
  OutMessage,
  Hover,
  MarkupContent,
  CompletionItem,
}
