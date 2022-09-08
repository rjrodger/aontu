"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lang_1 = require("../lib/lang");
const unify_1 = require("../lib/unify");
const op_1 = require("../lib/op/op");
const ConjunctVal_1 = require("../lib/val/ConjunctVal");
const DisjunctVal_1 = require("../lib/val/DisjunctVal");
const MapVal_1 = require("../lib/val/MapVal");
const ListVal_1 = require("../lib/val/ListVal");
const PrefVal_1 = require("../lib/val/PrefVal");
const RefVal_1 = require("../lib/val/RefVal");
const Nil_1 = require("../lib/val/Nil");
const val_1 = require("../lib/val");
const type_1 = require("../lib/type");
const lang = new lang_1.Lang();
const PL = lang.parse.bind(lang);
const P = (x, ctx) => PL(x, ctx);
const PA = (x, ctx) => x.map(s => PL(s, ctx));
const D = (x) => console.dir(x, { depth: null });
const UC = (s, r) => { var _a; return (_a = (r = P(s)).unify(type_1.TOP, makeCtx(r))) === null || _a === void 0 ? void 0 : _a.canon; };
const G = (x, ctx) => new unify_1.Unify(x, lang).res.gen();
describe('val', function () {
    it('canon', () => {
        expect(P('1').canon).toEqual('1');
        expect(P('"a"').canon).toEqual('"a"');
        expect(P('b').canon).toEqual('"b"');
        expect(P('true').canon).toEqual('true');
        expect(P('top').canon).toEqual('top');
        expect(P('nil').canon).toMatch(/^nil/);
        expect(P('a:1').canon).toEqual('{"a":1}');
        expect(P('a:1,b:nil').canon).toMatch(/^\{"a":1,"b":nil/);
        expect(P('a:1,b:c:2').canon).toEqual('{"a":1,"b":{"c":2}}');
    });
    it('gen', () => {
        expect(P('1').gen()).toEqual(1);
        expect(P('"a"').gen()).toEqual('a');
        expect(P('b').gen()).toEqual('b');
        expect(P('true').gen()).toEqual(true);
        expect(P('top').gen()).toEqual(undefined);
        expect(P('nil').gen()).toEqual(undefined);
        expect(P('a:1').gen()).toEqual({ a: 1 });
        expect(P('a:1,b:nil').gen()).toEqual({ a: 1, b: undefined });
        expect(P('a:1,b:c:2').gen()).toEqual({ a: 1, b: { c: 2 } });
    });
    it('scalartype', () => {
        expect(new val_1.ScalarTypeVal(String).same(new val_1.ScalarTypeVal(String))).toBeTruthy();
        expect(new val_1.ScalarTypeVal(Number).same(new val_1.ScalarTypeVal(Number))).toBeTruthy();
        expect(new val_1.ScalarTypeVal(Boolean).same(new val_1.ScalarTypeVal(Boolean))).toBeTruthy();
        expect(new val_1.ScalarTypeVal(val_1.Integer).same(new val_1.ScalarTypeVal(val_1.Integer))).toBeTruthy();
        expect(new val_1.ScalarTypeVal(String).same(new val_1.ScalarTypeVal(Number))).toBeFalsy();
        expect(new val_1.ScalarTypeVal(String).same(new val_1.ScalarTypeVal(Boolean))).toBeFalsy();
        expect(new val_1.ScalarTypeVal(String).same(new val_1.ScalarTypeVal(val_1.Integer))).toBeFalsy();
        expect(new val_1.ScalarTypeVal(Number).same(new val_1.ScalarTypeVal(Boolean))).toBeFalsy();
        expect(new val_1.ScalarTypeVal(Number).same(new val_1.ScalarTypeVal(val_1.Integer))).toBeFalsy();
        expect(new val_1.ScalarTypeVal(val_1.Integer).same(new val_1.ScalarTypeVal(Boolean))).toBeFalsy();
    });
    it('boolean', () => {
        let ctx = makeCtx();
        let bt = val_1.BooleanVal.TRUE;
        let bf = val_1.BooleanVal.FALSE;
        expect((0, op_1.unite)(ctx, bt, bt)).toEqual(bt);
        expect((0, op_1.unite)(ctx, bf, bf)).toEqual(bf);
        expect((0, op_1.unite)(ctx, bt, bf) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, bf, bt) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, bt, type_1.TOP)).toEqual(bt);
        expect((0, op_1.unite)(ctx, bf, type_1.TOP)).toEqual(bf);
        expect((0, op_1.unite)(ctx, type_1.TOP, bt)).toEqual(bt);
        expect((0, op_1.unite)(ctx, type_1.TOP, bf)).toEqual(bf);
        let b0 = new Nil_1.Nil('test');
        expect((0, op_1.unite)(ctx, bt, b0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, bf, b0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, b0, bt)).toEqual(b0);
        expect((0, op_1.unite)(ctx, b0, bf)).toEqual(b0);
        let bs = new val_1.ScalarTypeVal(Boolean);
        expect((0, op_1.unite)(ctx, bt, bs)).toEqual(bt);
        expect((0, op_1.unite)(ctx, bs, bt)).toEqual(bt);
        let n0 = new val_1.NumberVal(1);
        expect((0, op_1.unite)(ctx, bt, n0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, bf, n0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n0, bt) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n0, bf) instanceof Nil_1.Nil).toBeTruthy();
        expect(bt.same(bt)).toBeTruthy();
        expect(bf.same(bf)).toBeTruthy();
        expect(bt.same(bf)).toBeFalsy();
        expect(new val_1.BooleanVal(true).same(new val_1.BooleanVal(true))).toBeTruthy();
        expect(new val_1.BooleanVal(false).same(new val_1.BooleanVal(false))).toBeTruthy();
        expect(new val_1.BooleanVal(true).same(new val_1.BooleanVal(false))).toBeFalsy();
    });
    it('string', () => {
        let ctx = makeCtx();
        let s0 = new val_1.StringVal('s0');
        let s1 = new val_1.StringVal('s1');
        expect((0, op_1.unite)(ctx, s0, s0)).toEqual(s0);
        expect((0, op_1.unite)(ctx, s1, s1)).toEqual(s1);
        expect((0, op_1.unite)(ctx, s0, s1) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, s1, s0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, s0, type_1.TOP)).toEqual(s0);
        expect((0, op_1.unite)(ctx, s1, type_1.TOP)).toEqual(s1);
        expect((0, op_1.unite)(ctx, type_1.TOP, s0)).toEqual(s0);
        expect((0, op_1.unite)(ctx, type_1.TOP, s1)).toEqual(s1);
        let b0 = new Nil_1.Nil('test');
        expect((0, op_1.unite)(ctx, s0, b0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, s1, b0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, b0, s0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, b0, s1)).toEqual(b0);
        let t0 = new val_1.ScalarTypeVal(String);
        expect((0, op_1.unite)(ctx, s0, t0)).toEqual(s0);
        expect((0, op_1.unite)(ctx, t0, s0)).toEqual(s0);
        let n0 = new val_1.NumberVal(1);
        expect((0, op_1.unite)(ctx, s0, n0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, s1, n0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n0, s0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n0, s1) instanceof Nil_1.Nil).toBeTruthy();
        expect(s0.same(s0)).toBeTruthy();
        expect(new val_1.StringVal('a').same(new val_1.StringVal('a'))).toBeTruthy();
        expect(new val_1.StringVal('a').same(new val_1.StringVal('b'))).toBeFalsy();
    });
    it('number', () => {
        let ctx = makeCtx();
        let n0 = new val_1.NumberVal(0, ctx);
        let n1 = new val_1.NumberVal(1.1, ctx);
        expect((0, op_1.unite)(ctx, n0, n0)).toEqual(n0);
        expect((0, op_1.unite)(ctx, n0, n0)).toEqual(n0);
        expect((0, op_1.unite)(ctx, n1, n1)).toEqual(n1);
        expect((0, op_1.unite)(ctx, n0, n1) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n1, n0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n0, type_1.TOP)).toEqual(n0);
        expect((0, op_1.unite)(ctx, n1, type_1.TOP)).toEqual(n1);
        expect((0, op_1.unite)(ctx, type_1.TOP, n0)).toEqual(n0);
        expect((0, op_1.unite)(ctx, type_1.TOP, n1)).toEqual(n1);
        let b0 = new Nil_1.Nil('test');
        expect((0, op_1.unite)(ctx, n0, b0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, n1, b0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, b0, n0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, b0, n1)).toEqual(b0);
        let t0 = new val_1.ScalarTypeVal(Number);
        expect((0, op_1.unite)(ctx, n0, t0)).toEqual(n0);
        expect((0, op_1.unite)(ctx, t0, n0)).toEqual(n0);
        let s0 = new val_1.StringVal('s0');
        expect((0, op_1.unite)(ctx, n0, s0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n1, s0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, s0, n0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, s0, n1) instanceof Nil_1.Nil).toBeTruthy();
        expect(n0.same(n0)).toBeTruthy();
        expect(new val_1.NumberVal(11).same(new val_1.NumberVal(11))).toBeTruthy();
        expect(new val_1.NumberVal(11).same(new val_1.NumberVal(22))).toBeFalsy();
    });
    it('integer', () => {
        let ctx = makeCtx();
        let n0 = new val_1.IntegerVal(0);
        let n1 = new val_1.IntegerVal(1);
        expect((0, op_1.unite)(ctx, n0, n0)).toEqual(n0);
        expect((0, op_1.unite)(ctx, n1, n1)).toEqual(n1);
        expect((0, op_1.unite)(ctx, n0, n1) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n1, n0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n0, type_1.TOP)).toEqual(n0);
        expect((0, op_1.unite)(ctx, n1, type_1.TOP)).toEqual(n1);
        expect((0, op_1.unite)(ctx, type_1.TOP, n0)).toEqual(n0);
        expect((0, op_1.unite)(ctx, type_1.TOP, n1)).toEqual(n1);
        let b0 = new Nil_1.Nil('test');
        expect((0, op_1.unite)(ctx, n0, b0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, n1, b0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, b0, n0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, b0, n1)).toEqual(b0);
        let s0 = new val_1.StringVal('s0');
        expect((0, op_1.unite)(ctx, n0, s0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n1, s0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, s0, n0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, s0, n1) instanceof Nil_1.Nil).toBeTruthy();
        let t0 = new val_1.ScalarTypeVal(val_1.Integer);
        expect((0, op_1.unite)(ctx, n0, t0)).toEqual(n0);
        expect((0, op_1.unite)(ctx, t0, n0)).toEqual(n0);
        let t1 = new val_1.ScalarTypeVal(Number);
        expect((0, op_1.unite)(ctx, n0, t1)).toEqual(n0);
        expect((0, op_1.unite)(ctx, t1, n0)).toEqual(n0);
        expect((0, op_1.unite)(ctx, t0, t1)).toEqual(t0);
        expect((0, op_1.unite)(ctx, t1, t0)).toEqual(t0);
        let x0 = new val_1.NumberVal(0);
        expect((0, op_1.unite)(ctx, n0, x0)).toEqual(n0);
        expect((0, op_1.unite)(ctx, x0, n0)).toEqual(n0);
        expect(n0.same(n0)).toBeTruthy();
        expect(new val_1.IntegerVal(11).same(new val_1.IntegerVal(11))).toBeTruthy();
        expect(new val_1.IntegerVal(11).same(new val_1.IntegerVal(22))).toBeFalsy();
    });
    it('map', () => {
        let ctx = makeCtx();
        let m0 = new MapVal_1.MapVal({});
        expect(m0.canon).toEqual('{}');
        // TODO: update
        expect((0, op_1.unite)(ctx, m0, m0).canon).toEqual('{}');
        expect((0, op_1.unite)(ctx, m0, type_1.TOP).canon).toEqual('{}');
        expect((0, op_1.unite)(ctx, type_1.TOP, m0).canon).toEqual('{}');
        let b0 = new Nil_1.Nil('test');
        expect((0, op_1.unite)(ctx, m0, b0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, b0, m0)).toEqual(b0);
        let s0 = new val_1.StringVal('s0');
        expect((0, op_1.unite)(ctx, m0, s0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, s0, m0) instanceof Nil_1.Nil).toBeTruthy();
        let n0 = new val_1.NumberVal(0);
        expect((0, op_1.unite)(ctx, m0, n0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n0, m0) instanceof Nil_1.Nil).toBeTruthy();
        let t0 = new val_1.ScalarTypeVal(String);
        expect((0, op_1.unite)(ctx, m0, t0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, t0, m0) instanceof Nil_1.Nil).toBeTruthy();
        let m1 = new MapVal_1.MapVal({ a: new val_1.NumberVal(1) });
        // print(m1, 'm1')
        expect(m1.canon).toEqual('{"a":1}');
        let m1u = m1.unify(type_1.TOP, ctx);
        // print(m1u, 'm1u')
        expect(m1u.canon).toEqual('{"a":1}');
        let u01 = m0.unify(m1, ctx);
        // print(u01, 'u01')
        expect(u01.canon).toEqual('{"a":1}');
        expect(m1u.canon).toEqual('{"a":1}');
        expect(m0.canon).toEqual('{}');
        expect(m1.canon).toEqual('{"a":1}');
        let u02 = m1.unify(m0, ctx);
        // print(u02, 'u02')
        expect(u02.canon).toEqual('{"a":1}');
        expect(m0.canon).toEqual('{}');
        expect(m1.canon).toEqual('{"a":1}');
    });
    it('map', () => {
        let ctx = makeCtx();
        let l0 = new ListVal_1.ListVal([]);
        expect(l0.canon).toEqual('[]');
        expect((0, op_1.unite)(ctx, l0, l0).canon).toEqual('[]');
    });
    it('map-spread', () => {
        let ctx = makeCtx();
        let m0 = new MapVal_1.MapVal({
            [MapVal_1.MapVal.SPREAD]: { o: '&', v: P('{x:1}') },
            a: P('{ y: 1 }'),
            b: P('{ y: 2 }'),
        });
        // console.dir(m0, { depth: null })
        expect(m0.canon).toEqual('{&:{"x":1},"a":{"y":1},"b":{"y":2}}');
        let u0 = m0.unify(type_1.TOP, ctx);
        expect(u0.canon).toEqual('{&:{"x":1},"a":{"y":1,"x":1},"b":{"y":2,"x":1}}');
    });
    it('list-spread', () => {
        let ctx = makeCtx();
        let vals = [
            P('{ y: 1 }'),
            P('{ y: 2 }'),
        ];
        vals[ListVal_1.ListVal.SPREAD] = { o: '&', v: P('{x:1}') };
        let l0 = new ListVal_1.ListVal(vals);
        // console.dir(l0, { depth: null })
        expect(l0.canon).toEqual('[&:{"x":1},{"y":1},{"y":2}]');
        let u0 = l0.unify(type_1.TOP, ctx);
        expect(u0.canon).toEqual('[&:{"x":1},{"y":1,"x":1},{"y":2,"x":1}]');
    });
    /*
    it('map-merge', () => {
      let ctx = makeCtx()
  
      let m0 = P('a:{x:1},a:{y:2}')
  
      console.dir(m0, { depth: null })
  
      //expect(m0.canon).toEqual('{&:{"x":1},"a":{"y":1},"b":{"y":2}}')
  
      //let u0 = m0.unify(TOP, ctx)
      //expect(u0.canon).toEqual('{&:{"x":1},"a":{"y":1,"x":1},"b":{"y":2,"x":1}}')
    })
    */
    it('conjunct', () => {
        let ctx = makeCtx(new MapVal_1.MapVal({ x: new val_1.IntegerVal(1) }));
        let d0 = new ConjunctVal_1.ConjunctVal(PA(['1']));
        let d1 = new ConjunctVal_1.ConjunctVal(PA(['1', '1']));
        let d2 = new ConjunctVal_1.ConjunctVal(PA(['1', '2']));
        let d3 = new ConjunctVal_1.ConjunctVal(PA(['1', 'number']));
        let d4 = new ConjunctVal_1.ConjunctVal(PA(['1', 'number', 'integer']));
        let d5 = new ConjunctVal_1.ConjunctVal(PA(['{a:1}']));
        let d6 = new ConjunctVal_1.ConjunctVal(PA(['{a:1}', '{b:2}']));
        // let d100 = new ConjunctVal([new IntegerVal(1), new RefVal('/x')])
        let d100 = new ConjunctVal_1.ConjunctVal([new val_1.IntegerVal(1), new RefVal_1.RefVal(['x'], true)]);
        expect(d0.canon).toEqual('1');
        expect(d1.canon).toEqual('1&1');
        expect(d2.canon).toEqual('1&2');
        expect(d3.canon).toEqual('1&number');
        expect(d4.canon).toEqual('1&number&integer');
        expect(d5.canon).toEqual('{"a":1}');
        expect(d6.canon).toEqual('{"a":1}&{"b":2}');
        expect((0, op_1.unite)(ctx, d0, P('1')).canon).toEqual('1');
        expect((0, op_1.unite)(ctx, P('1', d0)).canon).toEqual('1');
        expect((0, op_1.unite)(ctx, d0, P('2')).canon)
            .toEqual('nil');
        expect((0, op_1.unite)(ctx, P('2'), d0).canon)
            .toEqual('nil');
        expect((0, op_1.unite)(ctx, d0, type_1.TOP).canon).toEqual('1');
        expect((0, op_1.unite)(ctx, type_1.TOP, d0).canon).toEqual('1');
        expect((0, op_1.unite)(ctx, d1, type_1.TOP).canon).toEqual('1');
        expect((0, op_1.unite)(ctx, type_1.TOP, d1).canon).toEqual('1');
        expect((0, op_1.unite)(ctx, d2, type_1.TOP).canon)
            .toEqual('nil');
        expect((0, op_1.unite)(ctx, type_1.TOP, d2).canon)
            .toEqual('nil');
        expect((0, op_1.unite)(ctx, d3, type_1.TOP).canon).toEqual('1');
        expect((0, op_1.unite)(ctx, type_1.TOP, d3).canon).toEqual('1');
        // TODO: term order is swapped by ConjunctVal impl - should be preserved
        expect((0, op_1.unite)(ctx, d100, type_1.TOP).canon).toEqual('1');
        expect((0, op_1.unite)(ctx, type_1.TOP, d100).canon).toEqual('1');
        // TODO: same for DisjunctVal
        expect((0, op_1.unite)(ctx, new ConjunctVal_1.ConjunctVal([]), type_1.TOP).canon).toEqual('top');
    });
    it('disjunct', () => {
        let ctx = makeCtx();
        let d1 = new DisjunctVal_1.DisjunctVal([P('1'), P('2')]);
        expect((0, op_1.unite)(ctx, d1, P('2')).canon).toEqual('2');
        expect((0, op_1.unite)(ctx, P('1|number')).canon).toEqual('1|number');
        expect((0, op_1.unite)(ctx, P('1|top')).canon).toEqual('1|top');
        expect((0, op_1.unite)(ctx, P('1|number|top')).canon).toEqual('1|number|top');
        expect((0, op_1.unite)(ctx, P('1|number')).gen()).toEqual(1);
        expect((0, op_1.unite)(ctx, P('1|number|top')).gen()).toEqual(undefined);
        expect((0, op_1.unite)(ctx, P('number|1').unify(P('top'))).canon).toEqual('number|1');
        expect((0, op_1.unite)(ctx, P('1|number|1').unify(P('top'))).canon).toEqual('1|number');
        expect((0, op_1.unite)(ctx, P('number|string').unify(P('top'))).canon)
            .toEqual('number|string');
        expect((0, op_1.unite)(ctx, P('number|string').unify(P('1'))).canon).toEqual('1');
        expect((0, op_1.unite)(ctx, P('number|1').unify(P('1'))).canon).toEqual('1');
        expect((0, op_1.unite)(ctx, P('number|1').unify(P('number|1'))).canon).toEqual('number|1');
        expect((0, op_1.unite)(ctx, P('1|number').unify(P('1|number'))).canon).toEqual('1|number');
        expect((0, op_1.unite)(ctx, P('number|1').unify(P('1|number'))).canon).toEqual('1|number');
        expect((0, op_1.unite)(ctx, P('number|1').unify(P('number|string'))).canon)
            .toEqual('number|1');
        expect((0, op_1.unite)(ctx, P('number|string').unify(P('boolean|number'))).canon)
            .toEqual('number');
        expect((0, op_1.unite)(ctx, P('number|*1').unify(P('number|*1'))).canon).toEqual('number|*1');
        let u0 = (0, op_1.unite)(ctx, P('number|*1'), P('number'));
        //console.dir(u0, { depth: null })
        //console.log(u0.canon)
        //console.log(u0.gen())
        expect(u0.canon).toEqual('number|*1');
        expect(u0.gen()).toEqual(1);
        let u1 = (0, op_1.unite)(ctx, P('number|*1'), P('number|string'));
        //console.dir(u1, { depth: null })
        //console.log(u1.canon)
        //console.log(u1.gen())
        expect(u1.canon).toEqual('number|*1');
        expect(u1.gen()).toEqual(1);
        let u2 = (0, op_1.unite)(ctx, P('number|*1'), P('2'));
        //console.dir(u2, { depth: null })
        //console.log(u2.canon)
        //console.log(u2.gen())
        expect(u2.canon).toEqual('2');
        expect(u2.gen()).toEqual(2);
    });
    it('ref', () => {
        let ctx = makeCtx();
        let d0 = new RefVal_1.RefVal(['a']);
        let d1 = new RefVal_1.RefVal(['c'], true);
        let d2 = new RefVal_1.RefVal(['a', 'b'], false);
        let d3 = new RefVal_1.RefVal(['c', 'd', 'e'], true);
        expect(d0.canon).toEqual('a');
        expect(d1.canon).toEqual('.c');
        expect(d2.canon).toEqual('a.b');
        expect(d3.canon).toEqual('.c.d.e');
        d0.append('x');
        d1.append('x');
        d2.append('x');
        d3.append('x');
        expect(d0.canon).toEqual('a.x');
        expect(d1.canon).toEqual('.c.x');
        expect(d2.canon).toEqual('a.b.x');
        expect(d3.canon).toEqual('.c.d.e.x');
        expect(d0.unify(type_1.TOP, ctx).canon).toEqual('a.x');
        expect(type_1.TOP.unify(d0, ctx).canon).toEqual('a.x');
        expect(d1.unify(type_1.TOP, ctx).canon).toEqual('.c.x');
        expect(type_1.TOP.unify(d1, ctx).canon).toEqual('.c.x');
    });
    it('ref-conjunct', () => {
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
            console.log('m0===', m0.done, m0.canon)
            g = []; console.log(m0.gen())
    
            let c0 = new Context({ root: m0 })
            let u0 = m0.unify(TOP, c0)
    
            console.log('u0===', u0.done, u0.canon)
            g = []; console.log(u0.gen())
    
            let c0a = new Context({ root: u0 })
            let u0a = u0.unify(TOP, c0a)
    
            console.log('u0a===', u0a.done, u0a.canon)
            g = []; console.log(u0a.gen())
        */
        let m1 = P(`
  u: { x: 1, y: number}
  q: a: .u
  w: b: .q.a & {y:2, z: 3}
  `);
        let u1a = m1.unify(type_1.TOP, new unify_1.Context({ root: m1 }));
        // console.log('u1a', u1a.done, u1a.canon)
        //console.dir(u1a, { depth: null })
        let u1b = u1a.unify(type_1.TOP, new unify_1.Context({ root: u1a }));
        // console.log('u1b', u1b.done, u1b.canon)
        //console.dir(u1b, { depth: null })
    });
    it('unify', () => {
        let m0 = P(`
  a: 1
  b: .a
  c: .x
  `, { xlog: -1 });
        //console.dir(m0, { depth: null })
        expect(m0.canon).toEqual('{"a":1,"b":.a,"c":.x}');
        let c0 = new unify_1.Context({
            root: m0
        });
        let m0u = m0.unify(type_1.TOP, c0);
        // console.dir(m0u, { depth: null })
        expect(m0u.canon).toEqual('{"a":1,"b":1,"c":.x}');
        let m1 = P(`
  a: .b.c
  b: c: 1
  `, { xlog: -1 });
        let c1 = new unify_1.Context({
            root: m1
        });
        let m1u = m1.unify(type_1.TOP, c1);
        // console.dir(m1u, { depth: null })
        expect(m1u.canon).toEqual('{"a":1,"b":{"c":1}}');
    });
    it('pref', () => {
        let ctx = makeCtx();
        let p0 = new PrefVal_1.PrefVal(new val_1.StringVal('p0'));
        expect(p0.canon).toEqual('*"p0"');
        expect(p0.gen()).toEqual('p0');
        let pu0 = p0.unify(type_1.TOP, ctx);
        // console.log(pu0)
        expect(pu0).toMatchObject({
            done: -1,
            row: -1,
            col: -1,
            url: '',
            // FIX: use jest toMatchObject
            // peg: {
            //   done: -1,
            //   row: -1,
            //   col: -1,
            //   url: '',
            //   peg: 'p0',
            //   path: [],
            //   type: String,
            // },
            // path: [],
            // pref: {
            //   done: -1,
            //   row: -1,
            //   col: -1,
            //   url: '',
            //   peg: 'p0',
            //   path: [],
            //   type: String,
            // }
        });
        p0.peg = new val_1.ScalarTypeVal(String);
        expect(p0.canon).toEqual('*"p0"');
        expect(p0.gen()).toEqual('p0');
        // p0.pref = new Nil([], 'test:pref')
        // expect(p0.canon).toEqual('string')
        // expect(p0.gen([])).toEqual(undefined)
        // p0.peg = new Nil([], 'test:val')
        // expect(p0.canon).toEqual('nil')
        // expect(p0.gen([])).toEqual(undefined)
        let p1 = new PrefVal_1.PrefVal(new val_1.StringVal('p1'));
        let p2 = new PrefVal_1.PrefVal(new val_1.ScalarTypeVal(String));
        let up12 = p1.unify(p2, ctx);
        expect(up12.canon).toEqual('*"p1"');
        let up21 = p2.unify(p1, ctx);
        expect(up21.canon).toEqual('*"p1"');
        let up2s0 = p2.unify(new val_1.StringVal('s0'), ctx);
        expect(up2s0.canon).toEqual('*"s0"');
        // NOTE: once made concrete a prefval is fixed
        expect(up2s0.unify(new val_1.StringVal('s1'), ctx).canon)
            .toEqual('nil');
        // let u0 = P('1|number').unify(TOP, ctx)
        // // console.log(u0)
        // let u1 = P('*1|number').unify(TOP, ctx)
        // // console.log(u1)
        expect(UC('a:1')).toEqual('{"a":1}');
        expect(UC('a:1,b:.a')).toEqual('{"a":1,"b":1}');
        expect(UC('a:*1|number,b:2,c:.a&.b')).toEqual('{"a":*1|number,"b":2,"c":2}');
        expect(UC('a:*1|number,b:top,c:.a&.b'))
            .toEqual('{"a":*1|number,"b":top,"c":*1|number}');
        expect(UC('a:*1|number,b:*2|number,c:.a&.b'))
            .toEqual('{"a":*1|number,"b":*2|number,"c":*2|*1|number}');
        let d0 = P('1|number').unify(type_1.TOP, ctx);
        // console.log(d0.canon)
        // console.log(d0.gen())
        expect(d0.canon).toEqual('1|number');
        expect(d0.gen()).toEqual(1);
        expect(G('number|*1')).toEqual(1);
        expect(G('string|*1')).toEqual(1);
        expect(G('a:*1,a:2')).toEqual({ a: undefined });
        expect(G('*1 & 2')).toEqual(undefined);
        expect(G('true|*true')).toEqual(true);
        expect(G('*true|true')).toEqual(true);
        expect(G('*true|*true')).toEqual(true);
        expect(G('*true|*true|*true')).toEqual(true);
        expect(G('true&*true')).toEqual(true);
        expect(G('*true&true')).toEqual(true);
        expect(G('*true&*true')).toEqual(true);
        expect(G('{a:2}&{a:number|*1}')).toEqual({ a: 2 });
        expect(G('{&:number}&{a:2}&{a:number|*1}')).toEqual({ a: 2 });
        expect(G('{a:{&:{c:number|*1}}} & {a:{b:{c:2}}}')).toEqual({ a: { b: { c: 2 } } });
        expect(G('{a:{&:{c:number|*1,d:boolean}}} & {a:{b:{c:2,d:true}}}'))
            .toEqual({ a: { b: { c: 2, d: true } } });
        expect(G('x: {a:{&:{c:number|*1,d:boolean}}} & {a:{b:{c:2,d:true}}}'))
            .toEqual({ x: { a: { b: { c: 2, d: true } } } });
        expect(G('x: {a:{&:{c:number|*1}&{d:boolean}}} & {a:{b:{c:2,d:true}}}'))
            .toEqual({ x: { a: { b: { c: 2, d: true } } } });
        expect(G('y: "Y", x: {a:{&:{c:number|*1,d:boolean}}} & {a:{b:{c:2,d:true}}}'))
            .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true } } } });
        expect(G('y: "Y", x: {a:{&:{c:number|*1,d:boolean,e:.y}}}' +
            ' & {a:{b:{c:2,d:true}}}'))
            .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Y' } } } });
        expect(G('y: *"Y"|string, x: {a:{&:{c:number|*1,d:boolean,e:.y}}}' +
            ' & {a:{b:{c:2,d:true}}}'))
            .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Y' } } } });
        expect(G('y: *"Y"|string, x: {a:{&:{c:number|*1,d:boolean,e:.y}}}' +
            ' & {a:{b:{c:2,d:true,e:"Q"}}}'))
            .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Q' } } } });
        expect(G('y: "Y", x: {a:{&:{c:number|*1}&{d:boolean}}} & {a:{b:{c:2,d:true}}}'))
            .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true } } } });
        expect(G('y: "Y", x: {a:{&:{c:number|*1}&{d:boolean,e:.y}}}' +
            ' & {a:{b:{c:2,d:true}}}'))
            .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Y' } } } });
        expect(G('y: *"Y"|string, x: {a:{&:{c:number|*1}&{d:boolean,e:.y}}}' +
            ' & {a:{b:{c:2,d:true}}}'))
            .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Y' } } } });
        expect(G('y: *"Y"|string, x: {a:{&:{c:number|*1}&{d:boolean,e:.y}}}' +
            ' & {a:{b:{c:2,d:true,e:"Q"}}}'))
            .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Q' } } } });
        expect(G(`
  a: *true | boolean
  b: .a
  c: .a & false
  d: { x: .a }
  d: { x: false }
  e: { x: .a }
  f: { &: *true | boolean }
  f: { y: false }
  g: .f
  h: { &: .a }
  h: { z: false }
  `)).toEqual({
            a: true,
            b: true,
            c: false,
            d: { x: false },
            e: { x: true },
            f: { y: false },
            g: { y: false },
            h: { z: false }
        });
        expect(G(`
  x: y: { m: n: *false | boolean }
  a: b: { &: .x.y }
  a: b: { c: {} }
  a: b: d: {}
  a: b: e: m: n: true
  `)).toEqual({
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
function print(o, t) {
    if (null != t) {
        console.log(t);
    }
    console.dir(o, { depth: null });
}
function makeCtx(r) {
    return new unify_1.Context({ root: r || new MapVal_1.MapVal({}) });
}
//# sourceMappingURL=val.test.js.map