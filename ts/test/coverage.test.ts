/* Copyright (c) 2025 Richard Rodger, MIT License */

// Coverage round 3: direct unit tests for internal paths no source
// input or shared spec row reaches — debug/inspect rendering, the
// explain-trace formatters, raw variable bindings, operator base
// machinery, and the CLI/LSP process plumbing (see
// docs/test-coverage.md).

import { describe, test } from 'node:test'
import * as Assert from 'node:assert'
import * as Util from 'node:util'
import * as Fs from 'node:fs'
import * as Os from 'node:os'
import * as Path from 'node:path'

import { AontuContext } from '../dist/ctx'
import { AontuError } from '../dist/err'
import {
  items,
  formatPath,
  walk,
  explainOpen,
  ec,
  explainClose,
  formatExplain,
} from '../dist/utility'

import { Val, empty } from '../dist/val/Val'
import { top } from '../dist/val/top'
import { MapVal } from '../dist/val/MapVal'
import { ListVal } from '../dist/val/ListVal'
import { IntegerVal } from '../dist/val/IntegerVal'
import { StringVal } from '../dist/val/StringVal'
import { VarVal } from '../dist/val/VarVal'
import { RefVal } from '../dist/val/RefVal'
import { ExpectVal } from '../dist/val/ExpectVal'
import { OpBaseVal } from '../dist/val/OpBaseVal'

import { main } from '../dist/cli'
import { LspHandler } from '../dist/lsp'
import { FrameCodec } from '../dist/lsp-server'


function makeCtx(vars?: Record<string, any>) {
  const ctx = new AontuContext({ root: new MapVal({ peg: {} }) })
  if (vars) {
    for (const k in vars) {
      ctx.vars[k] = vars[k]
    }
  }
  return ctx
}


describe('coverage-utility', () => {

  test('format-path', () => {
    Assert.equal(formatPath(['a', 'b']), '$.a.b')
    Assert.equal(formatPath(['a'], false), 'a')
    Assert.equal(formatPath([]), '')
    const v = new IntegerVal({ peg: 1 })
    v.path = ['x', 'y']
    Assert.equal(formatPath(v), '$.x.y')
  })

  test('walk-guards-and-arrays', () => {
    const m = new MapVal({ peg: { k: new IntegerVal({ peg: 1 }) } })
    const l = new ListVal({ peg: [new IntegerVal({ peg: 2 })] })

    // maxdepth 0: no descent, before still applies.
    let seen: string[] = []
    walk(m, (_k, v) => (seen.push(v.constructor.name), v), undefined, 0)
    Assert.deepEqual(seen, ['MapVal'])

    // maxdepth 1: children visited once, grandchildren pruned.
    const nested = new MapVal({ peg: { a: m } })
    seen = []
    walk(nested, (_k, v) => (seen.push(v.constructor.name), v), undefined, 1)
    Assert.ok(seen.length >= 2)

    // Array peg descends by index, with an after hook.
    seen = []
    walk(l, undefined, (_k, v) => (seen.push(v.constructor.name), v))
    Assert.deepEqual(seen, ['IntegerVal', 'ListVal'])
  })

  test('explain-trace', () => {
    const ctx = { cc: 1, path: ['a'] }
    Assert.equal(explainOpen(ctx, false, 'skip'), null)
    const a = new IntegerVal({ peg: 1 })
    const b = new IntegerVal({ peg: 2 })
    const t = explainOpen(ctx, undefined, 'Unify', a, b) as any[]
    Assert.ok(t[0].includes('1~Unify'))
    Assert.equal(ec(null, 'w'), undefined)
    const child = ec(t, 'CHILD')
    Assert.ok(Array.isArray(child))
    explainClose(null)
    explainClose(t, a)
    const text = formatExplain(t)
    Assert.ok(text.includes('Unify'))
    Assert.ok(text.includes('CHILD'))
    Assert.ok(formatExplain('leaf' as any, 1).includes('leaf'))
  })

  test('items', () => {
    Assert.deepEqual(items([7]), [[0, 7]])
    Assert.deepEqual(items({ a: 1 }), [['a', 1]])
    Assert.deepEqual(items(null), [])
    Assert.deepEqual(items(3), [])
  })
})


describe('coverage-varval', () => {

  test('raw-bindings', () => {
    const cases: Array<[any, string]> = [
      ['hello', '"hello"'],
      [true, 'true'],
      [5, '5'],
      [1.5, '1.5'],
      [null, 'null'],
    ]
    for (const [bind, want] of cases) {
      const ctx = makeCtx({ v: bind })
      const out = new VarVal({ peg: 'v' }, ctx).unify(top(), ctx)
      Assert.equal(out.canon, want, 'binding ' + String(bind))
    }
  })

  test('invalid-kind-and-non-string-name', () => {
    const ctx = makeCtx({ o: { plain: 1 } })
    const bad = new VarVal({ peg: 'o' }, ctx).unify(top(), ctx)
    Assert.equal(bad.isNil, true)

    const numName = new VarVal({ peg: new IntegerVal({ peg: 1 }) }, ctx)
    Assert.equal(numName.unify(top(), ctx).isNil, true)
  })

  test('ref-peg-goes-absolute', () => {
    const ctx = makeCtx()
    const rv = new RefVal({ peg: ['a'] })
    const vv = new VarVal({ peg: rv }, ctx)
    const out = vv.unify(top(), ctx)
    Assert.equal(rv.absolute, true)
    Assert.equal(out.isNil, false)
  })

  test('peer-applies-to-value', () => {
    const ctx = makeCtx({ n: 5 })
    const out = new VarVal({ peg: 'n' }, ctx)
      .unify(new IntegerVal({ peg: 5 }), ctx)
    Assert.equal(out.canon, '5')
  })

  test('same-clone-gen', () => {
    const ctx = makeCtx()
    const v = new VarVal({ peg: 'x' }, ctx)
    Assert.equal(v.same(null as any), false)
    Assert.equal(v.same(new VarVal({ peg: 'x' }, ctx)), true)
    Assert.equal(v.clone(ctx).canon, '$x')

    Assert.equal(v.gen(ctx), undefined)
    Assert.ok(0 < ctx.err.length)
    Assert.throws(() => v.gen(), AontuError)
  })
})


describe('coverage-expectval', () => {

  test('second-peer-and-gen', () => {
    const ctx = makeCtx()
    const e = new ExpectVal({ peg: new IntegerVal({ peg: 1 }) }, ctx)
    const one = new IntegerVal({ peg: 1 })
    const out1 = e.unify(one, ctx)
    Assert.equal(out1.canon, '1')
    // A second non-top peer unites with the stored peer.
    e.unify(new IntegerVal({ peg: 1 }), ctx)

    Assert.equal(e.gen(ctx), undefined)
    Assert.ok(e.inspection(0).includes('key='))
  })
})


describe('coverage-opbase', () => {

  test('base-machinery', () => {
    const ctx = makeCtx()
    const peg = [new IntegerVal({ peg: 1 })]
    const op = new OpBaseVal({ peg }, ctx)

    Assert.equal(op.opname(), 'op')
    Assert.equal(op.canon, 'op')
    Assert.equal(op.unify(op, ctx), op)
    Assert.equal(op.make(ctx, {}).isNil, true)
    Assert.equal(op.operate(ctx, [])!.isNil, true)
    Assert.equal(op.same(null as any), false)
    const opb = new OpBaseVal({ peg }, ctx)
    opb.peg = op.peg
    Assert.equal(op.same(opb), true)
    Assert.equal(op.clone(ctx).canon, 'op')
  })

  test('primatize', () => {
    const ctx = makeCtx()
    const op = new OpBaseVal({ peg: [] }, ctx)
    Assert.equal(op.primatize('s'), 's')
    Assert.equal(op.primatize(null), null)
    Assert.equal(op.primatize(new IntegerVal({ peg: 3 })), 3)
    Assert.equal(op.primatize({ toString: () => 'T' }), 'T')
    Assert.equal(op.primatize(Object.create(null)), undefined)
  })

  test('gen', () => {
    const ctx = makeCtx()
    const op = new OpBaseVal({ peg: [] }, ctx)
    Assert.equal(op.gen(ctx), undefined)
    Assert.ok(0 < ctx.err.length)
    Assert.throws(() => op.gen(), AontuError)
  })
})


describe('coverage-val-base', () => {

  test('ctx-errcanon-gen-notdone', () => {
    const ctx = makeCtx()
    const v = new MapVal({ peg: {} }, ctx)
    Assert.equal(v.ctx(), ctx)
    Assert.equal(v.errcanon(), '')
    v.err = [new IntegerVal({ peg: 1 })]
    Assert.equal(v.errcanon(), '<ERRS:1>')
    Assert.equal(Val.prototype.gen.call(v, ctx), undefined)
    Assert.equal(Val.prototype.inspection.call(v), '')

    const p = new IntegerVal({ peg: 1 })
    const dc0 = p.dc
    p.notdone()
    Assert.ok(p.dc === dc0 || p.dc === dc0 + 1)
  })

  test('inspect-rendering', () => {
    const m = new MapVal({ peg: { x: new IntegerVal({ peg: 1 }) } })
    const l = new ListVal({ peg: [new StringVal({ peg: 's' })] })
    const s = new IntegerVal({ peg: 7 })

    Assert.ok(Util.inspect(m).includes('Map'))
    Assert.ok(m.inspect().includes('Integer'))
    Assert.ok(l.inspect().includes('String'))
    Assert.ok(s.inspect().includes('7'))

    // A Val-typed peg renders through the child's own inspect, and a
    // function peg renders by name.
    const e = new ExpectVal({ peg: new IntegerVal({ peg: 2 }) })
    Assert.ok(e.inspect().includes('Integer'))
    const fv = new IntegerVal({ peg: 1 }) as any
    fv.peg = function namedpeg() { }
    Assert.ok(fv.inspect().includes('namedpeg'))
  })

  test('empty', () => {
    Assert.equal(empty([]), true)
    Assert.equal(empty({}), true)
    Assert.equal(empty([1]), false)
    Assert.equal(empty(1), false)
    Assert.equal(empty(null), false)
  })
})


describe('coverage-cli-main', () => {

  function capture(fn: () => void): { out: string; err: string } {
    const so = process.stdout.write
    const se = process.stderr.write
    let out = ''
    let err = ''
    ;(process.stdout as any).write = (s: any) => ((out += s), true)
    ;(process.stderr as any).write = (s: any) => ((err += s), true)
    try {
      fn()
    }
    finally {
      process.stdout.write = so
      process.stderr.write = se
      process.exitCode = 0
    }
    return { out, err }
  }

  test('help-version-badopt', () => {
    let r = capture(() => main(['node', 'cli', '--help']))
    Assert.match(r.out, /Usage: aontu/)
    r = capture(() => main(['node', 'cli', '-v']))
    Assert.match(r.out, /^\d+\.\d+\.\d+/)
    r = capture(() => main(['node', 'cli', '--bogus']))
    Assert.match(r.err, /unknown option/)
  })

  test('file-modes', () => {
    const dir = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'aontu-cli-'))
    const file = Path.join(dir, 'm.aontu')
    Fs.writeFileSync(file, 'a:1 b:$.a')

    let r = capture(() => main(['node', 'cli', file]))
    Assert.deepEqual(JSON.parse(r.out), { a: 1, b: 1 })
    r = capture(() => main(['node', 'cli', '-c', file]))
    Assert.equal(r.out.trim(), '{"a":1,"b":1}')
    r = capture(() => main(['node', 'cli', Path.join(dir, 'nope.aontu')]))
    Assert.match(r.err, /cannot read/)
  })
})


describe('coverage-lsp-server', () => {

  function frame(body: string): Buffer {
    return Buffer.concat([
      Buffer.from('Content-Length: ' + Buffer.byteLength(body) + '\r\n\r\n', 'ascii'),
      Buffer.from(body, 'utf8'),
    ])
  }

  test('frame-codec-errors-and-exit', () => {
    const handler = new LspHandler()
    const written: Buffer[] = []
    let exited: number | undefined
    const codec = new FrameCodec(
      handler,
      (c: Buffer) => written.push(Buffer.from(c)),
      (code: number) => (exited = code),
    )

    codec.push(Buffer.from('Garbage-Header: 1\r\n\r\n', 'ascii'))
    codec.push(frame('{'))
    codec.push(frame(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' })))
    Assert.ok(0 < written.length)
    codec.push(frame(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'shutdown' })))
    codec.push(frame(JSON.stringify({ jsonrpc: '2.0', method: 'exit' })))
    Assert.equal(exited, 0)
  })

  test('input-end-exits', () => {
    let exited: number | undefined
    const codec = new FrameCodec(
      new LspHandler(),
      () => { },
      (code: number) => (exited = code),
    )
    codec.end()
    Assert.equal(exited, 1)
  })
})
