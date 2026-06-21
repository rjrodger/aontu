/* Copyright (c) 2025 Richard Rodger, MIT License */

import { describe, test } from 'node:test'
import * as Assert from 'node:assert'

import {
  computeDiagnostics,
  LspHandler,
  SEVERITY_ERROR,
} from '../dist/lsp'

import { FrameCodec } from '../dist/lsp-server'


describe('lsp-diagnostics', () => {

  test('valid-documents-have-no-diagnostics', () => {
    for (const src of [
      'a:1 b:2',
      'a:string',            // non-concrete schema is valid
      'a:{b:string, c:1}',   // nested schema
      'a:1\nb:$.a',          // resolving reference
      'x:{a:1} & {b:2}',     // map merge
    ]) {
      Assert.equal(computeDiagnostics(src).length, 0, src)
    }
  })

  test('conflict-position', () => {
    const d = computeDiagnostics('a:1\na:2')
    Assert.equal(d.length, 1)
    Assert.equal(d[0].severity, SEVERITY_ERROR)
    Assert.equal(d[0].code, 'scalar_value')
    Assert.equal(d[0].source, 'aontu')
    Assert.deepEqual(d[0].range.start, { line: 1, character: 2 })
    Assert.match(d[0].message, /Cannot unify value/)
  })

  test('unknown-function-position', () => {
    const d = computeDiagnostics('x:foo(1)')
    Assert.equal(d.length, 1)
    Assert.equal(d[0].code, 'unknown_function')
    Assert.deepEqual(d[0].range.start, { line: 0, character: 2 })
  })

  test('no-path-position', () => {
    const d = computeDiagnostics('a:$.missing')
    Assert.equal(d.length, 1)
    Assert.equal(d[0].code, 'no_path')
    Assert.deepEqual(d[0].range.start, { line: 0, character: 2 })
  })

  test('multibyte-column-utf16', () => {
    // A multi-byte rune before the error must not shift the column:
    // LSP characters are UTF-16 units, so "é" counts as 1.
    const d = computeDiagnostics('a:"é"\nb:1 b:2')
    Assert.equal(d.length, 1)
    Assert.deepEqual(d[0].range.start, { line: 1, character: 6 })
  })

})


describe('lsp-handler', () => {

  test('initialize-advertises-capabilities', () => {
    const h = new LspHandler()
    const outs = h.handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} })
    Assert.equal(outs.length, 1)
    Assert.equal(outs[0].id, 1)
    Assert.equal(outs[0].result.capabilities.textDocumentSync, 1)
    Assert.equal(outs[0].result.serverInfo.name, 'aontu-lsp')
  })

  test('didOpen-publishes-diagnostics', () => {
    const h = new LspHandler()
    const outs = h.handle({
      jsonrpc: '2.0',
      method: 'textDocument/didOpen',
      params: { textDocument: { uri: 'file:///t.aontu', text: 'a:1 a:2' } },
    })
    Assert.equal(outs.length, 1)
    Assert.equal(outs[0].method, 'textDocument/publishDiagnostics')
    Assert.equal(outs[0].params.uri, 'file:///t.aontu')
    Assert.equal(outs[0].params.diagnostics.length, 1)
    Assert.equal(h.doc('file:///t.aontu'), 'a:1 a:2')
  })

  test('didChange-then-didClose', () => {
    const h = new LspHandler()
    h.handle({
      method: 'textDocument/didOpen',
      params: { textDocument: { uri: 'file:///t.aontu', text: 'a:1 a:2' } },
    })

    // Fix the conflict -> diagnostics clear.
    const changed = h.handle({
      method: 'textDocument/didChange',
      params: {
        textDocument: { uri: 'file:///t.aontu' },
        contentChanges: [{ text: 'a:1 b:2' }],
      },
    })
    Assert.equal(changed[0].params.diagnostics.length, 0)

    // Close -> empty diagnostics and untracked.
    const closed = h.handle({
      method: 'textDocument/didClose',
      params: { textDocument: { uri: 'file:///t.aontu' } },
    })
    Assert.equal(closed[0].method, 'textDocument/publishDiagnostics')
    Assert.equal(closed[0].params.diagnostics.length, 0)
    Assert.equal(h.doc('file:///t.aontu'), undefined)
  })

  test('shutdown-then-exit-code-0', () => {
    const h = new LspHandler()
    Assert.equal(h.shouldExit, false)
    h.handle({ id: 9, method: 'shutdown' })
    const outs = h.handle({ method: 'exit' })
    Assert.equal(outs.length, 0)
    Assert.equal(h.shouldExit, true)
    Assert.equal(h.exitCode, 0)
  })

  test('exit-without-shutdown-code-1', () => {
    const h = new LspHandler()
    h.handle({ method: 'exit' })
    Assert.equal(h.exitCode, 1)
  })

  test('unknown-request-is-method-not-found', () => {
    const h = new LspHandler()
    const outs = h.handle({ id: 3, method: 'textDocument/hover' })
    Assert.equal(outs.length, 1)
    Assert.equal(outs[0].error?.code, -32601)
    // Unknown notification (no id) is ignored.
    Assert.equal(h.handle({ method: '$/setTrace' }).length, 0)
  })

})


describe('lsp-server-framing', () => {

  function frame(payload: string): Buffer {
    const body = Buffer.from(payload, 'utf8')
    return Buffer.concat([
      Buffer.from('Content-Length: ' + body.length + '\r\n\r\n', 'ascii'),
      body,
    ])
  }

  function parseFrames(buf: Buffer): any[] {
    const out: any[] = []
    let rest = buf
    for (; ;) {
      const headerEnd = rest.indexOf('\r\n\r\n')
      if (headerEnd < 0) break
      const header = rest.subarray(0, headerEnd).toString('ascii')
      const m = /Content-Length:\s*(\d+)/i.exec(header)
      if (null == m) break
      const len = parseInt(m[1], 10)
      const start = headerEnd + 4
      const body = rest.subarray(start, start + len).toString('utf8')
      out.push(JSON.parse(body))
      rest = rest.subarray(start + len)
    }
    return out
  }

  test('round-trip-over-frame-codec', () => {
    const h = new LspHandler()
    const written: Buffer[] = []
    let exitCode = -1
    const codec = new FrameCodec(h, (c: Buffer) => written.push(c), (code: number) => { exitCode = code })

    codec.push(frame('{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'))
    codec.push(frame('{"jsonrpc":"2.0","method":"initialized","params":{}}'))
    codec.push(frame('{"jsonrpc":"2.0","method":"textDocument/didOpen","params":{"textDocument":{"uri":"file:///x.aontu","text":"a:1 a:2"}}}'))
    codec.push(frame('{"jsonrpc":"2.0","id":2,"method":"shutdown"}'))
    codec.push(frame('{"jsonrpc":"2.0","method":"exit"}'))

    const msgs = parseFrames(Buffer.concat(written))
    Assert.equal(msgs.length, 3)
    Assert.equal(msgs[0].id, 1)
    Assert.equal(msgs[0].result.serverInfo.name, 'aontu-lsp')
    Assert.equal(msgs[1].method, 'textDocument/publishDiagnostics')
    Assert.equal(msgs[1].params.diagnostics.length, 1)
    Assert.equal(msgs[2].id, 2)
    Assert.equal(msgs[2].result, null)
    Assert.equal(exitCode, 0)
  })

  test('split-frame-across-chunks', () => {
    const h = new LspHandler()
    const written: Buffer[] = []
    const codec = new FrameCodec(h, (c: Buffer) => written.push(c), () => { })

    const f = frame('{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}')
    // Deliver the frame one byte at a time.
    for (const byte of f) {
      codec.push(Buffer.from([byte]))
    }
    const msgs = parseFrames(Buffer.concat(written))
    Assert.equal(msgs.length, 1)
    Assert.equal(msgs[0].id, 1)
  })

})
