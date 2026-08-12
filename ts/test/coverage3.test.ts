/* Copyright (c) 2025 Richard Rodger, MIT License */

// Coverage round 5 (ADR-002): the last reachable lines, branches and
// functions in ts/src. Each case here exists because an investigation
// proved the path IS reachable — the ones that are not are marked in the
// source with a `node:coverage ignore` directive and a justification, and
// listed in docs/test-coverage.md.
//
// Language behaviour belongs in test/spec/*.tsv (ADR-001); what is left
// here is engine-internal: API-only guards, debug/inspect rendering,
// editor-facing formatting, and process plumbing.

import { describe, test } from 'node:test'
import * as Assert from 'node:assert'
import * as Fs from 'node:fs'
import * as Os from 'node:os'
import * as Path from 'node:path'

import { Aontu } from '../dist/aontu'
import { AontuContext } from '../dist/ctx'
import { AontuError, makeNilErr, descErr } from '../dist/err'
import { Lang, Site as LangSite } from '../dist/lang'
import { Site } from '../dist/site'
import { Unify } from '../dist/unify'
import { main as cliMain, evalSource } from '../dist/cli'
import { main as lspMain } from '../dist/lsp-server'
import { computeDiagnostics, computeHover, LspHandler } from '../dist/lsp'

import { Val } from '../dist/val/Val'
import { top } from '../dist/val/top'
import { MapVal } from '../dist/val/MapVal'
import { ListVal } from '../dist/val/ListVal'
import { IntegerVal } from '../dist/val/IntegerVal'
import { NumberVal } from '../dist/val/NumberVal'
import { StringVal } from '../dist/val/StringVal'
import { ScalarVal } from '../dist/val/ScalarVal'
import { NilVal } from '../dist/val/NilVal'
import { RefVal } from '../dist/val/RefVal'
import { VarVal } from '../dist/val/VarVal'
import { ConjunctVal } from '../dist/val/ConjunctVal'
import { DisjunctVal } from '../dist/val/DisjunctVal'
import { PrefVal } from '../dist/val/PrefVal'
import { ExpectVal } from '../dist/val/ExpectVal'
import { FeatureVal } from '../dist/val/FeatureVal'
import { FuncBaseVal } from '../dist/val/FuncBaseVal'
import { PathFuncVal } from '../dist/val/PathFuncVal'
import { UpperFuncVal } from '../dist/val/UpperFuncVal'
import { LowerFuncVal } from '../dist/val/LowerFuncVal'
import { ConstraintVal, MinConstraintVal } from '../dist/val/ConstraintVal'
import { Decimal, decimalOverBudget } from '../dist/val/Decimal'
import { BigIntegerVal } from '../dist/val/BigIntegerVal'
import { BigDecimalVal } from '../dist/val/BigDecimalVal'
import {
  scaledOfFloat, cmpScaled, cmpCodePoints, scaledFloor,
} from '../dist/val/numcmp'
import { isLossyIntegerLiteral } from '../dist/val/numkind'
import { explainOpen, explainClose } from '../dist/utility'


const A = () => new Aontu()
const CTX = () => new AontuContext({ root: new MapVal({ peg: {} }) })

// Capture process output around an in-process CLI run.
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


describe('coverage3-public-surface', () => {

  test('every-re-export-resolves', () => {
    // The package entry re-exports these from their own modules, which
    // tsc emits as property getters — reading each one here keeps the
    // public surface pinned without depending on which other test
    // happens to touch it.
    const api: any = require('../dist/aontu')
    for (const name of [
      'Aontu', 'AontuContext', 'AontuError', 'Lang',
      'runparse', 'util', 'formatExplain', 'exactJSON', 'Decimal',
      'VERSION',
    ]) {
      Assert.ok(null != api[name], 'missing export: ' + name)
    }
    Assert.equal('function', typeof api.default)
    Assert.match(api.VERSION, /^\d+\.\d+\.\d+/)
  })
})


describe('coverage3-refval', () => {

  test('null-peer-and-marks', () => {
    const root = new MapVal({ peg: { a: new IntegerVal({ peg: 1 }) } })
    const ctx = new AontuContext({ root })

    // The engine always passes a peer; the Val API allows omitting it.
    Assert.equal(
      new RefVal({ peg: ['a'], absolute: true }).unify(undefined as any, ctx).canon,
      '1')

    // A ref carrying only a hide mark stamps it on the found value.
    const rh: any = new RefVal({ peg: ['a'], absolute: true })
    rh.mark.hide = true
    Assert.equal(rh.find(ctx).canon, '1')
  })

  test('cycle-proof-walk-arms', () => {
    // A proven cycle that descends through a list index.
    const ra = new RefVal({ peg: ['b', '0'], absolute: true })
    const rb = new RefVal({ peg: ['a'], absolute: true })
    const root = new MapVal({
      peg: { a: ra, b: new ListVal({ peg: [rb] }) },
    })
    Assert.equal((ra as any).detectRefCycle(new AontuContext({ root })), true)

    // A chase that meets a non-container mid-path proves nothing.
    const rc = new RefVal({ peg: ['b', 'x'], absolute: true })
    const root2 = new MapVal({
      peg: { a: rc, b: new StringVal({ peg: 's' }) },
    })
    Assert.equal((rc as any).detectRefCycle(new AontuContext({ root: root2 })), false)
  })

  test('same-and-inspection', () => {
    const r = new RefVal({ peg: ['a'], absolute: true })
    Assert.equal(r.same(undefined as any), false)
    Assert.equal(r.same(r), true)

    Assert.match(new RefVal({ peg: ['a'], absolute: true, prefix: true }).inspect(),
      /absolute,prefix/)
    Assert.doesNotMatch(new RefVal({ peg: ['a'] }).inspect(), /absolute|prefix/)
  })
})


describe('coverage3-val-base', () => {

  test('clone-with-explicit-undefined-mark', () => {
    const iv = new IntegerVal({ peg: 1 })
    iv.mark.type = true
    const out = iv.clone(CTX(), { mark: undefined } as any)
    Assert.equal(out.mark.type, true)
    Assert.equal(out.canon, '1')
  })

  test('base-unify-is-identity', () => {
    // No concrete Val inherits Val.unify — every leaf overrides it — but
    // the base contract is that an unhandled Val stands.
    class PlainVal extends FeatureVal { }
    const pv = new PlainVal({ peg: 1 })
    Assert.equal(pv.unify(top(), CTX()), pv)
  })

  test('inspect-rendering-arms', () => {
    const iv = new IntegerVal({ peg: 1 })
    Assert.doesNotMatch(iv.inspect(), /type|hide/)
    iv.mark.type = true
    iv.mark.hide = true
    Assert.match(iv.inspect(), /hide,type/)

    // peg undefined, and a null-prototype peg (what jsonic hands a MapVal)
    Assert.match(top().inspect(), /\/>$/)
    Assert.match(new MapVal({ peg: Object.create(null) }).inspect(), /\/>$/)
    Assert.match(new IntegerVal({ peg: 1 }).inspect(), /1>$/)

    // array peg: Val entries render through inspect, raw entries verbatim
    const lv = new ListVal({ peg: [new IntegerVal({ peg: 1 }), 5] as any })
    const s = lv.inspect()
    Assert.match(s, /Integer/)
    Assert.match(s, /5/)
  })
})


describe('coverage3-constraint', () => {

  test('mixed-domain-exclusion-admits', () => {
    const ctx = CTX()
    const cv = new ConstraintVal({
      peg: [],
      state: { domain: 'number', neqs: [new StringVal({ peg: 'a' })] },
    } as any, ctx)
    // A string exclusion cannot match a numeric peer, so the peer stands.
    Assert.equal(cv.unify(new IntegerVal({ peg: 1 }), ctx).canon, '1')
  })

  test('constraint-without-args', () => {
    const ctx = CTX()
    const cv: any = new MinConstraintVal({} as any, ctx)
    Assert.equal(cv.invalid, 'arg')
    Assert.equal(cv.unify(new IntegerVal({ peg: 1 }), ctx).isNil, true)
  })

  test('domain-adopted-from-peer', () => {
    const ctx = CTX()
    const c0 = new ConstraintVal({ peg: [], state: { neqs: [] } } as any, ctx)
    const c1 = new ConstraintVal(
      { peg: [new IntegerVal({ peg: 1 })], atom: 'min' } as any, ctx)
    Assert.equal(c0.unify(c1, ctx).canon, 'min(1)')
  })
})


describe('coverage3-bags', () => {

  test('null-peer-arms', () => {
    const ctx = CTX()
    Assert.equal(
      new MapVal({ peg: { a: new IntegerVal({ peg: 1 }) } })
        .unify(undefined as any, ctx).canon,
      '{"a":1}')
    Assert.equal(
      new ListVal({ peg: [new IntegerVal({ peg: 1 })] }, ctx)
        .unify(undefined as any, ctx).canon,
      '[1]')
    Assert.equal(
      new ConjunctVal({
        peg: [new IntegerVal({ peg: 1 }), new IntegerVal({ peg: 1 })],
      }, ctx).unify(undefined as any, ctx).canon,
      '1')
    Assert.equal(
      new DisjunctVal({
        peg: [new IntegerVal({ peg: 1 }), new IntegerVal({ peg: 2 })],
      }, ctx).unify(undefined as any, ctx).canon,
      '1|2')
    Assert.equal(
      new PrefVal({ peg: new IntegerVal({ peg: 1 }) }, ctx)
        .unify(undefined as any, ctx).canon,
      '*1')
  })

  test('nil-spread-drives-every-key', () => {
    const ctx = CTX()
    const lv: any = new ListVal({ peg: [new IntegerVal({ peg: 1 })] }, ctx)
    lv.spread.cj = new NilVal({ why: 'test-nil-spread' })
    Assert.equal(lv.unify(top(), ctx).peg[0].isNil, true)
  })

  test('raw-peg-canon-and-clone', () => {
    const ctx = CTX()
    Assert.equal(new MapVal({ peg: { a: 5 } as any }).canon, '{"a":5}')
    Assert.equal(new MapVal({ peg: { a: undefined } as any }).canon, '{"a":undefined}')
    Assert.deepEqual(new ListVal({ peg: [1, 'x'] as any }, ctx).clone(ctx).peg, [1, 'x'])
  })

  test('optional-list-element-canon', () => {
    // TS-only: the Go port drops an optional list element from canon
    // rather than rendering it, so this cannot be a shared row yet
    // (divergence filed).
    const lv: any = new ListVal({ peg: [new IntegerVal({ peg: 1 })] }, CTX())
    lv.optionalKeys.push('0')
    Assert.equal(lv.canon, '[0?:1]')
  })

  test('map-inspection-spread', () => {
    const mv: any = new MapVal({ peg: { a: new IntegerVal({ peg: 1 }) } })
    mv.spread.cj = new IntegerVal({ peg: 2 })
    Assert.match(mv.inspection(), /&:<Integer/)
    Assert.match(mv.inspect(), /&:<Integer/)
    Assert.equal(new MapVal({ peg: {} }).inspection(), '')
  })

  test('conjunct-empty-spec-and-ref-fold', () => {
    const ctx = CTX()
    Assert.deepEqual(new ConjunctVal({} as any, ctx).peg, [])

    // A pref followed by an unresolvable ref keeps both terms in canon.
    const cj = new ConjunctVal({
      peg: [
        new PrefVal({ peg: new IntegerVal({ peg: 1 }) }, ctx),
        new RefVal({ peg: [new VarVal({ peg: 'zz' }), 'q'], absolute: true }, ctx),
      ],
    }, ctx)
    Assert.equal(cj.unify(top(), ctx).canon, '*1&$.$zz.q')
  })

  test('expect-explain-and-inspection', () => {
    const explain: any[] = []
    const ctx = new AontuContext({ root: new MapVal({ peg: {} }), explain })
    const e = new ExpectVal({ peg: new IntegerVal({ peg: 1 }) }, ctx)
    Assert.equal(e.unify(new IntegerVal({ peg: 1 }), ctx).canon, '1')
    Assert.ok(0 < explain.length)

    const e2: any = new ExpectVal({ peg: new IntegerVal({ peg: 2 }) })
    e2.parent = new MapVal({ peg: {} })
    e2.key = 'a'
    Assert.ok(e2.inspection(0).includes('parent='))
  })
})


describe('coverage3-scalars', () => {

  test('nil-spec-arms', () => {
    const e1 = new Error('x')
    const n = new NilVal({ why: 'w', err: [e1] } as any)
    Assert.equal(n.err.length, 1)

    // A why-less nil classifies and generates as its gen-time code.
    const n2 = new NilVal({} as any)
    Assert.equal(n2.class, new NilVal({ why: 'nil_gen' } as any).class)
    const ctx = new AontuContext({ root: new MapVal({ peg: {} }), err: [] })
    Assert.equal(n2.gen(ctx), undefined)
    Assert.equal(n2.why, 'nil_gen')
  })

  test('scalar-against-top', () => {
    // Every leaf stands against TOP. The engine reaches these arms only
    // through whichever document happens to unify a bare leaf with top;
    // asserting them here keeps the ADR-002 gate independent of that.
    const ctx = CTX()
    const leaves: any[] = [
      new NumberVal({ peg: 1.5 }),
      new IntegerVal({ peg: 1 }),
      new StringVal({ peg: 's' }),
      new BigIntegerVal({ peg: 5n }),
      new BigDecimalVal({ peg: new Decimal(15n, 1) }),
    ]
    for (const leaf of leaves) {
      Assert.equal(leaf.unify(top(), ctx), leaf, leaf.canon)
    }
  })

  test('scalar-rendering-edges', () => {
    Assert.equal(new ScalarVal({ peg: undefined } as any).canon, 'undefined')
    // -0 generates as +0, so JSON round-trips it.
    Assert.equal(Object.is(new NumberVal({ peg: -0 }).gen(undefined as any), 0), true)
  })

  test('decimal-compare-and-budget', () => {
    Assert.equal(decimalOverBudget(new Decimal(-12345n, 2)), false)
    const a = new Decimal(11n, 2)
    const b = new Decimal(1n, 1)
    Assert.equal(a.compare(b), 1)
    Assert.equal(b.compare(a), -1)
    Assert.equal(a.compare(a), 0)
  })

  test('numcmp-arms', () => {
    const pi = scaledOfFloat(Infinity)
    const ni = scaledOfFloat(-Infinity)
    Assert.equal(cmpScaled(ni, pi), -1)
    Assert.equal(cmpScaled(pi, ni), 1)
    Assert.equal(cmpScaled(pi, pi), 0)

    // Code-point compare: surrogate pairs, then the prefix rule.
    Assert.equal(cmpCodePoints('\u{1F600}a', '\u{1F600}b'), -1)
    Assert.equal(cmpCodePoints('\u{1F600}b', '\u{1F600}a'), 1)
    Assert.equal(cmpCodePoints('ab', 'abc'), -1)
    Assert.equal(cmpCodePoints('abc', 'ab'), 1)

    // A negative non-integral floor rounds down, not toward zero.
    Assert.equal(scaledFloor(scaledOfFloat(-1.5)), -2n)
    Assert.equal(scaledFloor(scaledOfFloat(1.5)), 1n)
  })

  test('lossy-zero-coefficient', () => {
    // Zero at any exponent is zero, and zero is exact.
    Assert.equal(isLossyIntegerLiteral(1e300, '0e500'), false)
  })
})


describe('coverage3-funcs', () => {

  test('feature-gen-collects', () => {
    const ctx = new AontuContext({ collect: true } as any)
    Assert.equal(new FuncBaseVal({ peg: [] }).gen(ctx), undefined)
    Assert.equal(ctx.err.length, 1)
    Assert.equal(ctx.err[0].why, 'no_gen')
  })

  test('validate-args-plural', () => {
    const f = new FuncBaseVal({ peg: [] })
    Assert.throws(() => f.validateArgs([top(), top(), top()], 2),
      /needs at least 2 arguments/)
    Assert.throws(() => f.validateArgs([top(), top()], 1),
      /needs at least 1 argument\./)
  })

  test('path-func-argument-shapes', () => {
    const ctx = CTX()

    // No argument at all.
    Assert.equal((new PathFuncVal({ peg: [] }, ctx) as any).resolve(ctx, []).isNil, true)

    // A scalar argument becomes a relative reference…
    const pfs: any = new PathFuncVal({ peg: [new StringVal({ peg: 'a' })] }, ctx)
    const sargs: any[] = [new StringVal({ peg: 'a' })]
    pfs.prepare(ctx, sargs)
    Assert.equal(sargs[0].isRef, true)

    // …while a container argument is refused outright.
    const pfm: any = new PathFuncVal({ peg: [new MapVal({ peg: {} })] }, ctx)
    const margs: any[] = [new MapVal({ peg: {} })]
    pfm.prepare(ctx, margs)
    Assert.equal(margs[0].isNil, true)
  })

  test('case-func-superior-is-top', () => {
    Assert.equal(new UpperFuncVal({ peg: [] }).superior().isTop, true)
    Assert.equal(new LowerFuncVal({ peg: [] }).superior().isTop, true)
  })

  test('func-names-render-in-canon', () => {
    // A parsed-but-unresolved func canonises through funcname().
    Assert.equal(A().parse('a: super(1)')!.canon, '{"a":super(1)}')
  })
})


describe('coverage3-explain', () => {

  // The explain trace threads through every Val family's unify; these
  // three carry `te`-guarded arms the other suites do not reach.
  test('exact-leaf-explain-arms', () => {
    const a0 = A()
    const ctx = a0.ctx()
    ctx.explain = []
    const v = a0.unify('a:1.5&number b:0d1230&biginteger c:0d1.5&bigdecimal',
      undefined, ctx)
    Assert.equal(v.canon, '{"a":1.5,"b":0d1230,"c":0d1.5}')
    Assert.ok(0 < (ctx.explain as any[]).length)
  })

  test('debug-mode-cycle-key', () => {
    // debug builds the human-readable seen key instead of the path index.
    const v = A().unify('a:1 b:$.a c:{d:*2|3}', { debug: true } as any)
    Assert.equal(v.canon, '{"a":1,"b":1,"c":{"d":*2|3}}')
  })
})


describe('coverage3-context-and-errors', () => {

  test('context-options', () => {
    const ctx = new AontuContext({ explain: [], vc: 7, cc: 3 } as any)
    Assert.deepEqual(ctx.explain, [])
    Assert.equal(ctx.vc, 7)
    Assert.equal(ctx.cc, 3)
    const d = new AontuContext({} as any)
    Assert.equal(d.explain, null)
  })

  test('bad-source-refused', () => {
    Assert.throws(() => A().parse(123 as any), (err: any) => err instanceof AontuError)
  })

  test('desc-err-over-a-list', () => {
    const ctx = new AontuContext({ src: 'a:1' } as any)
    const n0 = makeNilErr(ctx, 'w0', new IntegerVal({ peg: 1 }))
    const n1 = makeNilErr(ctx, 'w1', new IntegerVal({ peg: 2 }))
    Assert.equal(descErr([n0, n1] as any, ctx).length, 2)
    Assert.match(n0.msg, /Cannot/)
    Assert.match(n1.msg, /Cannot/)
  })

  test('missing-source-file-frames', () => {
    const v = new IntegerVal({ peg: 1 })
    v.site.url = '/no/such/aontu/file.aon'

    const n0 = makeNilErr(undefined as any, 'nosrc', v)
    descErr(n0, {} as any)
    Assert.match(n0.msg, /SOURCE-NOT-FOUND: \/no\/such\/aontu\/file\.aon \(NO-FS\)/)

    const n1 = makeNilErr(undefined as any, 'nosrcfs', v)
    descErr(n1, { fs: Fs } as any)
    Assert.match(n1.msg, /SOURCE-NOT-FOUND: \/no\/such\/aontu\/file\.aon/)
    Assert.doesNotMatch(n1.msg, /NO-FS/)
  })

  test('aontu-error-errs', () => {
    Assert.deepEqual(new AontuError('m0').errs(), [])
    const n = makeNilErr(undefined as any, 'why')
    Assert.equal(new AontuError('m1', [n] as any).errs()[0], n)
  })

  test('site-constructor', () => {
    Assert.equal(new Site().row, -1)
    Assert.equal(new Site().col, -1)
    Assert.equal(new Site().url, '')
    const s = new Site({ row: 2, col: 3, url: 'u' } as any)
    Assert.equal(s.row, 2)
    Assert.equal(s.col, 3)
    Assert.equal(s.url, 'u')

    // Site is also re-exported from lang (the parser's own site type).
    Assert.equal(new LangSite({ row: 4, col: 5, url: 'v' } as any).row, 4)
  })

  test('residue-path-fallback', () => {
    // A never-settling child at the root reports the budget with a bare
    // `$` path (no vpath to name).
    class Never extends Val {
      n = 0
      unify(_peer: any, _ctx: any): any { this.dc = this.dc + 1; this.n++; return this }
      get canon() { return 'n' + this.n }
      gen() { return null }
      superior() { return top() }
    }
    for (const path of [[] as string[], undefined]) {
      const child: any = new Never({ peg: 1 } as any)
      child.path = path
      const root = new MapVal({ peg: { a: child } })
      const ctx = new AontuContext({ root, err: [] } as any)
      new Unify(root, new Lang(), ctx, '')
      Assert.equal(ctx.err[0].why, 'budget_passes')
      Assert.equal(ctx.err[0].details.paths, '$')
    }
  })
})


describe('coverage3-explain-close', () => {

  test('close-without-a-result', () => {
    // A frame can close with no result (an abandoned trial) as well as
    // with one; only the latter records the outcome slot.
    const t: any = explainOpen({ cc: 1, path: ['a'] }, undefined, 'Probe',
      new IntegerVal({ peg: 1 }))
    const before = t.slice()

    explainClose(t)
    Assert.deepEqual(t, before)

    explainClose(t, new IntegerVal({ peg: 2 }))
    Assert.ok(t.some((e: any) =>
      'string' === typeof e && /^-> \d+=2$/.test(e)))

    // A missing frame is a no-op (explain disabled).
    explainClose(null)
  })
})


describe('coverage3-lang', () => {

  test('site-and-addsite', () => {
    const lang = new Lang()
    Assert.equal(lang.jsonic('a:1').canon, '{"a":1}')

    // A duplicate key merges into a conjunct built without a site.
    const v: any = lang.parse('a:{x:1} a:{y:2}')
    Assert.equal(v.canon, '{"a":{"x":1}&{"y":2}}')
    Assert.equal(v.peg.a.site.row, -1)
  })

  test('optional-keys-of-every-token-kind', () => {
    const lang = new Lang()
    Assert.equal(lang.parse('1?:2').canon, '{"1"?:2}')
    Assert.equal(lang.parse('a:{0x10?:2}').canon, '{"a":{"0x10"?:2}}')
    Assert.equal(lang.parse('a?:1').canon, '{"a"?:1}')
    Assert.equal(lang.parse('"k"?:1').canon, '{"k"?:1}')
  })

  test('resolver-mem-pkg-and-missing', () => {
    // `resolver` is read twice by the constructor: once as the resolver
    // CONFIG (mem/pkg), once as the resolver FUNCTION.
    let n = 0
    const lang = new Lang({
      get resolver() {
        return 0 === n++ ? { mem: { 'm0.aon': 'a:1' }, pkg: {} } : undefined
      },
    } as any)
    Assert.equal(lang.parse('x:@"m0.aon"').canon, '{"x":{"a":1}}')

    const pkg: any = new Lang().parse('p:@"@tabnas/jsonic/package.json"')
    Assert.equal(pkg.peg.p.name, '@tabnas/jsonic')

    const none: any = new Lang().parse('a:@')
    Assert.equal(none.canon, 'nil')
    Assert.match(none.err[0].msg, /source not found/)

    Assert.throws(() => new Lang().parse('a:@1'))
  })

  test('raw-value-conversion', () => {
    const lang = new Lang()
    // Forward slashes even on Windows: the path is embedded in aontu
    // SOURCE below, where a backslash is a string escape.
    const fixture = (name: string) =>
      Path.join(__dirname, '..', 'test', name).split(Path.sep).join('/')
    const raw = fixture('raw.json')
    const rawfn = fixture('raw-fn.js')

    // An elided element in an implicit top-level list is null.
    Assert.equal(lang.parse('1,,2').canon, '[1,null,2]')

    // A JSON include arrives as raw JS and is converted kind by kind.
    Assert.equal(lang.parse('1, @"' + raw + '"').canon,
      '[1,{"a":1,"b":"s","c":true,"d":[1,2],"e":null,"f":1.5}]')

    // A function export has no Val: parse_unknown.
    Assert.equal(lang.parse('1, @"' + rawfn + '"').canon, '[1,nil]')

    // An unfilled operator slot in a raw list stays nil.
    Assert.equal(lang.parse('k2.b K:1').canon, '[[nil,"k2","b"]]')
  })
})


describe('coverage3-lsp', () => {

  test('shared-spread-template-walks', () => {
    // The same template Val is reachable twice (peg + spread.cj), so both
    // walks take their already-seen arm.
    Assert.deepEqual(computeDiagnostics('a:{&:{x:1},b:{}}'), [])
    const h: any = computeHover('a:{&:{x:1},b:{}}', { line: 0, character: 8 })
    Assert.ok(h)
    Assert.match(h.contents.value, /\*integer\*/)
  })

  test('siteless-nil-through-vars', () => {
    class SitelessNil extends NilVal {
      get site(): any { return undefined }
      set site(_s: any) { }
    }
    const nil = new SitelessNil({ why: 'test_nil', msg: 'no-site' } as any)
    const ds = computeDiagnostics('a:$v', { vars: { v: nil } } as any)
    const hit = ds.filter((d: any) => 'test_nil' === d.code)
    Assert.equal(hit.length, 1)
    Assert.deepEqual(hit[0].range.start, { line: 0, character: 0 })
  })

  test('conflict-message-with-both-operands', () => {
    const ds = computeDiagnostics('a:{b:1&"s"} c:$.a')
    const plain = ds.filter((d: any) => d.message.startsWith('Cannot '))
    Assert.equal(plain.length, 1)
    Assert.equal(plain[0].message.split('\n')[0],
      'Cannot unify value: "s" with value: 1')
  })

  test('parse-error-positions', () => {
    // A throw carrying 1-based line/col places the diagnostic there.
    const ds = computeDiagnostics('a:1', {
      vars: {
        get v(): any {
          const err: any = new Error('boom-at-3-5')
          err.line = 3
          err.col = 5
          throw err
        },
      },
    } as any)
    Assert.equal(ds.length, 1)
    Assert.deepEqual(ds[0].range.start, { line: 2, character: 4 })

    // A non-Error throw stringifies at the document start.
    const ds2 = computeDiagnostics('a:1', {
      vars: { get v(): any { throw 'boom-str' } },
    } as any)
    Assert.equal(ds2[0].message, 'boom-str')
    Assert.deepEqual(ds2[0].range.start, { line: 0, character: 0 })
  })

  test('hover-refuses-bad-input', () => {
    Assert.equal(computeHover({ isVal: true } as any, { line: 0, character: 0 }), null)

    class ThrowCanon extends IntegerVal {
      get canon(): string { throw new Error('canon-boom') }
    }
    const v: any = new ThrowCanon({ peg: 1 })
    v.site = { row: 1, col: 1, url: '' }
    Assert.equal(computeHover(v, { line: 0, character: 0 }), null)
  })

  test('hover-kind-labels', () => {
    const label = (src: string, ch: number) => {
      const h: any = computeHover(src, { line: 0, character: ch })
      Assert.ok(h, 'no hover for ' + src)
      return h.contents.value
    }
    Assert.match(label('a:$.a', 2), /\*error\*/)
    Assert.match(label('a:$.b b:$.c c:$.a', 8), /\*reference\*/)
    Assert.match(label('n:1.5', 2), /\*float\*/)
    Assert.match(label('x:null|top', 2), /\*scalar\*/)
    Assert.match(label('x:top|top', 2), /\*top\*/)
  })

  test('publish-for-unopened-document', () => {
    // A uri that changes between the store and the publish leaves the
    // publish with no document text.
    const uris = ['file:///a.aontu', 'file:///a.aontu', 'file:///b.aontu']
    let n = 0
    const outs = new LspHandler().handle({
      method: 'textDocument/didOpen',
      params: {
        textDocument: {
          get uri() { return uris[n++] },
          text: 'a:1 a:2',
        },
      },
    } as any)
    Assert.equal(outs.length, 1)
    Assert.equal((outs[0].params as any).uri, 'file:///b.aontu')
    Assert.deepEqual((outs[0].params as any).diagnostics, [])
  })
})


describe('coverage3-process', () => {

  test('eval-source-error-shapes', () => {
    // evalSource never throws: it renders whatever came out of the
    // engine. The three shapes are an AontuError, a foreign object that
    // claims to be one (`aontu: true`, as a cross-realm error would),
    // and a throw with no message at all.
    const thrower = (err: any) => ({
      unify() { throw err },
      generate() { throw err },
    }) as any

    const aerr = evalSource(thrower(new AontuError('real-aontu')), 'a:1', 'json')
    Assert.deepEqual(aerr, { ok: false, text: 'real-aontu' })

    const foreign = evalSource(
      thrower({ aontu: true, message: 'foreign-aontu' }), 'a:1', 'json')
    Assert.deepEqual(foreign, { ok: false, text: 'foreign-aontu' })

    const bare = evalSource(thrower('just-a-string'), 'a:1', 'canon')
    Assert.deepEqual(bare, { ok: false, text: 'just-a-string' })
  })

  test('cli-version-without-a-version-field', () => {
    // A package.json with no version field falls back rather than
    // printing "undefined" (the read is patched, not the file).
    // require(), not the import namespace: the CJS module object is
    // mutable, and cli.js reads the property at call time.
    const fs = require('node:fs')
    const orig = fs.readFileSync
    let r: { out: string; err: string }
    try {
      fs.readFileSync = (fp: any, en: any) =>
        (String(fp).endsWith('package.json') ? '{}' : orig(fp, en))
      r = capture(() => cliMain(['node', 'cli', '--version']))
    }
    finally {
      fs.readFileSync = orig
    }
    Assert.equal(r.out.trim(), '0.0.0')
  })

  test('cli-file-error-path', () => {
    const dir = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'aontu-cov3-'))
    const file = Path.join(dir, 'bad.aontu')
    Fs.writeFileSync(file, 'a:1 a:2')
    const r = capture(() => cliMain(['node', 'cli', file]))
    Assert.equal(r.out, '')
    Assert.match(r.err, /Cannot unify value/)
  })

  test('lsp-server-default-streams', () => {
    // main() with no arguments uses the real stdout/exit defaults.
    const stdin: any = { on: () => stdin }
    const written: Buffer[] = []
    let exited: number | undefined
    const so = process.stdout.write
    const pe = process.exit
    try {
      ;(process.stdout as any).write = (c: any) => (written.push(Buffer.from(c)), true)
      ;(process as any).exit = (code: number) => { exited = code }
      const codec = lspMain(stdin)
      const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'shutdown' })
      codec.push(Buffer.concat([
        Buffer.from('Content-Length: ' + Buffer.byteLength(body) + '\r\n\r\n', 'ascii'),
        Buffer.from(body, 'utf8'),
      ]))
      codec.end()
    }
    finally {
      process.stdout.write = so
      ;(process as any).exit = pe
    }
    Assert.match(Buffer.concat(written).toString('utf8'), /Content-Length/)
    Assert.equal(exited, 0)
  })
})
