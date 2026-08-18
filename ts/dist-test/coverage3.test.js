"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// Coverage round 5 (ADR-002): the last reachable lines, branches and
// functions in ts/src. Each case here exists because an investigation
// proved the path IS reachable — the ones that are not are marked in the
// source with a `node:coverage ignore` directive and a justification, and
// listed in docs/test-coverage.md.
//
// Language behaviour belongs in test/spec/*.tsv (ADR-001); what is left
// here is engine-internal: API-only guards, debug/inspect rendering,
// editor-facing formatting, and process plumbing.
const node_test_1 = require("node:test");
const Assert = __importStar(require("node:assert"));
const Fs = __importStar(require("node:fs"));
const Os = __importStar(require("node:os"));
const Path = __importStar(require("node:path"));
const aontu_1 = require("../dist/aontu");
const ctx_1 = require("../dist/ctx");
const err_1 = require("../dist/err");
const lang_1 = require("../dist/lang");
const site_1 = require("../dist/site");
const CloseFuncVal_1 = require("../dist/val/CloseFuncVal");
const CopyFuncVal_1 = require("../dist/val/CopyFuncVal");
const HideFuncVal_1 = require("../dist/val/HideFuncVal");
const MoveFuncVal_1 = require("../dist/val/MoveFuncVal");
const PrefFuncVal_1 = require("../dist/val/PrefFuncVal");
const TypeFuncVal_1 = require("../dist/val/TypeFuncVal");
const unify_1 = require("../dist/unify");
const cli_1 = require("../dist/cli");
const lsp_server_1 = require("../dist/lsp-server");
const lsp_1 = require("../dist/lsp");
const Val_1 = require("../dist/val/Val");
const top_1 = require("../dist/val/top");
const MapVal_1 = require("../dist/val/MapVal");
const ListVal_1 = require("../dist/val/ListVal");
const IntegerVal_1 = require("../dist/val/IntegerVal");
const NumberVal_1 = require("../dist/val/NumberVal");
const StringVal_1 = require("../dist/val/StringVal");
const ScalarVal_1 = require("../dist/val/ScalarVal");
const NilVal_1 = require("../dist/val/NilVal");
const RefVal_1 = require("../dist/val/RefVal");
const VarVal_1 = require("../dist/val/VarVal");
const ConjunctVal_1 = require("../dist/val/ConjunctVal");
const DisjunctVal_1 = require("../dist/val/DisjunctVal");
const PrefVal_1 = require("../dist/val/PrefVal");
const ExpectVal_1 = require("../dist/val/ExpectVal");
const FeatureVal_1 = require("../dist/val/FeatureVal");
const FuncBaseVal_1 = require("../dist/val/FuncBaseVal");
const PathFuncVal_1 = require("../dist/val/PathFuncVal");
const UpperFuncVal_1 = require("../dist/val/UpperFuncVal");
const LowerFuncVal_1 = require("../dist/val/LowerFuncVal");
const ConstraintVal_1 = require("../dist/val/ConstraintVal");
const Decimal_1 = require("../dist/val/Decimal");
const BigIntegerVal_1 = require("../dist/val/BigIntegerVal");
const BigDecimalVal_1 = require("../dist/val/BigDecimalVal");
const numcmp_1 = require("../dist/val/numcmp");
const numkind_1 = require("../dist/val/numkind");
const utility_1 = require("../dist/utility");
const A = () => new aontu_1.Aontu();
const CTX = () => new ctx_1.AontuContext({ root: new MapVal_1.MapVal({ peg: {} }) });
// Capture process output around an in-process CLI run.
function capture(fn) {
    const so = process.stdout.write;
    const se = process.stderr.write;
    let out = '';
    let err = '';
    process.stdout.write = (s) => ((out += s), true);
    process.stderr.write = (s) => ((err += s), true);
    try {
        fn();
    }
    finally {
        process.stdout.write = so;
        process.stderr.write = se;
        process.exitCode = 0;
    }
    return { out, err };
}
(0, node_test_1.describe)('coverage3-public-surface', () => {
    (0, node_test_1.test)('every-re-export-resolves', () => {
        // The package entry re-exports these from their own modules, which
        // tsc emits as property getters — reading each one here keeps the
        // public surface pinned without depending on which other test
        // happens to touch it.
        const api = require('../dist/aontu');
        for (const name of [
            'Aontu', 'AontuContext', 'AontuError', 'Lang',
            'runparse', 'util', 'formatExplain', 'exactJSON', 'Decimal',
            'VERSION',
        ]) {
            Assert.ok(null != api[name], 'missing export: ' + name);
        }
        Assert.equal('function', typeof api.default);
        Assert.match(api.VERSION, /^\d+\.\d+\.\d+/);
    });
});
(0, node_test_1.describe)('coverage3-refval', () => {
    (0, node_test_1.test)('null-peer-and-marks', () => {
        const root = new MapVal_1.MapVal({ peg: { a: new IntegerVal_1.IntegerVal({ peg: 1 }) } });
        const ctx = new ctx_1.AontuContext({ root });
        // The engine always passes a peer; the Val API allows omitting it.
        Assert.equal(new RefVal_1.RefVal({ peg: ['a'], absolute: true }).unify(undefined, ctx).canon, '1');
        // A ref carrying only a hide mark stamps it on the found value.
        const rh = new RefVal_1.RefVal({ peg: ['a'], absolute: true });
        rh.mark.hide = true;
        Assert.equal(rh.find(ctx).canon, '1');
    });
    (0, node_test_1.test)('cycle-proof-walk-arms', () => {
        // A proven cycle that descends through a list index.
        const ra = new RefVal_1.RefVal({ peg: ['b', '0'], absolute: true });
        const rb = new RefVal_1.RefVal({ peg: ['a'], absolute: true });
        const root = new MapVal_1.MapVal({
            peg: { a: ra, b: new ListVal_1.ListVal({ peg: [rb] }) },
        });
        Assert.equal(ra.detectRefCycle(new ctx_1.AontuContext({ root })), true);
        // A chase that meets a non-container mid-path proves nothing.
        const rc = new RefVal_1.RefVal({ peg: ['b', 'x'], absolute: true });
        const root2 = new MapVal_1.MapVal({
            peg: { a: rc, b: new StringVal_1.StringVal({ peg: 's' }) },
        });
        Assert.equal(rc.detectRefCycle(new ctx_1.AontuContext({ root: root2 })), false);
    });
    (0, node_test_1.test)('same-and-inspection', () => {
        const r = new RefVal_1.RefVal({ peg: ['a'], absolute: true });
        Assert.equal(r.same(undefined), false);
        Assert.equal(r.same(r), true);
        Assert.match(new RefVal_1.RefVal({ peg: ['a'], absolute: true, prefix: true }).inspect(), /absolute,prefix/);
        Assert.doesNotMatch(new RefVal_1.RefVal({ peg: ['a'] }).inspect(), /absolute|prefix/);
    });
});
(0, node_test_1.describe)('coverage3-val-base', () => {
    (0, node_test_1.test)('clone-with-explicit-undefined-mark', () => {
        const iv = new IntegerVal_1.IntegerVal({ peg: 1 });
        iv.mark.type = true;
        const out = iv.clone(CTX(), { mark: undefined });
        Assert.equal(out.mark.type, true);
        Assert.equal(out.canon, '1');
    });
    (0, node_test_1.test)('base-unify-is-identity', () => {
        // No concrete Val inherits Val.unify — every leaf overrides it — but
        // the base contract is that an unhandled Val stands.
        // `canon` is abstract on Val, so even a stand-in has to render
        // something; this one is never canoned.
        class PlainVal extends FeatureVal_1.FeatureVal {
            get canon() { return ''; }
        }
        const pv = new PlainVal({ peg: 1 });
        Assert.equal(pv.unify((0, top_1.top)(), CTX()), pv);
    });
    (0, node_test_1.test)('inspect-rendering-arms', () => {
        const iv = new IntegerVal_1.IntegerVal({ peg: 1 });
        Assert.doesNotMatch(iv.inspect(), /type|hide/);
        iv.mark.type = true;
        iv.mark.hide = true;
        Assert.match(iv.inspect(), /hide,type/);
        // peg undefined, and a null-prototype peg (what jsonic hands a MapVal)
        Assert.match((0, top_1.top)().inspect(), /\/>$/);
        Assert.match(new MapVal_1.MapVal({ peg: Object.create(null) }).inspect(), /\/>$/);
        Assert.match(new IntegerVal_1.IntegerVal({ peg: 1 }).inspect(), /1>$/);
        // array peg: Val entries render through inspect, raw entries verbatim
        const lv = new ListVal_1.ListVal({ peg: [new IntegerVal_1.IntegerVal({ peg: 1 }), 5] });
        const s = lv.inspect();
        Assert.match(s, /Integer/);
        Assert.match(s, /5/);
    });
});
(0, node_test_1.describe)('coverage3-constraint', () => {
    (0, node_test_1.test)('mixed-domain-exclusion-admits', () => {
        const ctx = CTX();
        const cv = new ConstraintVal_1.ConstraintVal({
            peg: [],
            state: { domain: 'number', neqs: [new StringVal_1.StringVal({ peg: 'a' })] },
        }, ctx);
        // A string exclusion cannot match a numeric peer, so the peer stands.
        Assert.equal(cv.unify(new IntegerVal_1.IntegerVal({ peg: 1 }), ctx).canon, '1');
    });
    (0, node_test_1.test)('constraint-without-args', () => {
        const ctx = CTX();
        const cv = new ConstraintVal_1.MinConstraintVal({}, ctx);
        Assert.equal(cv.invalid, 'arg');
        Assert.equal(cv.unify(new IntegerVal_1.IntegerVal({ peg: 1 }), ctx).isNil, true);
    });
    (0, node_test_1.test)('domain-adopted-from-peer', () => {
        const ctx = CTX();
        const c0 = new ConstraintVal_1.ConstraintVal({ peg: [], state: { neqs: [] } }, ctx);
        const c1 = new ConstraintVal_1.ConstraintVal({ peg: [new IntegerVal_1.IntegerVal({ peg: 1 })], atom: 'min' }, ctx);
        Assert.equal(c0.unify(c1, ctx).canon, 'min(1)');
    });
});
(0, node_test_1.describe)('coverage3-bags', () => {
    (0, node_test_1.test)('null-peer-arms', () => {
        const ctx = CTX();
        Assert.equal(new MapVal_1.MapVal({ peg: { a: new IntegerVal_1.IntegerVal({ peg: 1 }) } })
            .unify(undefined, ctx).canon, '{"a":1}');
        Assert.equal(new ListVal_1.ListVal({ peg: [new IntegerVal_1.IntegerVal({ peg: 1 })] }, ctx)
            .unify(undefined, ctx).canon, '[1]');
        Assert.equal(new ConjunctVal_1.ConjunctVal({
            peg: [new IntegerVal_1.IntegerVal({ peg: 1 }), new IntegerVal_1.IntegerVal({ peg: 1 })],
        }, ctx).unify(undefined, ctx).canon, '1');
        Assert.equal(new DisjunctVal_1.DisjunctVal({
            peg: [new IntegerVal_1.IntegerVal({ peg: 1 }), new IntegerVal_1.IntegerVal({ peg: 2 })],
        }, ctx).unify(undefined, ctx).canon, '1|2');
        Assert.equal(new PrefVal_1.PrefVal({ peg: new IntegerVal_1.IntegerVal({ peg: 1 }) }, ctx)
            .unify(undefined, ctx).canon, '*1');
    });
    (0, node_test_1.test)('nil-spread-drives-every-key', () => {
        const ctx = CTX();
        const lv = new ListVal_1.ListVal({ peg: [new IntegerVal_1.IntegerVal({ peg: 1 })] }, ctx);
        lv.spread.cj = new NilVal_1.NilVal({ why: 'test-nil-spread' });
        Assert.equal(lv.unify((0, top_1.top)(), ctx).peg[0].isNil, true);
    });
    (0, node_test_1.test)('raw-peg-canon-and-clone', () => {
        const ctx = CTX();
        Assert.equal(new MapVal_1.MapVal({ peg: { a: 5 } }).canon, '{"a":5}');
        Assert.equal(new MapVal_1.MapVal({ peg: { a: undefined } }).canon, '{"a":undefined}');
        Assert.deepEqual(new ListVal_1.ListVal({ peg: [1, 'x'] }, ctx).clone(ctx).peg, [1, 'x']);
    });
    (0, node_test_1.test)('optional-list-element-canon', () => {
        // A list canon carries no optional markers, even when the value is
        // built by hand with one recorded (issue #40): a key:value pair is
        // not a list element, so there is no optional element for a marker to
        // describe, and the Go port's ListVal.Canon has no arm for one.
        const lv = new ListVal_1.ListVal({ peg: [new IntegerVal_1.IntegerVal({ peg: 1 })] }, CTX());
        lv.optionalKeys.push('0');
        Assert.equal(lv.canon, '[1]');
    });
    (0, node_test_1.test)('func-no-arg-guards-via-api', () => {
        // Every built-in's missing-argument guard, reached the only way that
        // is left: through the programmatic API (issue #51).
        //
        // A wrong argument count is refused at PARSE now, so no source can
        // reach these guards -- but a caller constructing a func Val by hand
        // still can, and they are what keeps that a clean nil rather than a
        // TypeError on `undefined`. The value of the test is that surface,
        // not the counter: the guards became unreachable from source the
        // moment arity was checked, and deleting them would have moved the
        // failure from a refusal to a crash for anyone building Vals.
        const ctx = CTX();
        const cases = [
            ['close', new CloseFuncVal_1.CloseFuncVal({ peg: [] }), 'no_first_arg'],
            ['copy', new CopyFuncVal_1.CopyFuncVal({ peg: [] }), 'invalid-arg'],
            ['hide', new HideFuncVal_1.HideFuncVal({ peg: [] }), 'arg'],
            ['move', new MoveFuncVal_1.MoveFuncVal({ peg: [] }), 'arg'],
            ['pref', new PrefFuncVal_1.PrefFuncVal({ peg: [] }), 'arg'],
            ['type', new TypeFuncVal_1.TypeFuncVal({ peg: [] }), 'arg'],
        ];
        for (const [name, fv, why] of cases) {
            const out = fv.resolve(ctx, []);
            Assert.equal(out.isNil, true, name + ': expected a nil');
            Assert.equal(out.why, why, name + ': why');
        }
        // path() refuses its missing argument in prepare rather than
        // resolve, since it rewrites the argument before it is driven.
        const pf = new PathFuncVal_1.PathFuncVal({ peg: [] });
        const prepared = pf.prepare(ctx, []);
        Assert.equal(prepared[0].isNil, true);
        Assert.equal(prepared[0].why, 'invalid-arg');
    });
    (0, node_test_1.test)('map-inspection-spread', () => {
        const mv = new MapVal_1.MapVal({ peg: { a: new IntegerVal_1.IntegerVal({ peg: 1 }) } });
        mv.spread.cj = new IntegerVal_1.IntegerVal({ peg: 2 });
        Assert.match(mv.inspection(), /&:<Integer/);
        Assert.match(mv.inspect(), /&:<Integer/);
        Assert.equal(new MapVal_1.MapVal({ peg: {} }).inspection(), '');
    });
    (0, node_test_1.test)('conjunct-empty-spec-and-ref-fold', () => {
        const ctx = CTX();
        Assert.deepEqual(new ConjunctVal_1.ConjunctVal({}, ctx).peg, []);
        // A pref followed by an unresolvable ref keeps both terms in canon.
        const cj = new ConjunctVal_1.ConjunctVal({
            peg: [
                new PrefVal_1.PrefVal({ peg: new IntegerVal_1.IntegerVal({ peg: 1 }) }, ctx),
                new RefVal_1.RefVal({ peg: [new VarVal_1.VarVal({ peg: 'zz' }), 'q'], absolute: true }, ctx),
            ],
        }, ctx);
        Assert.equal(cj.unify((0, top_1.top)(), ctx).canon, '*1&$.$zz.q');
    });
    (0, node_test_1.test)('expect-explain-and-inspection', () => {
        const explain = [];
        const ctx = new ctx_1.AontuContext({ root: new MapVal_1.MapVal({ peg: {} }), explain });
        const e = new ExpectVal_1.ExpectVal({ peg: new IntegerVal_1.IntegerVal({ peg: 1 }) }, ctx);
        Assert.equal(e.unify(new IntegerVal_1.IntegerVal({ peg: 1 }), ctx).canon, '1');
        Assert.ok(0 < explain.length);
        const e2 = new ExpectVal_1.ExpectVal({ peg: new IntegerVal_1.IntegerVal({ peg: 2 }) });
        e2.parent = new MapVal_1.MapVal({ peg: {} });
        e2.key = 'a';
        Assert.ok(e2.inspection(0).includes('parent='));
    });
});
(0, node_test_1.describe)('coverage3-scalars', () => {
    (0, node_test_1.test)('nil-spec-arms', () => {
        const e1 = new Error('x');
        const n = new NilVal_1.NilVal({ why: 'w', err: [e1] });
        Assert.equal(n.err.length, 1);
        // A why-less nil classifies and generates as its gen-time code.
        const n2 = new NilVal_1.NilVal({});
        Assert.equal(n2.class, new NilVal_1.NilVal({ why: 'nil_gen' }).class);
        const ctx = new ctx_1.AontuContext({ root: new MapVal_1.MapVal({ peg: {} }), err: [] });
        Assert.equal(n2.gen(ctx), undefined);
        Assert.equal(n2.why, 'nil_gen');
    });
    (0, node_test_1.test)('scalar-against-top', () => {
        // Every leaf stands against TOP. The engine reaches these arms only
        // through whichever document happens to unify a bare leaf with top;
        // asserting them here keeps the ADR-002 gate independent of that.
        const ctx = CTX();
        const leaves = [
            new NumberVal_1.NumberVal({ peg: 1.5 }),
            new IntegerVal_1.IntegerVal({ peg: 1 }),
            new StringVal_1.StringVal({ peg: 's' }),
            new BigIntegerVal_1.BigIntegerVal({ peg: 5n }),
            new BigDecimalVal_1.BigDecimalVal({ peg: new Decimal_1.Decimal(15n, 1) }),
        ];
        for (const leaf of leaves) {
            Assert.equal(leaf.unify((0, top_1.top)(), ctx), leaf, leaf.canon);
        }
    });
    (0, node_test_1.test)('scalar-rendering-edges', () => {
        Assert.equal(new ScalarVal_1.ScalarVal({ peg: undefined }).canon, 'undefined');
        // -0 generates as +0, so JSON round-trips it.
        Assert.equal(Object.is(new NumberVal_1.NumberVal({ peg: -0 }).gen(undefined), 0), true);
    });
    (0, node_test_1.test)('decimal-compare-and-budget', () => {
        Assert.equal((0, Decimal_1.decimalOverBudget)(new Decimal_1.Decimal(-12345n, 2)), false);
        const a = new Decimal_1.Decimal(11n, 2);
        const b = new Decimal_1.Decimal(1n, 1);
        Assert.equal(a.compare(b), 1);
        Assert.equal(b.compare(a), -1);
        Assert.equal(a.compare(a), 0);
    });
    (0, node_test_1.test)('numcmp-arms', () => {
        const pi = (0, numcmp_1.scaledOfFloat)(Infinity);
        const ni = (0, numcmp_1.scaledOfFloat)(-Infinity);
        Assert.equal((0, numcmp_1.cmpScaled)(ni, pi), -1);
        Assert.equal((0, numcmp_1.cmpScaled)(pi, ni), 1);
        Assert.equal((0, numcmp_1.cmpScaled)(pi, pi), 0);
        // Code-point compare: surrogate pairs, then the prefix rule.
        Assert.equal((0, numcmp_1.cmpCodePoints)('\u{1F600}a', '\u{1F600}b'), -1);
        Assert.equal((0, numcmp_1.cmpCodePoints)('\u{1F600}b', '\u{1F600}a'), 1);
        Assert.equal((0, numcmp_1.cmpCodePoints)('ab', 'abc'), -1);
        Assert.equal((0, numcmp_1.cmpCodePoints)('abc', 'ab'), 1);
        // A negative non-integral floor rounds down, not toward zero.
        Assert.equal((0, numcmp_1.scaledFloor)((0, numcmp_1.scaledOfFloat)(-1.5)), -2n);
        Assert.equal((0, numcmp_1.scaledFloor)((0, numcmp_1.scaledOfFloat)(1.5)), 1n);
    });
    (0, node_test_1.test)('lossy-zero-coefficient', () => {
        // Zero at any exponent is zero, and zero is exact.
        Assert.equal((0, numkind_1.isLossyIntegerLiteral)(1e300, '0e500'), false);
    });
});
(0, node_test_1.describe)('coverage3-funcs', () => {
    (0, node_test_1.test)('feature-gen-collects', () => {
        const ctx = new ctx_1.AontuContext({ collect: true });
        Assert.equal(new FuncBaseVal_1.FuncBaseVal({ peg: [] }).gen(ctx), undefined);
        Assert.equal(ctx.err.length, 1);
        Assert.equal(ctx.err[0].why, 'no_gen');
    });
    (0, node_test_1.test)('validate-args-plural', () => {
        const f = new FuncBaseVal_1.FuncBaseVal({ peg: [] });
        Assert.throws(() => f.validateArgs([(0, top_1.top)(), (0, top_1.top)(), (0, top_1.top)()], 2), /needs at least 2 arguments/);
        Assert.throws(() => f.validateArgs([(0, top_1.top)(), (0, top_1.top)()], 1), /needs at least 1 argument\./);
    });
    (0, node_test_1.test)('path-func-argument-shapes', () => {
        const ctx = CTX();
        // No argument at all.
        Assert.equal(new PathFuncVal_1.PathFuncVal({ peg: [] }, ctx).resolve(ctx, []).isNil, true);
        // A scalar argument becomes a relative reference…
        const pfs = new PathFuncVal_1.PathFuncVal({ peg: [new StringVal_1.StringVal({ peg: 'a' })] }, ctx);
        const sargs = [new StringVal_1.StringVal({ peg: 'a' })];
        pfs.prepare(ctx, sargs);
        Assert.equal(sargs[0].isRef, true);
        // …while a container argument is refused outright.
        const pfm = new PathFuncVal_1.PathFuncVal({ peg: [new MapVal_1.MapVal({ peg: {} })] }, ctx);
        const margs = [new MapVal_1.MapVal({ peg: {} })];
        pfm.prepare(ctx, margs);
        Assert.equal(margs[0].isNil, true);
    });
    (0, node_test_1.test)('case-func-superior-is-top', () => {
        Assert.equal(new UpperFuncVal_1.UpperFuncVal({ peg: [] }).superior().isTop, true);
        Assert.equal(new LowerFuncVal_1.LowerFuncVal({ peg: [] }).superior().isTop, true);
    });
    (0, node_test_1.test)('func-names-render-in-canon', () => {
        // A parsed-but-unresolved func canonises through funcname().
        Assert.equal(A().parse('a: super(1)').canon, '{"a":super(1)}');
    });
});
(0, node_test_1.describe)('coverage3-explain', () => {
    // The explain trace threads through every Val family's unify; these
    // three carry `te`-guarded arms the other suites do not reach.
    (0, node_test_1.test)('exact-leaf-explain-arms', () => {
        const a0 = A();
        const ctx = a0.ctx();
        ctx.explain = [];
        const v = a0.unify('a:1.5&number b:0d1230&biginteger c:0d1.5&bigdecimal', undefined, ctx);
        Assert.equal(v.canon, '{"a":1.5,"b":0d1230,"c":0d1.5}');
        Assert.ok(0 < ctx.explain.length);
    });
    (0, node_test_1.test)('debug-mode-cycle-key', () => {
        // debug builds the human-readable seen key instead of the path index.
        const v = A().unify('a:1 b:$.a c:{d:*2|3}', { debug: true });
        Assert.equal(v.canon, '{"a":1,"b":1,"c":{"d":*2|3}}');
    });
});
(0, node_test_1.describe)('coverage3-context-and-errors', () => {
    (0, node_test_1.test)('context-options', () => {
        const ctx = new ctx_1.AontuContext({ explain: [], vc: 7, cc: 3 });
        Assert.deepEqual(ctx.explain, []);
        Assert.equal(ctx.vc, 7);
        Assert.equal(ctx.cc, 3);
        const d = new ctx_1.AontuContext({});
        Assert.equal(d.explain, null);
    });
    (0, node_test_1.test)('bad-source-refused', () => {
        Assert.throws(() => A().parse(123), (err) => err instanceof err_1.AontuError);
    });
    (0, node_test_1.test)('desc-err-over-a-list', () => {
        const ctx = new ctx_1.AontuContext({ src: 'a:1' });
        const n0 = (0, err_1.makeNilErr)(ctx, 'w0', new IntegerVal_1.IntegerVal({ peg: 1 }));
        const n1 = (0, err_1.makeNilErr)(ctx, 'w1', new IntegerVal_1.IntegerVal({ peg: 2 }));
        Assert.equal((0, err_1.descErr)([n0, n1], ctx).length, 2);
        Assert.match(n0.msg, /Cannot/);
        Assert.match(n1.msg, /Cannot/);
    });
    (0, node_test_1.test)('missing-source-file-frames', () => {
        const v = new IntegerVal_1.IntegerVal({ peg: 1 });
        v.site.url = '/no/such/aontu/file.aon';
        const n0 = (0, err_1.makeNilErr)(undefined, 'nosrc', v);
        (0, err_1.descErr)(n0, {});
        Assert.match(n0.msg, /SOURCE-NOT-FOUND: \/no\/such\/aontu\/file\.aon \(NO-FS\)/);
        const n1 = (0, err_1.makeNilErr)(undefined, 'nosrcfs', v);
        (0, err_1.descErr)(n1, { fs: Fs });
        Assert.match(n1.msg, /SOURCE-NOT-FOUND: \/no\/such\/aontu\/file\.aon/);
        Assert.doesNotMatch(n1.msg, /NO-FS/);
    });
    (0, node_test_1.test)('aontu-error-errs', () => {
        Assert.deepEqual(new err_1.AontuError('m0').errs(), []);
        const n = (0, err_1.makeNilErr)(undefined, 'why');
        Assert.equal(new err_1.AontuError('m1', [n]).errs()[0], n);
    });
    (0, node_test_1.test)('site-constructor', () => {
        Assert.equal(new site_1.Site().row, -1);
        Assert.equal(new site_1.Site().col, -1);
        Assert.equal(new site_1.Site().url, '');
        const s = new site_1.Site({ row: 2, col: 3, url: 'u' });
        Assert.equal(s.row, 2);
        Assert.equal(s.col, 3);
        Assert.equal(s.url, 'u');
        // Site is also re-exported from lang (the parser's own site type).
        Assert.equal(new lang_1.Site({ row: 4, col: 5, url: 'v' }).row, 4);
    });
    (0, node_test_1.test)('residue-path-fallback', () => {
        // A never-settling child at the root reports the budget with a bare
        // `$` path (no vpath to name).
        class Never extends Val_1.Val {
            constructor() {
                super(...arguments);
                this.n = 0;
            }
            unify(_peer, _ctx) { this.dc = this.dc + 1; this.n++; return this; }
            get canon() { return 'n' + this.n; }
            gen() { return null; }
            superior() { return (0, top_1.top)(); }
        }
        for (const path of [[], undefined]) {
            const child = new Never({ peg: 1 });
            child.path = path;
            const root = new MapVal_1.MapVal({ peg: { a: child } });
            const ctx = new ctx_1.AontuContext({ root, err: [] });
            new unify_1.Unify(root, new lang_1.Lang(), ctx, '');
            Assert.equal(ctx.err[0].why, 'budget_passes');
            Assert.equal(ctx.err[0].details.paths, '$');
        }
    });
});
(0, node_test_1.describe)('coverage3-explain-close', () => {
    (0, node_test_1.test)('close-without-a-result', () => {
        // A frame can close with no result (an abandoned trial) as well as
        // with one; only the latter records the outcome slot.
        const t = (0, utility_1.explainOpen)({ cc: 1, path: ['a'] }, undefined, 'Probe', new IntegerVal_1.IntegerVal({ peg: 1 }));
        const before = t.slice();
        (0, utility_1.explainClose)(t);
        Assert.deepEqual(t, before);
        (0, utility_1.explainClose)(t, new IntegerVal_1.IntegerVal({ peg: 2 }));
        Assert.ok(t.some((e) => 'string' === typeof e && /^-> \d+=2$/.test(e)));
        // An outcome that is NOT yet done is marked `!`, which is the whole
        // point of the slot when reading an explain trace: it distinguishes a
        // frame that settled from one still deferring. A scalar is always
        // done, so only an unresolved value reaches this arm.
        (0, utility_1.explainClose)(t, new RefVal_1.RefVal({ peg: ['zz'], absolute: true }));
        Assert.ok(t.some((e) => 'string' === typeof e && /^-> \d+!=/.test(e)));
        // A missing frame is a no-op (explain disabled).
        (0, utility_1.explainClose)(null);
    });
});
(0, node_test_1.describe)('coverage3-lang', () => {
    (0, node_test_1.test)('site-and-addsite', () => {
        const lang = new lang_1.Lang();
        Assert.equal(lang.jsonic('a:1').canon, '{"a":1}');
        // A duplicate key merges into a conjunct built without a site.
        const v = lang.parse('a:{x:1} a:{y:2}');
        Assert.equal(v.canon, '{"a":{"x":1}&{"y":2}}');
        Assert.equal(v.peg.a.site.row, -1);
    });
    (0, node_test_1.test)('optional-keys-of-every-token-kind', () => {
        const lang = new lang_1.Lang();
        Assert.equal(lang.parse('1?:2').canon, '{"1"?:2}');
        Assert.equal(lang.parse('a:{0x10?:2}').canon, '{"a":{"0x10"?:2}}');
        Assert.equal(lang.parse('a?:1').canon, '{"a"?:1}');
        Assert.equal(lang.parse('"k"?:1').canon, '{"k"?:1}');
    });
    (0, node_test_1.test)('resolver-mem-pkg-and-missing', () => {
        // `resolver` is read twice by the constructor: once as the resolver
        // CONFIG (mem/pkg), once as the resolver FUNCTION.
        let n = 0;
        const lang = new lang_1.Lang({
            get resolver() {
                return 0 === n++ ? { mem: { 'm0.aon': 'a:1' }, pkg: {} } : undefined;
            },
        });
        Assert.equal(lang.parse('x:@"m0.aon"').canon, '{"x":{"a":1}}');
        const pkg = new lang_1.Lang().parse('p:@"@tabnas/jsonic/package.json"');
        Assert.equal(pkg.peg.p.name, '@tabnas/jsonic');
        const none = new lang_1.Lang().parse('a:@');
        Assert.equal(none.canon, 'nil');
        Assert.match(none.err[0].msg, /source not found/);
        Assert.throws(() => new lang_1.Lang().parse('a:@1'));
    });
    (0, node_test_1.test)('raw-value-conversion', () => {
        const lang = new lang_1.Lang();
        // Forward slashes even on Windows: the path is embedded in aontu
        // SOURCE below, where a backslash is a string escape.
        const fixture = (name) => Path.join(__dirname, '..', 'test', name).split(Path.sep).join('/');
        const raw = fixture('raw.json');
        const rawfn = fixture('raw-fn.js');
        // An elided element is REFUSED, in an implicit top-level list as
        // anywhere else (issue #48). It canons as the nil it now is.
        Assert.equal(lang.parse('1,,2').canon, '[1,nil,2]');
        // A JSON include arrives as raw JS and is converted kind by kind.
        Assert.equal(lang.parse('1, @"' + raw + '"').canon, '[1,{"a":1,"b":"s","c":true,"d":[1,2],"e":null,"f":1.5}]');
        // A function export has no Val: parse_unknown.
        Assert.equal(lang.parse('1, @"' + rawfn + '"').canon, '[1,nil]');
        // An operator expression in an implicit top-level list is REDUCED,
        // not left as a raw op array: `k2.b` is the relative reference
        // `.k2.b`, which is what it canons as standalone too. Before
        // @tabnas/expr 0.5.4 this parsed as the nonsense list
        // [nil,"k2","b"] -- the op descriptor as a nil, its operands
        // trailing behind it -- and unify then produced that list as a
        // VALUE in Go while TypeScript raised no_path. Both now raise.
        Assert.equal(lang.parse('k2.b K:1').canon, '[.k2.b]');
    });
});
(0, node_test_1.describe)('coverage3-lsp', () => {
    (0, node_test_1.test)('shared-spread-template-walks', () => {
        // The same template Val is reachable twice (peg + spread.cj), so both
        // walks take their already-seen arm.
        Assert.deepEqual((0, lsp_1.computeDiagnostics)('a:{&:{x:1},b:{}}'), []);
        const h = (0, lsp_1.computeHover)('a:{&:{x:1},b:{}}', { line: 0, character: 8 });
        Assert.ok(h);
        Assert.match(h.contents.value, /\*integer\*/);
    });
    (0, node_test_1.test)('siteless-nil-through-vars', () => {
        class SitelessNil extends NilVal_1.NilVal {
            get site() { return undefined; }
            set site(_s) { }
        }
        const nil = new SitelessNil({ why: 'test_nil', msg: 'no-site' });
        const ds = (0, lsp_1.computeDiagnostics)('a:$v', { vars: { v: nil } });
        const hit = ds.filter((d) => 'test_nil' === d.code);
        Assert.equal(hit.length, 1);
        Assert.deepEqual(hit[0].range.start, { line: 0, character: 0 });
    });
    (0, node_test_1.test)('conflict-message-with-both-operands', () => {
        const ds = (0, lsp_1.computeDiagnostics)('a:{b:1&"s"} c:$.a');
        const plain = ds.filter((d) => d.message.startsWith('Cannot '));
        Assert.equal(plain.length, 1);
        Assert.equal(plain[0].message.split('\n')[0], 'Cannot unify value: "s" with value: 1');
    });
    (0, node_test_1.test)('parse-error-positions', () => {
        // A throw carrying 1-based line/col places the diagnostic there.
        const ds = (0, lsp_1.computeDiagnostics)('a:1', {
            vars: {
                get v() {
                    const err = new Error('boom-at-3-5');
                    err.line = 3;
                    err.col = 5;
                    throw err;
                },
            },
        });
        Assert.equal(ds.length, 1);
        Assert.deepEqual(ds[0].range.start, { line: 2, character: 4 });
        // A non-Error throw stringifies at the document start.
        const ds2 = (0, lsp_1.computeDiagnostics)('a:1', {
            vars: { get v() { throw 'boom-str'; } },
        });
        Assert.equal(ds2[0].message, 'boom-str');
        Assert.deepEqual(ds2[0].range.start, { line: 0, character: 0 });
    });
    (0, node_test_1.test)('hover-refuses-bad-input', () => {
        Assert.equal((0, lsp_1.computeHover)({ isVal: true }, { line: 0, character: 0 }), null);
        class ThrowCanon extends IntegerVal_1.IntegerVal {
            get canon() { throw new Error('canon-boom'); }
        }
        const v = new ThrowCanon({ peg: 1 });
        v.site = { row: 1, col: 1, url: '' };
        Assert.equal((0, lsp_1.computeHover)(v, { line: 0, character: 0 }), null);
    });
    (0, node_test_1.test)('hover-kind-labels', () => {
        const label = (src, ch) => {
            const h = (0, lsp_1.computeHover)(src, { line: 0, character: ch });
            Assert.ok(h, 'no hover for ' + src);
            return h.contents.value;
        };
        Assert.match(label('a:$.a', 2), /\*error\*/);
        // A REFERENCE that survives unification: a chain deeper than the
        // pass budget stalls unresolved without erroring. A cycle no longer
        // works here — with multi-error collection (G2 phase 6) the pass
        // loop continues past the erroring pass, and the cycle's members
        // absorb the one cycle nil rather than staying references.
        Assert.match(label('a:$.b b:$.c c:$.d d:$.e e:$.f f:$.g g:$.h h:$.i i:$.j j:$.k k:$.l l:1', 2), /\*reference\*/);
        Assert.match(label('n:1.5', 2), /\*float\*/);
        Assert.match(label('x:null|top', 2), /\*scalar\*/);
        Assert.match(label('x:top|top', 2), /\*top\*/);
    });
    (0, node_test_1.test)('publish-for-unopened-document', () => {
        // A uri that changes between the store and the publish leaves the
        // publish with no document text.
        const uris = ['file:///a.aontu', 'file:///a.aontu', 'file:///b.aontu'];
        let n = 0;
        const outs = new lsp_1.LspHandler().handle({
            method: 'textDocument/didOpen',
            params: {
                textDocument: {
                    get uri() { return uris[n++]; },
                    text: 'a:1 a:2',
                },
            },
        });
        Assert.equal(outs.length, 1);
        Assert.equal(outs[0].params.uri, 'file:///b.aontu');
        Assert.deepEqual(outs[0].params.diagnostics, []);
    });
});
(0, node_test_1.describe)('coverage3-process', () => {
    (0, node_test_1.test)('eval-source-error-shapes', () => {
        // evalSource never throws: it renders whatever came out of the
        // engine. The three shapes are an AontuError, a foreign object that
        // claims to be one (`aontu: true`, as a cross-realm error would),
        // and a throw with no message at all.
        const thrower = (err) => ({
            unify() { throw err; },
            generate() { throw err; },
        });
        const aerr = (0, cli_1.evalSource)(thrower(new err_1.AontuError('real-aontu')), 'a:1', 'json');
        Assert.deepEqual(aerr, { ok: false, text: 'real-aontu' });
        const foreign = (0, cli_1.evalSource)(thrower({ aontu: true, message: 'foreign-aontu' }), 'a:1', 'json');
        Assert.deepEqual(foreign, { ok: false, text: 'foreign-aontu' });
        const bare = (0, cli_1.evalSource)(thrower('just-a-string'), 'a:1', 'canon');
        Assert.deepEqual(bare, { ok: false, text: 'just-a-string' });
    });
    (0, node_test_1.test)('cli-version-without-a-version-field', () => {
        // A package.json with no version field falls back rather than
        // printing "undefined" (the read is patched, not the file).
        // require(), not the import namespace: the CJS module object is
        // mutable, and cli.js reads the property at call time.
        const fs = require('node:fs');
        const orig = fs.readFileSync;
        let r;
        try {
            fs.readFileSync = (fp, en) => (String(fp).endsWith('package.json') ? '{}' : orig(fp, en));
            r = capture(() => (0, cli_1.main)(['node', 'cli', '--version']));
        }
        finally {
            fs.readFileSync = orig;
        }
        Assert.equal(r.out.trim(), '0.0.0');
    });
    (0, node_test_1.test)('cli-file-error-path', () => {
        const dir = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'aontu-cov3-'));
        const file = Path.join(dir, 'bad.aontu');
        Fs.writeFileSync(file, 'a:1 a:2');
        const r = capture(() => (0, cli_1.main)(['node', 'cli', file]));
        Assert.equal(r.out, '');
        Assert.match(r.err, /Cannot unify value/);
    });
    (0, node_test_1.test)('lsp-server-default-streams', () => {
        // main() with no arguments uses the real stdout/exit defaults.
        const stdin = { on: () => stdin };
        const written = [];
        let exited;
        const so = process.stdout.write;
        const pe = process.exit;
        try {
            ;
            process.stdout.write = (c) => (written.push(Buffer.from(c)), true);
            process.exit = (code) => { exited = code; };
            const codec = (0, lsp_server_1.main)(stdin);
            const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'shutdown' });
            codec.push(Buffer.concat([
                Buffer.from('Content-Length: ' + Buffer.byteLength(body) + '\r\n\r\n', 'ascii'),
                Buffer.from(body, 'utf8'),
            ]));
            codec.end();
        }
        finally {
            process.stdout.write = so;
            process.exit = pe;
        }
        Assert.match(Buffer.concat(written).toString('utf8'), /Content-Length/);
        Assert.equal(exited, 0);
    });
});
//# sourceMappingURL=coverage3.test.js.map