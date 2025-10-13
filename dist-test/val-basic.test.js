"use strict";
/* Copyright (c) 2020-2025 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const lang_1 = require("../dist/lang");
const unify_1 = require("../dist/unify");
const code_1 = require("@hapi/code");
const unify_2 = require("../dist/unify");
const ConjunctVal_1 = require("../dist/val/ConjunctVal");
const DisjunctVal_1 = require("../dist/val/DisjunctVal");
const ListVal_1 = require("../dist/val/ListVal");
const MapVal_1 = require("../dist/val/MapVal");
const Nil_1 = require("../dist/val/Nil");
const PrefVal_1 = require("../dist/val/PrefVal");
const RefVal_1 = require("../dist/val/RefVal");
const VarVal_1 = require("../dist/val/VarVal");
const val_1 = require("../dist/val");
const lang = new lang_1.Lang();
const PL = lang.parse.bind(lang);
const P = (x, ctx) => PL(x, ctx);
const PA = (x, ctx) => x.map(s => PL(s, ctx));
// const D = (x: any) => console.dir(x, { depth: null })
const UC = (s, r) => (r = P(s)).unify(val_1.TOP, makeCtx(r))?.canon;
const G = (x, ctx) => new unify_1.Unify(x, undefined, ctx).res.gen(ctx);
const makeSK_String = () => new val_1.ScalarKindVal({ peg: String });
const makeSK_Number = () => new val_1.ScalarKindVal({ peg: Number });
const makeSK_Integer = () => new val_1.ScalarKindVal({ peg: val_1.Integer });
const makeSK_Boolean = () => new val_1.ScalarKindVal({ peg: Boolean });
const makeBooleanVal = (v) => new val_1.BooleanVal({ peg: v });
const makeNumberVal = (v, c) => new val_1.NumberVal({ peg: v }, c);
const makeIntegerVal = (v, c) => new val_1.IntegerVal({ peg: v }, c);
(0, node_test_1.describe)('val-basic', function () {
    (0, node_test_1.beforeEach)(() => {
        global.console = require('console');
    });
    (0, node_test_1.it)('canon', () => {
        (0, code_1.expect)(P('1').canon).equal('1');
        (0, code_1.expect)(P('"a"').canon).equal('"a"');
        (0, code_1.expect)(P('b').canon).equal('"b"');
        (0, code_1.expect)(P('true').canon).equal('true');
        (0, code_1.expect)(P('top').canon).equal('top');
        (0, code_1.expect)(P('nil').canon).match(/^nil/);
        (0, code_1.expect)(P('a:1').canon).equal('{"a":1}');
        (0, code_1.expect)(P('a:1,b:nil').canon).match(/^\{"a":1,"b":nil/);
        (0, code_1.expect)(P('a:1,b:c:2').canon).equal('{"a":1,"b":{"c":2}}');
    });
    (0, node_test_1.it)('gen', () => {
        let ctx = makeCtx();
        (0, code_1.expect)(P('1').gen()).equal(1);
        (0, code_1.expect)(P('"a"').gen()).equal('a');
        (0, code_1.expect)(P('b').gen()).equal('b');
        (0, code_1.expect)(P('true').gen()).equal(true);
        (0, code_1.expect)(P('top').gen()).equal(undefined);
        (0, code_1.expect)(P('a:1').gen()).equal({ a: 1 });
        (0, code_1.expect)(P('a:1,b:c:2').gen()).equal({ a: 1, b: { c: 2 } });
        (0, code_1.expect)(P('nil').gen(ctx)).equal(undefined);
        (0, code_1.expect)(P('a:1,b:nil').gen(ctx)).equal({ a: 1, b: undefined });
    });
    (0, node_test_1.it)('scalar-kind', () => {
        (0, code_1.expect)(makeSK_String().same(makeSK_String())).equal(true);
        (0, code_1.expect)(makeSK_Number().same(makeSK_Number())).equal(true);
        (0, code_1.expect)(makeSK_Boolean().same(makeSK_Boolean())).equal(true);
        (0, code_1.expect)(makeSK_Integer().same(makeSK_Integer())).equal(true);
        (0, code_1.expect)(makeSK_String().same(makeSK_Number())).equal(false);
        (0, code_1.expect)(makeSK_String().same(makeSK_Boolean())).equal(false);
        (0, code_1.expect)(makeSK_String().same(makeSK_Integer())).equal(false);
        (0, code_1.expect)(makeSK_Number().same(makeSK_Boolean())).equal(false);
        (0, code_1.expect)(makeSK_Number().same(makeSK_Integer())).equal(false);
        (0, code_1.expect)(makeSK_Integer().same(makeSK_Boolean())).equal(false);
    });
    (0, node_test_1.it)('boolean', () => {
        let tu = (ctx, a, b) => (0, unify_2.unite)(ctx, a, b, 'boolean-test');
        let ctx = makeCtx();
        let bt = new val_1.BooleanVal({ peg: true }, ctx);
        let bf = new val_1.BooleanVal({ peg: false }, ctx);
        (0, code_1.expect)(tu(ctx, bt, bt)).equal(bt);
        (0, code_1.expect)(tu(ctx, bf, bf)).equal(bf);
        (0, code_1.expect)(tu(ctx, bt, bf) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, bf, bt) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, bt, val_1.TOP)).equal(bt);
        (0, code_1.expect)(tu(ctx, bf, val_1.TOP)).equal(bf);
        (0, code_1.expect)(tu(ctx, val_1.TOP, bt)).equal(bt);
        (0, code_1.expect)(tu(ctx, val_1.TOP, bf)).equal(bf);
        let b0 = new Nil_1.Nil('test');
        (0, code_1.expect)(tu(ctx, bt, b0)).equal(b0);
        (0, code_1.expect)(tu(ctx, bf, b0)).equal(b0);
        (0, code_1.expect)(tu(ctx, b0, bt)).equal(b0);
        (0, code_1.expect)(tu(ctx, b0, bf)).equal(b0);
        let bs = makeSK_Boolean();
        (0, code_1.expect)(tu(ctx, bt, bs)).equal(bt);
        (0, code_1.expect)(tu(ctx, bs, bt)).equal(bt);
        let n0 = makeNumberVal(1);
        (0, code_1.expect)(tu(ctx, bt, n0) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, bf, n0) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, n0, bt) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, n0, bf) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(bt.same(bt)).equal(true);
        (0, code_1.expect)(bf.same(bf)).equal(true);
        (0, code_1.expect)(bt.same(bf)).equal(false);
        (0, code_1.expect)(makeBooleanVal(true).same(makeBooleanVal(true))).equal(true);
        (0, code_1.expect)(makeBooleanVal(false).same(makeBooleanVal(false))).equal(true);
        (0, code_1.expect)(makeBooleanVal(true).same(makeBooleanVal(false))).equal(false);
    });
    (0, node_test_1.it)('string', () => {
        let ou = unify_2.unite;
        let tu = (ctx, a, b) => ou(ctx, a, b, 'string-test');
        let ctx = makeCtx();
        let s0 = new val_1.StringVal({ peg: 's0' });
        let s1 = new val_1.StringVal({ peg: 's1' });
        (0, code_1.expect)(tu(ctx, s0, s0)).equal(s0);
        (0, code_1.expect)(tu(ctx, s1, s1)).equal(s1);
        (0, code_1.expect)(tu(ctx, s0, s1) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, s1, s0) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, s0, val_1.TOP)).equal(s0);
        (0, code_1.expect)(tu(ctx, s1, val_1.TOP)).equal(s1);
        (0, code_1.expect)(tu(ctx, val_1.TOP, s0)).equal(s0);
        (0, code_1.expect)(tu(ctx, val_1.TOP, s1)).equal(s1);
        let b0 = new Nil_1.Nil('test');
        (0, code_1.expect)(tu(ctx, s0, b0)).equal(b0);
        (0, code_1.expect)(tu(ctx, s1, b0)).equal(b0);
        (0, code_1.expect)(tu(ctx, b0, s0)).equal(b0);
        (0, code_1.expect)(tu(ctx, b0, s1)).equal(b0);
        let t0 = makeSK_String();
        (0, code_1.expect)(tu(ctx, s0, t0)).equal(s0);
        (0, code_1.expect)(tu(ctx, t0, s0)).equal(s0);
        let n0 = makeNumberVal(1);
        (0, code_1.expect)(tu(ctx, s0, n0) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, s1, n0) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, n0, s0) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, n0, s1) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(s0.same(s0)).equal(true);
        (0, code_1.expect)(new val_1.StringVal({ peg: 'a' }).same(new val_1.StringVal({ peg: 'a' }))).equal(true);
        (0, code_1.expect)(new val_1.StringVal({ peg: 'a' }).same(new val_1.StringVal({ peg: 'b' }))).equal(false);
    });
    (0, node_test_1.it)('number', () => {
        let tu = (ctx, a, b) => (0, unify_2.unite)(ctx, a, b, 'number-test');
        let ctx = makeCtx();
        let n0 = makeNumberVal(0, ctx);
        let n1 = makeNumberVal(1.1, ctx);
        let n2 = makeNumberVal(-2, ctx);
        (0, code_1.expect)(tu(ctx, n0, n0)).equal(n0);
        (0, code_1.expect)(tu(ctx, n0, n0)).equal(n0);
        (0, code_1.expect)(tu(ctx, n1, n1)).equal(n1);
        (0, code_1.expect)(tu(ctx, n2, n2)).equal(n2);
        (0, code_1.expect)(tu(ctx, n0, n1) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, n1, n0) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, n0, n2) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, n2, n0) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, n1, n2) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, n2, n1) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, n0, val_1.TOP)).equal(n0);
        (0, code_1.expect)(tu(ctx, n1, val_1.TOP)).equal(n1);
        (0, code_1.expect)(tu(ctx, n2, val_1.TOP)).equal(n2);
        (0, code_1.expect)(tu(ctx, val_1.TOP, n0)).equal(n0);
        (0, code_1.expect)(tu(ctx, val_1.TOP, n1)).equal(n1);
        (0, code_1.expect)(tu(ctx, val_1.TOP, n2)).equal(n2);
        let b0 = new Nil_1.Nil('test');
        (0, code_1.expect)(tu(ctx, n0, b0)).equal(b0);
        (0, code_1.expect)(tu(ctx, n1, b0)).equal(b0);
        (0, code_1.expect)(tu(ctx, n2, b0)).equal(b0);
        (0, code_1.expect)(tu(ctx, b0, n0)).equal(b0);
        (0, code_1.expect)(tu(ctx, b0, n1)).equal(b0);
        (0, code_1.expect)(tu(ctx, b0, n2)).equal(b0);
        let t0 = makeSK_Number();
        (0, code_1.expect)(tu(ctx, n0, t0)).equal(n0);
        (0, code_1.expect)(tu(ctx, t0, n0)).equal(n0);
        let s0 = new val_1.StringVal({ peg: 's0' });
        (0, code_1.expect)(tu(ctx, n0, s0) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, n1, s0) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, n2, s0) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, s0, n0) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, s0, n1) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, s0, n2) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(n0.same(n0)).equal(true);
        (0, code_1.expect)(n1.same(n1)).equal(true);
        (0, code_1.expect)(n2.same(n2)).equal(true);
        (0, code_1.expect)(makeNumberVal(11).same(makeNumberVal(11))).equal(true);
        (0, code_1.expect)(makeNumberVal(11).same(makeNumberVal(22))).equal(false);
    });
    (0, node_test_1.it)('number-unify', () => {
        let ctx = makeCtx();
        let n0 = makeIntegerVal(11);
        n0.mark$ = 'n0';
        let n1 = makeIntegerVal(11);
        n1.mark$ = 'n1';
        (0, code_1.expect)(n0.unify(n1).mark$).equal('n0');
        (0, code_1.expect)(n1.unify(n0).mark$).equal('n1');
        let tn0 = makeSK_Number();
        let ti0 = makeSK_Integer();
        (0, code_1.expect)(n0.unify(tn0).mark$).equal('n0');
        (0, code_1.expect)(tn0.unify(n0, ctx).mark$).equal('n0');
        (0, code_1.expect)(n0.unify(ti0).mark$).equal('n0');
        (0, code_1.expect)(ti0.unify(n0, ctx).mark$).equal('n0');
        let x0 = makeNumberVal(11);
        x0.mark$ = 'x0';
        let x1 = makeNumberVal(11);
        x1.mark$ = 'x1';
        (0, code_1.expect)(x0.unify(x1).mark$).equal('x0');
        (0, code_1.expect)(x1.unify(x0).mark$).equal('x1');
        (0, code_1.expect)(x0.unify(tn0).mark$).equal('x0');
        (0, code_1.expect)(tn0.unify(x0, ctx).mark$).equal('x0');
        (0, code_1.expect)(x0.unify(ti0).isNil).equal(true);
        (0, code_1.expect)(ti0.unify(x0, ctx).isNil).equal(true);
        (0, code_1.expect)(x0.unify(n0).mark$).equal('n0');
        (0, code_1.expect)(n0.unify(x0).mark$).equal('n0');
        let x2 = makeNumberVal(2.2);
        x2.mark$ = 'x2';
        (0, code_1.expect)(x2.unify(tn0).mark$).equal('x2');
        (0, code_1.expect)(tn0.unify(x2, ctx).mark$).equal('x2');
        (0, code_1.expect)(x2.unify(ti0).isNil).equal(true);
        (0, code_1.expect)(ti0.unify(x2, ctx).isNil).equal(true);
        (0, code_1.expect)(x2.unify(n0).isNil).equal(true);
        (0, code_1.expect)(n0.unify(x2, ctx).isNil).equal(true);
    });
    (0, node_test_1.it)('number-parse', () => {
        // expect(P('0').canon).equal('0')
        // expect(P('1').canon).equal('1')
        // expect(P('2.2').canon).equal('2.2')
        // expect(P('-3').canon).equal('-3')
        // expect(P('+4').canon).equal('4')
        // const ctx = makeCtx()
        // expect(G('0', ctx)).equal(0)
        // expect(G('1', ctx)).equal(1)
        // expect(G('2.2', ctx)).equal(2.2)
        // expect(G('-3', ctx)).equal(-3)
        // expect(G('+4', ctx)).equal(4)
        const lang = new lang_1.Lang({
            // debug: true,
            // trace: true,
            // TODO: make this work
            idcount: 0
        });
        const i11 = lang.parse('(11)');
        (0, code_1.expect)(i11).include({
            col: 1,
            dc: -1,
            err: [],
            // id: 1,
            isIntegerVal: true,
            isScalarVal: true,
            isVal: true,
            path: [],
            peg: 11,
            row: 1,
            top: false,
            kind: val_1.Integer,
            uh: [],
            url: undefined,
        });
    });
    (0, node_test_1.it)('integer', () => {
        let ou = unify_2.unite;
        let tu = (ctx, a, b) => ou(ctx, a, b, 'integer-test');
        let ctx = makeCtx();
        let n0 = makeIntegerVal(0);
        let n1 = makeIntegerVal(1);
        (0, code_1.expect)(tu(ctx, n0, n0)).equal(n0);
        (0, code_1.expect)(tu(ctx, n1, n1)).equal(n1);
        (0, code_1.expect)(tu(ctx, n0, n1) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, n1, n0) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, n0, val_1.TOP)).equal(n0);
        (0, code_1.expect)(tu(ctx, n1, val_1.TOP)).equal(n1);
        (0, code_1.expect)(tu(ctx, val_1.TOP, n0)).equal(n0);
        (0, code_1.expect)(tu(ctx, val_1.TOP, n1)).equal(n1);
        let b0 = new Nil_1.Nil('test');
        (0, code_1.expect)(tu(ctx, n0, b0)).equal(b0);
        (0, code_1.expect)(tu(ctx, n1, b0)).equal(b0);
        (0, code_1.expect)(tu(ctx, b0, n0)).equal(b0);
        (0, code_1.expect)(tu(ctx, b0, n1)).equal(b0);
        let s0 = new val_1.StringVal({ peg: 's0' });
        (0, code_1.expect)(tu(ctx, n0, s0) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, n1, s0) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, s0, n0) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, s0, n1) instanceof Nil_1.Nil).exist();
        let t0 = makeSK_Integer();
        (0, code_1.expect)(tu(ctx, n0, t0)).equal(n0);
        (0, code_1.expect)(tu(ctx, t0, n0)).equal(n0);
        let t1 = makeSK_Number();
        (0, code_1.expect)(tu(ctx, n0, t1)).equal(n0);
        (0, code_1.expect)(tu(ctx, t1, n0)).equal(n0);
        (0, code_1.expect)(tu(ctx, t0, t1)).equal(t0);
        (0, code_1.expect)(tu(ctx, t1, t0)).equal(t0);
        let x0 = makeNumberVal(0);
        (0, code_1.expect)(tu(ctx, n0, x0)).equal(n0);
        (0, code_1.expect)(tu(ctx, x0, n0)).equal(n0);
        (0, code_1.expect)(n0.same(n0)).equal(true);
        (0, code_1.expect)(makeIntegerVal(11).same(makeIntegerVal(11))).equal(true);
        (0, code_1.expect)(makeIntegerVal(11).same(makeIntegerVal(22))).equal(false);
    });
    (0, node_test_1.it)('null', () => {
        let tu = (ctx, a, b) => (0, unify_2.unite)(ctx, a, b, 'null-test');
        let ctx = makeCtx();
        let nv = new val_1.NullVal({}, ctx);
        let bv = new val_1.BooleanVal({ peg: true }, ctx);
        let mv = new val_1.NumberVal({ peg: 2.2 }, ctx);
        let iv = new val_1.IntegerVal({ peg: 2 }, ctx);
        let sv = new val_1.StringVal({ peg: 'a' }, ctx);
        (0, code_1.expect)(tu(ctx, nv, nv)).equal(nv);
        (0, code_1.expect)(tu(ctx, nv, bv) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, nv, mv) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, nv, iv) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, nv, sv) instanceof Nil_1.Nil).exist();
    });
    (0, node_test_1.it)('map', () => {
        let ou = unify_2.unite;
        let tu = (ctx, a, b) => ou(ctx, a, b, 'integer-test');
        let ctx = makeCtx();
        let m0 = new MapVal_1.MapVal({ peg: {} });
        (0, code_1.expect)(m0.canon).equal('{}');
        // TODO: update
        (0, code_1.expect)(tu(ctx, m0, m0).canon).equal('{}');
        (0, code_1.expect)(tu(ctx, m0, val_1.TOP).canon).equal('{}');
        (0, code_1.expect)(tu(ctx, val_1.TOP, m0).canon).equal('{}');
        let b0 = new Nil_1.Nil('test');
        (0, code_1.expect)(tu(ctx, m0, b0)).equal(b0);
        (0, code_1.expect)(tu(ctx, b0, m0)).equal(b0);
        let s0 = new val_1.StringVal({ peg: 's0' });
        (0, code_1.expect)(tu(ctx, m0, s0) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, s0, m0) instanceof Nil_1.Nil).exist();
        let n0 = makeNumberVal(0);
        (0, code_1.expect)(tu(ctx, m0, n0) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, n0, m0) instanceof Nil_1.Nil).exist();
        let t0 = makeSK_String();
        (0, code_1.expect)(tu(ctx, m0, t0) instanceof Nil_1.Nil).exist();
        (0, code_1.expect)(tu(ctx, t0, m0) instanceof Nil_1.Nil).exist();
        let m1 = new MapVal_1.MapVal({ peg: { a: makeNumberVal(1) } });
        // print(m1, 'm1')
        (0, code_1.expect)(m1.canon).equal('{"a":1}');
        let m1u = m1.unify(val_1.TOP, ctx);
        // print(m1u, 'm1u')
        (0, code_1.expect)(m1u.canon).equal('{"a":1}');
        let u01 = m0.unify(m1, ctx);
        // print(u01, 'u01')
        (0, code_1.expect)(u01.canon).equal('{"a":1}');
        (0, code_1.expect)(m1u.canon).equal('{"a":1}');
        (0, code_1.expect)(m0.canon).equal('{}');
        (0, code_1.expect)(m1.canon).equal('{"a":1}');
        let u02 = m1.unify(m0, ctx);
        // print(u02, 'u02')
        (0, code_1.expect)(u02.canon).equal('{"a":1}');
        (0, code_1.expect)(m0.canon).equal('{}');
        (0, code_1.expect)(m1.canon).equal('{"a":1}');
    });
    (0, node_test_1.it)('map', () => {
        let ou = unify_2.unite;
        let tu = (ctx, a, b) => ou(ctx, a, b, 'integer-test');
        let ctx = makeCtx();
        let l0 = new ListVal_1.ListVal({ peg: [] });
        (0, code_1.expect)(l0.canon).equal('[]');
        (0, code_1.expect)(tu(ctx, l0, l0).canon).equal('[]');
    });
    (0, node_test_1.it)('map-spread', () => {
        let ctx = makeCtx();
        let m0 = new MapVal_1.MapVal({
            peg: {
                [MapVal_1.MapVal.SPREAD]: { o: '&', v: P('{x:1}') },
                a: P('{ y: 1 }'),
                b: P('{ y: 2 }'),
            }
        });
        (0, code_1.expect)(m0.canon).equal('{&:{"x":1},"a":{"y":1},"b":{"y":2}}');
        let u0 = m0.unify(val_1.TOP, ctx);
        (0, code_1.expect)(u0.canon).equal('{&:{"x":1},"a":{"y":1,"x":1},"b":{"y":2,"x":1}}');
    });
    (0, node_test_1.it)('list-spread', () => {
        let ctx = makeCtx();
        let vals = [
            P('{ y: 1 }'),
            P('{ y: 2 }'),
        ];
        vals[ListVal_1.ListVal.SPREAD] = { o: '&', v: P('{x:1}') };
        let l0 = new ListVal_1.ListVal({ peg: vals });
        (0, code_1.expect)(l0.canon).equal('[&:{"x":1},{"y":1},{"y":2}]');
        let u0 = l0.unify(val_1.TOP, ctx);
        (0, code_1.expect)(u0.canon).equal('[&:{"x":1},{"y":1,"x":1},{"y":2,"x":1}]');
    });
    (0, node_test_1.it)('var', () => {
        let q0 = new VarVal_1.VarVal({ peg: 'a' });
        (0, code_1.expect)(q0.canon).equal('$a');
        let ctx = makeCtx();
        ctx.var.foo = makeNumberVal(11);
        let s = 'a:$foo';
        let v0 = P(s, ctx);
        (0, code_1.expect)(v0.canon).equal('{"a":$"foo"}');
        let g0 = G(s, ctx);
        (0, code_1.expect)(g0).equal({ a: 11 });
    });
    (0, node_test_1.it)('conjunct', () => {
        let ou = unify_2.unite;
        let tu = (ctx, a, b) => ou(ctx, a, b, 'integer-test');
        let ctx = makeCtx(new MapVal_1.MapVal({ peg: { x: makeIntegerVal(1) } }));
        let d0 = new ConjunctVal_1.ConjunctVal({ peg: PA(['1']) });
        let d1 = new ConjunctVal_1.ConjunctVal({ peg: PA(['1', '1']) });
        let d2 = new ConjunctVal_1.ConjunctVal({ peg: PA(['1', '2']) });
        let d3 = new ConjunctVal_1.ConjunctVal({ peg: PA(['1', 'number']) });
        let d4 = new ConjunctVal_1.ConjunctVal({ peg: PA(['1', 'number', 'integer']) });
        let d5 = new ConjunctVal_1.ConjunctVal({ peg: PA(['{a:1}']) });
        let d6 = new ConjunctVal_1.ConjunctVal({ peg: PA(['{a:1}', '{b:2}']) });
        // let d100 = new ConjunctVal([makeIntegerVal(1), new RefVal({peg:'/x')])
        let d100 = new ConjunctVal_1.ConjunctVal({
            peg: [
                makeIntegerVal(1),
                new RefVal_1.RefVal({ peg: ['x'], absolute: true })
            ]
        });
        (0, code_1.expect)(d0.canon).equal('1');
        (0, code_1.expect)(d1.canon).equal('1&1');
        (0, code_1.expect)(d2.canon).equal('1&2');
        (0, code_1.expect)(d3.canon).equal('1&number');
        (0, code_1.expect)(d4.canon).equal('1&number&integer');
        (0, code_1.expect)(d5.canon).equal('{"a":1}');
        (0, code_1.expect)(d6.canon).equal('{"a":1}&{"b":2}');
        (0, code_1.expect)(tu(ctx, d0, P('1')).canon).equal('1');
        (0, code_1.expect)(tu(ctx, P('1', d0), val_1.TOP).canon).equal('1');
        (0, code_1.expect)(tu(ctx, d0, P('2')).canon)
            .equal('nil');
        (0, code_1.expect)(tu(ctx, P('2'), d0).canon)
            .equal('nil');
        (0, code_1.expect)(tu(ctx, d0, val_1.TOP).canon).equal('1');
        (0, code_1.expect)(tu(ctx, val_1.TOP, d0).canon).equal('1');
        (0, code_1.expect)(tu(ctx, d1, val_1.TOP).canon).equal('1');
        (0, code_1.expect)(tu(ctx, val_1.TOP, d1).canon).equal('1');
        (0, code_1.expect)(tu(ctx, d2, val_1.TOP).canon)
            .equal('nil');
        (0, code_1.expect)(tu(ctx, val_1.TOP, d2).canon)
            .equal('nil');
        (0, code_1.expect)(tu(ctx, d3, val_1.TOP).canon).equal('1');
        (0, code_1.expect)(tu(ctx, val_1.TOP, d3).canon).equal('1');
        // TODO: term order is swapped by ConjunctVal impl - should be preserved
        (0, code_1.expect)(tu(ctx, d100, val_1.TOP).canon).equal('1');
        (0, code_1.expect)(tu(ctx, val_1.TOP, d100).canon).equal('1');
        // TODO: same for DisjunctVal
        (0, code_1.expect)(tu(ctx, new ConjunctVal_1.ConjunctVal({ peg: [] }), val_1.TOP).canon).equal('top');
        (0, code_1.expect)(tu(ctx, P('1 & .a'), val_1.TOP).canon).equal('1&.a');
        (0, code_1.expect)(tu(ctx, P('.a & 1'), val_1.TOP).canon).equal('1&.a');
        (0, code_1.expect)(tu(ctx, P('1 & 1 & .a'), val_1.TOP).canon).equal('1&.a');
        (0, code_1.expect)(tu(ctx, P('1 & 2'), val_1.TOP).canon).equal('nil');
        (0, code_1.expect)(tu(ctx, P('1 & 1 & 2'), val_1.TOP).canon).equal('nil');
        (0, code_1.expect)(tu(ctx, P('1 & 1 & .a & 2'), val_1.TOP).canon).equal('nil');
        (0, code_1.expect)(tu(ctx, P('1 & 1 & .a & .b'), val_1.TOP).canon).equal('1&.a&.b');
        (0, code_1.expect)(tu(ctx, P('1 & 1 & .a & 1 & .b & 1'), val_1.TOP).canon).equal('1&.a&.b');
    });
    (0, node_test_1.it)('disjunct', () => {
        let ou = unify_2.unite;
        let tu = (ctx, a, b) => ou(ctx, a, b, 'integer-test');
        let ctx = makeCtx();
        let d1 = new DisjunctVal_1.DisjunctVal({ peg: [P('1'), P('2')] });
        (0, code_1.expect)(tu(ctx, d1, P('2')).canon).equal('2');
        (0, code_1.expect)(tu(ctx, P('1|number'), val_1.TOP).canon).equal('1|number');
        (0, code_1.expect)(tu(ctx, P('1|top'), val_1.TOP).canon).equal('1|top');
        (0, code_1.expect)(tu(ctx, P('1|number|top'), val_1.TOP).canon).equal('1|number|top');
        (0, code_1.expect)(tu(ctx, P('1|number'), val_1.TOP).gen()).equal(1);
        (0, code_1.expect)(tu(ctx, P('1|number|top'), val_1.TOP).gen()).equal(1);
        (0, code_1.expect)(tu(ctx, P('number|1').unify(P('top'), ctx), val_1.TOP).canon).equal('number|1');
        (0, code_1.expect)(tu(ctx, P('1|number|1').unify(P('top'), ctx), val_1.TOP).canon).equal('1|number');
        (0, code_1.expect)(tu(ctx, P('number|string').unify(P('top'), ctx), val_1.TOP).canon)
            .equal('number|string');
        (0, code_1.expect)(tu(ctx, P('number|string').unify(P('1'), ctx), val_1.TOP).canon).equal('1');
        (0, code_1.expect)(tu(ctx, P('number|1').unify(P('1'), ctx), val_1.TOP).canon).equal('1');
        (0, code_1.expect)(tu(ctx, P('number|1').unify(P('number|1'), ctx), val_1.TOP).canon).equal('number|1');
        (0, code_1.expect)(tu(ctx, P('1|number').unify(P('1|number'), ctx), val_1.TOP).canon).equal('1|number');
        (0, code_1.expect)(tu(ctx, P('number|1').unify(P('1|number'), ctx), val_1.TOP).canon).equal('1|number');
        (0, code_1.expect)(tu(ctx, P('number|1').unify(P('number|string'), ctx), val_1.TOP).canon)
            .equal('number|1');
        (0, code_1.expect)(tu(ctx, P('number|string').unify(P('boolean|number'), ctx), val_1.TOP).canon)
            .equal('number');
        (0, code_1.expect)(tu(ctx, P('number|*1').unify(P('number|*1'), ctx), val_1.TOP).canon)
            .equal('number|1|*1');
        let u0 = tu(ctx, P('number|*1'), P('number'));
        (0, code_1.expect)(u0.canon).equal('number|1');
        (0, code_1.expect)(u0.gen()).equal(1);
        let u1 = tu(ctx, P('number|*1'), P('number|string'));
        (0, code_1.expect)(u1.canon).equal('number|1');
        (0, code_1.expect)(u1.gen()).equal(1);
        let u2 = tu(ctx, P('number|*1'), P('2'));
        (0, code_1.expect)(u2.canon).equal('2');
        (0, code_1.expect)(u2.gen()).equal(2);
    });
    (0, node_test_1.it)('ref-conjunct', () => {
        return;
        /*
            let m0 = P(`
        a: 1
        b: /a
        c: 1 & /a
        d: 1
        e: /d & /a
        f: /b
        `, { xlog: -1 })
      
            let g = []
            g = []; console.log(m0.gen())
      
            let c0 = new Context({ root: m0 })
            let u0 = m0.unify(TOP, c0)
      
            g = []; console.log(u0.gen())
      
            let c0a = new Context({ root: u0 })
            let u0a = u0.unify(TOP, c0a)
      
            g = []; console.log(u0a.gen())
        */
        let m1 = P(`
  u: { x: 1, y: number}
  q: a: .u
  w: b: .q.a & {y:2, z: 3}
  `);
        let u1a = m1.unify(val_1.TOP, new unify_1.Context({ root: m1 }));
        let u1b = u1a.unify(val_1.TOP, new unify_1.Context({ root: u1a }));
    });
    (0, node_test_1.it)('unify', () => {
        let m0 = P(`
  a: 1
  b: .a
  c: .x
  `, { xlog: -1 });
        (0, code_1.expect)(m0.canon).equal('{"a":1,"b":.a,"c":.x}');
        let c0 = new unify_1.Context({
            root: m0
        });
        let m0u = m0.unify(val_1.TOP, c0);
        (0, code_1.expect)(m0u.canon).equal('{"a":1,"b":1,"c":.x}');
        let m1 = P(`
  a: .b.c
  b: c: 1
  `, { xlog: -1 });
        let c1 = new unify_1.Context({
            root: m1
        });
        let m1u = m1.unify(val_1.TOP, c1);
        (0, code_1.expect)(m1u.canon).equal('{"a":1,"b":{"c":1}}');
        let m2 = P(`
a: {x:1}
b: { &: $.a }
b: c0: {n:0}
b: c1: {n:1}
b: c2: {n:2}
`);
        (0, code_1.expect)(m2.canon)
            .equal('{"a":{"x":1},"b":{&:$.a}&{"c0":{"n":0}}&{"c1":{"n":1}}&{"c2":{"n":2}}}');
        (0, code_1.expect)(m2.peg.b.constructor.name).equal('ConjunctVal');
        (0, code_1.expect)(m2.peg.b.peg.length).equal(4);
        let c2 = new unify_1.Context({
            root: m2
        });
        let m2u = m2.unify(val_1.TOP, c2);
        (0, code_1.expect)(m2u.canon)
            // .equal('{"a":{"x":1},"b":{&:{"x":1},"c0":{"n":0,"x":1},"c1":{"n":1,"x":1},"c2":{"n":2,"x":1}}}')
            .equal('{"a":{"x":1},"b":{&:$.a,"c0":{"x":1,"n":0},"c1":{"x":1,"n":1},"c2":{"x":1,"n":2}}}');
    });
    (0, node_test_1.it)('repeat-spread', () => {
        let ctx = makeCtx();
        (0, code_1.expect)(G('p:a:b:&:n:1 p:a:b:c:{}', ctx)).equal({
            p: { a: { b: { c: { n: 1 } } } }
        });
        (0, code_1.expect)(G('p:a:&:&:n:1 p:a:b:c:{}', ctx)).equal({
            p: { a: { b: { c: { n: 1 } } } }
        });
        (0, code_1.expect)(G('p:a:b:&:n:.$KEY p:a:b:c:{}', ctx)).equal({
            p: { a: { b: { c: { n: 'c' } } } }
        });
        (0, code_1.expect)(G('p:a:&:&:n:.$KEY p:a:b:c:{}', ctx)).equal({
            p: { a: { b: { c: { n: 'c' } } } }
        });
    });
    (0, node_test_1.it)('operator-plus', () => {
        let ctx = makeCtx();
        (0, code_1.expect)(G('a:1+2', ctx)).equal({ a: 3 });
        (0, code_1.expect)(G('a:"b"+"c"', ctx)).equal({ a: 'bc' });
        (0, code_1.expect)(G('a:"1"+2', ctx)).equal({ a: '12' });
        (0, code_1.expect)(G('a:1,b:$.a+3', ctx)).equal({ a: 1, b: 4 });
        (0, code_1.expect)(G('a:"A",b:B+$.a', ctx)).equal({ a: 'A', b: 'BA' });
        (0, code_1.expect)(P('a:1+2', ctx).canon).equal('{"a":1+2}');
        (0, code_1.expect)(P('a:"b"+"c"', ctx).canon).equal('{"a":"b"+"c"}');
    });
    (0, node_test_1.it)('null-val', () => {
        let ctx = makeCtx();
        (0, code_1.expect)(G('a:null', ctx)).equal({ a: null });
        (0, code_1.expect)(G('[null]', ctx)).equal([null]);
        (0, code_1.expect)(G('null', ctx)).equal(null);
        (0, code_1.expect)(P('a:null', ctx).canon).equal('{"a":null}');
        (0, code_1.expect)(P('[null]', ctx).canon).equal('[null]');
        (0, code_1.expect)(P('null', ctx).canon).equal('null');
    });
    (0, node_test_1.it)('pref', () => {
        let ctx = makeCtx();
        let s0 = new val_1.StringVal({ peg: 'p0' });
        (0, code_1.expect)(s0.canon).equal('"p0"');
        let p0 = new PrefVal_1.PrefVal({ peg: s0 });
        (0, code_1.expect)(p0.canon).equal('*"p0"');
        (0, code_1.expect)(p0.gen()).equal('p0');
        let pu0 = p0.unify(val_1.TOP, ctx);
        (0, code_1.expect)(pu0).include({
            dc: -1,
            row: -1,
            col: -1,
            url: '',
            // FIX: use jest toMatchObject
            // peg: {
            //   dc: -1,
            //   row: -1,
            //   col: -1,
            //   url: '',
            //   peg: 'p0',
            //   path: [],
            //   kind: String,
            // },
            // path: [],
            // pref: {
            //   dc: -1,
            //   row: -1,
            //   col: -1,
            //   url: '',
            //   peg: 'p0',
            //   path: [],
            //   kind: String,
            // }
        });
        p0.peg = makeSK_String();
        (0, code_1.expect)(p0.canon).equal('*string');
        (0, code_1.expect)(p0.gen()).equal(undefined);
        // p0.pref = new Nil([], 'test:pref')
        // expect(p0.canon).equal('string')
        // expect(p0.gen([])).equal(undefined)
        // p0.peg = new Nil([], 'test:val')
        // expect(p0.canon).equal('nil')
        // expect(p0.gen([])).equal(undefined)
        let p1 = new PrefVal_1.PrefVal({ peg: new val_1.StringVal({ peg: 'p1' }) });
        let p2 = new PrefVal_1.PrefVal({ peg: makeSK_String() });
        let up12 = p1.unify(p2, ctx);
        (0, code_1.expect)(up12.canon).equal('*"p1"');
        let up21 = p2.unify(p1, ctx);
        (0, code_1.expect)(up21.canon).equal('*"p1"');
        let up2s0 = p2.unify(new val_1.StringVal({ peg: 's0' }), ctx);
        (0, code_1.expect)(up2s0.canon).equal('"s0"');
        // NOTE: once made concrete a prefval is fixed
        (0, code_1.expect)(up2s0.unify(new val_1.StringVal({ peg: 's1' }), ctx).canon)
            .equal('nil');
        // let u0 = P('1|number').unify(TOP, ctx)
        // let u1 = P('*1|number').unify(TOP, ctx)
        (0, code_1.expect)(UC('a:1')).equal('{"a":1}');
        (0, code_1.expect)(UC('a:1,b:.a')).equal('{"a":1,"b":1}');
        (0, code_1.expect)(UC('a:*1|number,b:2,c:.a&.b')).equal('{"a":*1|number,"b":2,"c":2}');
        (0, code_1.expect)(UC('a:*1|number,b:top,c:.a&.b'))
            .equal('{"a":*1|number,"b":top,"c":*1|number}');
        (0, code_1.expect)(UC('a:*1|number,a:*2|number'))
            // .equal('{"a":*2|*1|number}')
            .equal('{"a":2|1|number}');
        (0, code_1.expect)(UC('a:*1|number,b:*2|number,c:.a&.b'))
            .equal('{"a":*1|number,"b":*2|number,"c":2|1|number}');
        let d0 = P('1|number').unify(val_1.TOP, ctx);
        (0, code_1.expect)(d0.canon).equal('1|number');
        (0, code_1.expect)(d0.gen()).equal(1);
        // expect(d0.gen()).equal(undefined)
        (0, code_1.expect)(G('number|*1')).equal(1);
        (0, code_1.expect)(G('string|*1')).equal(1);
        (0, code_1.expect)(G('*1 & x', ctx)).equals(undefined);
        (0, code_1.expect)(G('a:*1,a:2')).equal({ a: 2 });
        (0, code_1.expect)(G('a:*1,a:x', ctx)).equals({ a: undefined });
        (0, code_1.expect)(G('a: *1 & 2')).equal({ a: 2 });
        (0, code_1.expect)(G('true|*true')).equal(true);
        (0, code_1.expect)(G('*true|true')).equal(true);
        (0, code_1.expect)(G('*true|*true')).equal(true);
        (0, code_1.expect)(G('*true|*true|*true')).equal(true);
        (0, code_1.expect)(G('true&*true')).equal(true);
        (0, code_1.expect)(G('*true&true')).equal(true);
        (0, code_1.expect)(G('*true&*true')).equal(true);
        (0, code_1.expect)(G('{a:2}&{a:number|*1}')).equal({ a: 2 });
        (0, code_1.expect)(G('{&:number}&{a:2}&{a:number|*1}')).equal({ a: 2 });
        (0, code_1.expect)(G('{a:{&:{c:number|*1}}} & {a:{b:{c:2}}}')).equal({ a: { b: { c: 2 } } });
        (0, code_1.expect)(G('{a:{&:{c:number|*1,d:boolean}}} & {a:{b:{c:2,d:true}}}'))
            .equal({ a: { b: { c: 2, d: true } } });
        (0, code_1.expect)(G('x: {a:{&:{c:number|*1,d:boolean}}} & {a:{b:{c:2,d:true}}}'))
            .equal({ x: { a: { b: { c: 2, d: true } } } });
        (0, code_1.expect)(G('x: {a:{&:{c:number|*1}&{d:boolean}}} & {a:{b:{c:2,d:true}}}'))
            .equal({ x: { a: { b: { c: 2, d: true } } } });
        (0, code_1.expect)(G('y: "Y", x: {a:{&:{c:number|*1,d:boolean}}} & {a:{b:{c:2,d:true}}}'))
            .equal({ y: 'Y', x: { a: { b: { c: 2, d: true } } } });
        (0, code_1.expect)(G('y: "Y", x: {a:{&:{c:number|*1,d:boolean,e:$.y}}}' +
            ' & {a:{b:{c:2,d:true}}}'))
            .equal({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Y' } } } });
        (0, code_1.expect)(G('y: *"Y"|string, x: {a:{&:{c:number|*1,d:boolean,e:$.y}}}' +
            ' & {a:{b:{c:2,d:true}}}'))
            .equal({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Y' } } } });
        (0, code_1.expect)(G('y: *"Y"|string, x: {a:{&:{c:number|*1,d:boolean,e:$.y}}}' +
            ' & {a:{b:{c:2,d:true,e:"Q"}}}'))
            .equal({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Q' } } } });
        (0, code_1.expect)(G('y: "Y", x: {a:{&:{c:number|*1}&{d:boolean}}} & {a:{b:{c:2,d:true}}}'))
            .equal({ y: 'Y', x: { a: { b: { c: 2, d: true } } } });
        (0, code_1.expect)(G('y: "Y", x: {a:{&:{c:number|*1}&{d:boolean,e:$.y}}}' +
            ' & {a:{b:{c:2,d:true}}}'))
            .equal({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Y' } } } });
        (0, code_1.expect)(G('y: *"Y"|string, x: {a:{&:{c:number|*1}&{d:boolean,e:$.y}}}' +
            ' & {a:{b:{c:2,d:true}}}'))
            .equal({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Y' } } } });
        (0, code_1.expect)(G('y: *"Y"|string, x: {a:{&:{c:number|*1}&{d:boolean,e:$.y}}}' +
            ' & {a:{b:{c:2,d:true,e:"Q"}}}'))
            .equal({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Q' } } } });
        (0, code_1.expect)(G(`
  a: *true | boolean
  b: $.a
  c: $.a & false
  d: { x: $.a }
  d: { x: false }
  e: { x: $.a }
  f: { &: *true | boolean }
  f: { y: false }
  g: .f
  h: { &: $.a }
  h: { z: false }
  `)).equal({
            a: true,
            b: true,
            c: false,
            d: { x: false },
            e: { x: true },
            f: { y: false },
            g: { y: false },
            h: { z: false }
        });
        (0, code_1.expect)(G(`
  x: y: { m: n: *false | boolean }
  a: b: { &: $.x.y }
  a: b: { c: {} }
  a: b: d: {}
  a: b: e: m: n: true
  `)).equal({
            x: { y: { m: { n: false } } },
            a: {
                b: {
                    c: { m: { n: false } },
                    d: { m: { n: false } },
                    e: { m: { n: true } }
                }
            },
        });
    });
});
function makeCtx(r) {
    return new unify_1.Context({ root: r || new MapVal_1.MapVal({ peg: {} }) });
}
//# sourceMappingURL=val-basic.test.js.map