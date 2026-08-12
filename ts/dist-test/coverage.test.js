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
// Coverage round 3: direct unit tests for internal paths no source
// input or shared spec row reaches — debug/inspect rendering, the
// explain-trace formatters, raw variable bindings, operator base
// machinery, and the CLI/LSP process plumbing (see
// docs/test-coverage.md).
const node_test_1 = require("node:test");
const Assert = __importStar(require("node:assert"));
const Util = __importStar(require("node:util"));
const Fs = __importStar(require("node:fs"));
const Os = __importStar(require("node:os"));
const Path = __importStar(require("node:path"));
const ctx_1 = require("../dist/ctx");
const err_1 = require("../dist/err");
const utility_1 = require("../dist/utility");
const Val_1 = require("../dist/val/Val");
const top_1 = require("../dist/val/top");
const MapVal_1 = require("../dist/val/MapVal");
const ListVal_1 = require("../dist/val/ListVal");
const IntegerVal_1 = require("../dist/val/IntegerVal");
const StringVal_1 = require("../dist/val/StringVal");
const VarVal_1 = require("../dist/val/VarVal");
const RefVal_1 = require("../dist/val/RefVal");
const ExpectVal_1 = require("../dist/val/ExpectVal");
const OpBaseVal_1 = require("../dist/val/OpBaseVal");
const cli_1 = require("../dist/cli");
const lsp_1 = require("../dist/lsp");
const lsp_server_1 = require("../dist/lsp-server");
function makeCtx(vars) {
    const ctx = new ctx_1.AontuContext({ root: new MapVal_1.MapVal({ peg: {} }) });
    if (vars) {
        for (const k in vars) {
            ctx.vars[k] = vars[k];
        }
    }
    return ctx;
}
(0, node_test_1.describe)('coverage-utility', () => {
    (0, node_test_1.test)('format-path', () => {
        Assert.equal((0, utility_1.formatPath)(['a', 'b']), '$.a.b');
        Assert.equal((0, utility_1.formatPath)(['a'], false), 'a');
        Assert.equal((0, utility_1.formatPath)([]), '');
        const v = new IntegerVal_1.IntegerVal({ peg: 1 });
        v.path = ['x', 'y'];
        Assert.equal((0, utility_1.formatPath)(v), '$.x.y');
    });
    (0, node_test_1.test)('walk-guards-and-arrays', () => {
        const m = new MapVal_1.MapVal({ peg: { k: new IntegerVal_1.IntegerVal({ peg: 1 }) } });
        const l = new ListVal_1.ListVal({ peg: [new IntegerVal_1.IntegerVal({ peg: 2 })] });
        // maxdepth 0: no descent, before still applies.
        let seen = [];
        (0, utility_1.walk)(m, (_k, v) => (seen.push(v.constructor.name), v), undefined, 0);
        Assert.deepEqual(seen, ['MapVal']);
        // maxdepth 1: children visited once, grandchildren pruned.
        const nested = new MapVal_1.MapVal({ peg: { a: m } });
        seen = [];
        (0, utility_1.walk)(nested, (_k, v) => (seen.push(v.constructor.name), v), undefined, 1);
        Assert.ok(seen.length >= 2);
        // Array peg descends by index, with an after hook.
        seen = [];
        (0, utility_1.walk)(l, undefined, (_k, v) => (seen.push(v.constructor.name), v));
        Assert.deepEqual(seen, ['IntegerVal', 'ListVal']);
    });
    (0, node_test_1.test)('explain-trace', () => {
        const ctx = { cc: 1, path: ['a'] };
        Assert.equal((0, utility_1.explainOpen)(ctx, false, 'skip'), null);
        const a = new IntegerVal_1.IntegerVal({ peg: 1 });
        const b = new IntegerVal_1.IntegerVal({ peg: 2 });
        const t = (0, utility_1.explainOpen)(ctx, undefined, 'Unify', a, b);
        Assert.ok(t[0].includes('1~Unify'));
        Assert.equal((0, utility_1.ec)(null, 'w'), undefined);
        const child = (0, utility_1.ec)(t, 'CHILD');
        Assert.ok(Array.isArray(child));
        (0, utility_1.explainClose)(null);
        (0, utility_1.explainClose)(t, a);
        const text = (0, utility_1.formatExplain)(t);
        Assert.ok(text.includes('Unify'));
        Assert.ok(text.includes('CHILD'));
        Assert.ok((0, utility_1.formatExplain)('leaf', 1).includes('leaf'));
    });
    (0, node_test_1.test)('items', () => {
        Assert.deepEqual((0, utility_1.items)([7]), [[0, 7]]);
        Assert.deepEqual((0, utility_1.items)({ a: 1 }), [['a', 1]]);
        Assert.deepEqual((0, utility_1.items)(null), []);
        Assert.deepEqual((0, utility_1.items)(3), []);
    });
});
(0, node_test_1.describe)('coverage-varval', () => {
    (0, node_test_1.test)('raw-bindings', () => {
        const cases = [
            ['hello', '"hello"'],
            [true, 'true'],
            [5, '5'],
            [1.5, '1.5'],
            [null, 'null'],
        ];
        for (const [bind, want] of cases) {
            const ctx = makeCtx({ v: bind });
            const out = new VarVal_1.VarVal({ peg: 'v' }, ctx).unify((0, top_1.top)(), ctx);
            Assert.equal(out.canon, want, 'binding ' + String(bind));
        }
    });
    (0, node_test_1.test)('invalid-kind-and-non-string-name', () => {
        const ctx = makeCtx({ o: { plain: 1 } });
        const bad = new VarVal_1.VarVal({ peg: 'o' }, ctx).unify((0, top_1.top)(), ctx);
        Assert.equal(bad.isNil, true);
        const numName = new VarVal_1.VarVal({ peg: new IntegerVal_1.IntegerVal({ peg: 1 }) }, ctx);
        Assert.equal(numName.unify((0, top_1.top)(), ctx).isNil, true);
    });
    (0, node_test_1.test)('ref-peg-goes-absolute', () => {
        const ctx = makeCtx();
        const rv = new RefVal_1.RefVal({ peg: ['a'] });
        const vv = new VarVal_1.VarVal({ peg: rv }, ctx);
        const out = vv.unify((0, top_1.top)(), ctx);
        Assert.equal(rv.absolute, true);
        Assert.equal(out.isNil, false);
    });
    (0, node_test_1.test)('peer-applies-to-value', () => {
        const ctx = makeCtx({ n: 5 });
        const out = new VarVal_1.VarVal({ peg: 'n' }, ctx)
            .unify(new IntegerVal_1.IntegerVal({ peg: 5 }), ctx);
        Assert.equal(out.canon, '5');
    });
    (0, node_test_1.test)('same-clone-gen', () => {
        const ctx = makeCtx();
        const v = new VarVal_1.VarVal({ peg: 'x' }, ctx);
        Assert.equal(v.same(null), false);
        Assert.equal(v.same(new VarVal_1.VarVal({ peg: 'x' }, ctx)), true);
        Assert.equal(v.clone(ctx).canon, '$x');
        Assert.equal(v.gen(ctx), undefined);
        Assert.ok(0 < ctx.err.length);
        Assert.throws(() => v.gen(), err_1.AontuError);
    });
});
(0, node_test_1.describe)('coverage-expectval', () => {
    (0, node_test_1.test)('second-peer-and-gen', () => {
        const ctx = makeCtx();
        const e = new ExpectVal_1.ExpectVal({ peg: new IntegerVal_1.IntegerVal({ peg: 1 }) }, ctx);
        const one = new IntegerVal_1.IntegerVal({ peg: 1 });
        const out1 = e.unify(one, ctx);
        Assert.equal(out1.canon, '1');
        // A second non-top peer unites with the stored peer.
        e.unify(new IntegerVal_1.IntegerVal({ peg: 1 }), ctx);
        Assert.equal(e.gen(ctx), undefined);
        Assert.ok(e.inspection(0).includes('key='));
    });
});
(0, node_test_1.describe)('coverage-opbase', () => {
    (0, node_test_1.test)('base-machinery', () => {
        const ctx = makeCtx();
        const peg = [new IntegerVal_1.IntegerVal({ peg: 1 })];
        const op = new OpBaseVal_1.OpBaseVal({ peg }, ctx);
        Assert.equal(op.opname(), 'op');
        Assert.equal(op.canon, 'op');
        Assert.equal(op.unify(op, ctx), op);
        Assert.equal(op.make(ctx, {}).isNil, true);
        Assert.equal(op.operate(ctx, []).isNil, true);
        Assert.equal(op.same(null), false);
        const opb = new OpBaseVal_1.OpBaseVal({ peg }, ctx);
        opb.peg = op.peg;
        Assert.equal(op.same(opb), true);
        Assert.equal(op.clone(ctx).canon, 'op');
    });
    (0, node_test_1.test)('primatize', () => {
        const ctx = makeCtx();
        const op = new OpBaseVal_1.OpBaseVal({ peg: [] }, ctx);
        Assert.equal(op.primatize('s'), 's');
        Assert.equal(op.primatize(null), null);
        Assert.equal(op.primatize(new IntegerVal_1.IntegerVal({ peg: 3 })), 3);
        Assert.equal(op.primatize({ toString: () => 'T' }), 'T');
        Assert.equal(op.primatize(Object.create(null)), undefined);
    });
    (0, node_test_1.test)('gen', () => {
        const ctx = makeCtx();
        const op = new OpBaseVal_1.OpBaseVal({ peg: [] }, ctx);
        Assert.equal(op.gen(ctx), undefined);
        Assert.ok(0 < ctx.err.length);
        Assert.throws(() => op.gen(), err_1.AontuError);
    });
});
(0, node_test_1.describe)('coverage-val-base', () => {
    (0, node_test_1.test)('ctx-errcanon-gen-notdone', () => {
        const ctx = makeCtx();
        const v = new MapVal_1.MapVal({ peg: {} }, ctx);
        Assert.equal(v.ctx(), ctx);
        Assert.equal(v.errcanon(), '');
        v.err = [new IntegerVal_1.IntegerVal({ peg: 1 })];
        Assert.equal(v.errcanon(), '<ERRS:1>');
        Assert.equal(Val_1.Val.prototype.gen.call(v, ctx), undefined);
        Assert.equal(Val_1.Val.prototype.inspection.call(v), '');
        const p = new IntegerVal_1.IntegerVal({ peg: 1 });
        const dc0 = p.dc;
        p.notdone();
        Assert.ok(p.dc === dc0 || p.dc === dc0 + 1);
    });
    (0, node_test_1.test)('inspect-rendering', () => {
        const m = new MapVal_1.MapVal({ peg: { x: new IntegerVal_1.IntegerVal({ peg: 1 }) } });
        const l = new ListVal_1.ListVal({ peg: [new StringVal_1.StringVal({ peg: 's' })] });
        const s = new IntegerVal_1.IntegerVal({ peg: 7 });
        Assert.ok(Util.inspect(m).includes('Map'));
        Assert.ok(m.inspect().includes('Integer'));
        Assert.ok(l.inspect().includes('String'));
        Assert.ok(s.inspect().includes('7'));
        // A Val-typed peg renders through the child's own inspect, and a
        // function peg renders by name.
        const e = new ExpectVal_1.ExpectVal({ peg: new IntegerVal_1.IntegerVal({ peg: 2 }) });
        Assert.ok(e.inspect().includes('Integer'));
        const fv = new IntegerVal_1.IntegerVal({ peg: 1 });
        fv.peg = function namedpeg() { };
        Assert.ok(fv.inspect().includes('namedpeg'));
    });
    (0, node_test_1.test)('empty', () => {
        Assert.equal((0, Val_1.empty)([]), true);
        Assert.equal((0, Val_1.empty)({}), true);
        Assert.equal((0, Val_1.empty)([1]), false);
        Assert.equal((0, Val_1.empty)(1), false);
        Assert.equal((0, Val_1.empty)(null), false);
    });
});
(0, node_test_1.describe)('coverage-cli-main', () => {
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
    (0, node_test_1.test)('help-version-badopt', () => {
        let r = capture(() => (0, cli_1.main)(['node', 'cli', '--help']));
        Assert.match(r.out, /Usage: aontu/);
        r = capture(() => (0, cli_1.main)(['node', 'cli', '-v']));
        Assert.match(r.out, /^\d+\.\d+\.\d+/);
        r = capture(() => (0, cli_1.main)(['node', 'cli', '--bogus']));
        Assert.match(r.err, /unknown option/);
    });
    (0, node_test_1.test)('file-modes', () => {
        const dir = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'aontu-cli-'));
        const file = Path.join(dir, 'm.aontu');
        Fs.writeFileSync(file, 'a:1 b:$.a');
        let r = capture(() => (0, cli_1.main)(['node', 'cli', file]));
        Assert.deepEqual(JSON.parse(r.out), { a: 1, b: 1 });
        r = capture(() => (0, cli_1.main)(['node', 'cli', '-c', file]));
        Assert.equal(r.out.trim(), '{"a":1,"b":1}');
        r = capture(() => (0, cli_1.main)(['node', 'cli', Path.join(dir, 'nope.aontu')]));
        Assert.match(r.err, /cannot read/);
    });
});
(0, node_test_1.describe)('coverage-lsp-server', () => {
    function frame(body) {
        return Buffer.concat([
            Buffer.from('Content-Length: ' + Buffer.byteLength(body) + '\r\n\r\n', 'ascii'),
            Buffer.from(body, 'utf8'),
        ]);
    }
    (0, node_test_1.test)('frame-codec-errors-and-exit', () => {
        const handler = new lsp_1.LspHandler();
        const written = [];
        let exited;
        const codec = new lsp_server_1.FrameCodec(handler, (c) => written.push(Buffer.from(c)), (code) => (exited = code));
        codec.push(Buffer.from('Garbage-Header: 1\r\n\r\n', 'ascii'));
        codec.push(frame('{'));
        codec.push(frame(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' })));
        Assert.ok(0 < written.length);
        codec.push(frame(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'shutdown' })));
        codec.push(frame(JSON.stringify({ jsonrpc: '2.0', method: 'exit' })));
        Assert.equal(exited, 0);
    });
    (0, node_test_1.test)('input-end-exits', () => {
        let exited;
        const codec = new lsp_server_1.FrameCodec(new lsp_1.LspHandler(), () => { }, (code) => (exited = code));
        codec.end();
        Assert.equal(exited, 1);
    });
});
(0, node_test_1.describe)('coverage-ctx-explain', () => {
    (0, node_test_1.test)('explain-threading', () => {
        const { Aontu } = require('../dist/aontu');
        const a0 = new Aontu();
        const ctx = a0.ctx();
        ctx.explain = [];
        ctx.vars.foo = 11;
        const src = 'a:1&integer b:1|*2 c:$.a d:{&:{x:integer},y:{x:1}} ' +
            'e:[1,2]&[1,2] f:upper("q") g:1+2 h:min(0)&2 i:$foo k:{m?:1}';
        const v = a0.unify(src, undefined, ctx);
        Assert.ok(!v.isNil);
        Assert.ok(0 < ctx.explain.length);
        Assert.ok(0 < (0, utility_1.formatExplain)(ctx.explain).length);
    });
    (0, node_test_1.test)('ctx-find-and-path-caches', () => {
        const root = new MapVal_1.MapVal({
            peg: { a: new ListVal_1.ListVal({ peg: [new IntegerVal_1.IntegerVal({ peg: 1 })] }) },
        });
        const ctx = new ctx_1.AontuContext({ root });
        Assert.equal(ctx.find(['a', '0']).canon, '1');
        Assert.equal(ctx.find(['a', '0', 'x']), undefined);
        Assert.equal(ctx.find(['zz']), undefined);
        ctx.path = ['p.q', 'r'];
        Assert.equal(ctx.pathstr, 'p\\.q.r');
        const i1 = ctx.pathidx;
        Assert.equal(ctx.pathidx, i1);
    });
});
//# sourceMappingURL=coverage.test.js.map