"use strict";
/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const lang_1 = require("../lib/lang");
const unify_1 = require("../lib/unify");
const val_1 = require("../lib/val");
const MapVal_1 = require("../lib/val/MapVal");
const lang = new lang_1.Lang();
const PL = lang.parse.bind(lang);
const P = (x, ctx) => PL(x, ctx);
const D = (x) => console.dir(x, { depth: null });
const UC = (s, r) => (r = P(s)).unify(val_1.TOP, makeCtx(r)).canon;
const G = (x, ctx) => new unify_1.Unify(x, lang).res.gen(ctx);
const V = (x) => console.dir(x, { depth: null });
describe('val-disjunct', function () {
    it('basic', () => {
        let u0 = UC('a:{x:1}|{y:2},a:{z:3}');
        expect(u0).toEqual('{"a":{"x":1,"z":3}|{"y":2,"z":3}}');
        let u1 = UC('a:{x:1}|{y:2},a:{z:3}|{q:4}');
        expect(u1)
            .toEqual('{"a":{"x":1,"z":3}|{"y":2,"z":3}|{"x":1,"q":4}|{"y":2,"q":4}}');
        let u2 = UC('a:*1|number,a:*2|number');
        expect(u2).toEqual('{"a":*2|*1|number}');
        let u3 = UC('*1|number & *2|number');
        expect(u3).toEqual('*2|*1|number');
        let g0 = G('{&:{x:*1|number},a:{},b:{x:2}}');
        expect(g0).toEqual({ a: { x: 1 }, b: { x: 2 } });
        let g1 = G('&:{x:*1|number},a:{},b:{x:2}');
        expect(g1).toEqual({ a: { x: 1 }, b: { x: 2 } });
    });
    it('clone', () => {
        let v0 = P('{x:1}|{y:2}|{z:3}');
        // console.log(v0.canon)
        expect(v0.canon).toEqual('({"x":1}|{"y":2})|{"z":3}');
        let v0c = v0.clone();
        expect(v0c.canon).toEqual('({"x":1}|{"y":2})|{"z":3}');
    });
});
function print(o, t) {
    if (null != t) {
        console.log(t);
    }
    console.dir(o, { depth: null });
}
function makeCtx(r) {
    return new unify_1.Context({ root: r || new MapVal_1.MapVal({ peg: {} }) });
}
//# sourceMappingURL=val-disjunct.test.js.map