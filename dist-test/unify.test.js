"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const code_1 = require("@hapi/code");
const unify_1 = require("../dist/unify");
const lang_1 = require("../dist/lang");
const __1 = require("..");
let lang = new lang_1.Lang();
const N = (x, _ctx) => new unify_1.Unify(x, lang).res.canon;
// const G = (x: string, ctx?: any) => new Unify(x, lang)
//  .res.gen(ctx || new Context({ root: new MapVal({ peg: {} }) }))
const A = new __1.Aontu();
const G = (s) => A.generate(s);
(0, node_test_1.describe)('unify', function () {
    (0, node_test_1.test)('condis-same', () => {
        (0, code_1.expect)(G('a')).equal('a');
        (0, code_1.expect)(G('a&a')).equal('a');
        (0, code_1.expect)(G('a|a')).equal('a');
        (0, code_1.expect)(G('(a)')).equal('a');
        (0, code_1.expect)(G('(a&a)')).equal('a');
        (0, code_1.expect)(G('(a|a)')).equal('a');
        (0, code_1.expect)(G('(a)&a')).equal('a');
        (0, code_1.expect)(G('(a&a)&a')).equal('a');
        (0, code_1.expect)(G('(a|a)&a')).equal('a');
        (0, code_1.expect)(G('a&(a)')).equal('a');
        (0, code_1.expect)(G('a&(a&a)')).equal('a');
        (0, code_1.expect)(G('a&(a|a)')).equal('a');
        (0, code_1.expect)(G('a&(a)&a')).equal('a');
        (0, code_1.expect)(G('a&(a&a)&a')).equal('a');
        (0, code_1.expect)(G('a&(a|a)&a')).equal('a');
        (0, code_1.expect)(G('a&a')).equal('a');
        (0, code_1.expect)(G('a&a&a')).equal('a');
        (0, code_1.expect)(G('a|a&a')).equal('a');
        (0, code_1.expect)(G('a&a|a')).equal('a');
        (0, code_1.expect)(G('a&a&a&a')).equal('a');
        (0, code_1.expect)(G('a&a|a&a')).equal('a');
        (0, code_1.expect)(G('(a)|a')).equal('a');
        (0, code_1.expect)(G('(a&a)|a')).equal('a');
        (0, code_1.expect)(G('(a|a)|a')).equal('a');
        (0, code_1.expect)(G('a|(a)')).equal('a');
        (0, code_1.expect)(G('a|(a&a)')).equal('a');
        (0, code_1.expect)(G('a|(a|a)')).equal('a');
        (0, code_1.expect)(G('a|(a)|a')).equal('a');
        (0, code_1.expect)(G('a|(a&a)|a')).equal('a');
        (0, code_1.expect)(G('a|(a|a)|a')).equal('a');
        (0, code_1.expect)(G('a|a')).equal('a');
        (0, code_1.expect)(G('a&a|a')).equal('a');
        (0, code_1.expect)(G('a|a|a')).equal('a');
        (0, code_1.expect)(G('a|a&a')).equal('a');
        (0, code_1.expect)(G('a|a|a|a')).equal('a');
        (0, code_1.expect)(G('a|a&a|a')).equal('a');
        (0, code_1.expect)(G('x:a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a&a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a|a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:(a)')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:(a&a)')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:(a|a)')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:(a)&a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:(a&a)&a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:(a|a)&a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a&(a)')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a&(a&a)')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a&(a|a)')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a&(a)&a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a&(a&a)&a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a&(a|a)&a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a&a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a&a&a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a|a&a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a&a|a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a&a&a&a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a&a|a&a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:(a)|a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:(a&a)|a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:(a|a)|a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a|(a)')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a|(a&a)')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a|(a|a)')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a|(a)|a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a|(a&a)|a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a|(a|a)|a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a|a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a&a|a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a|a|a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a|a&a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a|a|a|a')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:a|a&a|a')).equal({ x: 'a' });
        (0, code_1.expect)(G('[a]')).equal(['a']);
        (0, code_1.expect)(G('[a&a]')).equal(['a']);
        (0, code_1.expect)(G('[a|a]')).equal(['a']);
        (0, code_1.expect)(G('[(a)]')).equal(['a']);
        (0, code_1.expect)(G('[(a&a)]')).equal(['a']);
        (0, code_1.expect)(G('[(a|a)]')).equal(['a']);
        (0, code_1.expect)(G('[(a)&a]')).equal(['a']);
        (0, code_1.expect)(G('[(a&a)&a]')).equal(['a']);
        (0, code_1.expect)(G('[(a|a)&a]')).equal(['a']);
        (0, code_1.expect)(G('[a&(a)]')).equal(['a']);
        (0, code_1.expect)(G('[a&(a&a)]')).equal(['a']);
        (0, code_1.expect)(G('[a&(a|a)]')).equal(['a']);
        (0, code_1.expect)(G('[a&(a)&a]')).equal(['a']);
        (0, code_1.expect)(G('[a&(a&a)&a]')).equal(['a']);
        (0, code_1.expect)(G('[a&(a|a)&a]')).equal(['a']);
        (0, code_1.expect)(G('[a&a]')).equal(['a']);
        (0, code_1.expect)(G('[a&a&a]')).equal(['a']);
        (0, code_1.expect)(G('[a|a&a]')).equal(['a']);
        (0, code_1.expect)(G('[a&a|a]')).equal(['a']);
        (0, code_1.expect)(G('[a&a&a&a]')).equal(['a']);
        (0, code_1.expect)(G('[a&a|a&a]')).equal(['a']);
        (0, code_1.expect)(G('[(a)|a]')).equal(['a']);
        (0, code_1.expect)(G('[(a&a)|a]')).equal(['a']);
        (0, code_1.expect)(G('[(a|a)|a]')).equal(['a']);
        (0, code_1.expect)(G('[a|(a)]')).equal(['a']);
        (0, code_1.expect)(G('[a|(a&a)]')).equal(['a']);
        (0, code_1.expect)(G('[a|(a|a)]')).equal(['a']);
        (0, code_1.expect)(G('[a|(a)|a]')).equal(['a']);
        (0, code_1.expect)(G('[a|(a&a)|a]')).equal(['a']);
        (0, code_1.expect)(G('[a|(a|a)|a]')).equal(['a']);
        (0, code_1.expect)(G('[a|a]')).equal(['a']);
        (0, code_1.expect)(G('[a&a|a]')).equal(['a']);
        (0, code_1.expect)(G('[a|a|a]')).equal(['a']);
        (0, code_1.expect)(G('[a|a&a]')).equal(['a']);
        (0, code_1.expect)(G('[a|a|a|a]')).equal(['a']);
        (0, code_1.expect)(G('[a|a&a|a]')).equal(['a']);
    });
    (0, node_test_1.test)('condis-different', () => {
        (0, code_1.expect)(G('a')).equal('a');
        (0, code_1.expect)(N('a|b')).equal('"a"|"b"');
        (0, code_1.expect)(() => G('a|b')).throws(/aontu\/scalar/);
        (0, code_1.expect)(N('a&b')).equal('nil');
        (0, code_1.expect)(() => G('a&b')).throws(/aontu\/scalar/);
        (0, code_1.expect)(G('x:a')).equal({ x: 'a' });
        (0, code_1.expect)(N('x:a|b')).equal('{"x":"a"|"b"}');
        (0, code_1.expect)(() => G('x:a|b')).throws(/aontu\/scalar/);
        (0, code_1.expect)(N('x:a&b')).equal('{"x":nil}');
        (0, code_1.expect)(() => G('x:a&b')).throws(/aontu\/scalar/);
        (0, code_1.expect)(G('(a|b)&a')).equal('a');
        (0, code_1.expect)(G('a&(a|b)')).equal('a');
        (0, code_1.expect)(G('a&(a|b)&a')).equal('a');
        (0, code_1.expect)(G('a|b&a')).equal('a');
        (0, code_1.expect)(G('a|(b&a)')).equal('a');
        (0, code_1.expect)(G('(a|b)&a)')).equal('a');
        (0, code_1.expect)(N('a&a|b')).equal('"a"|"b"');
        (0, code_1.expect)(() => G('a&a|b')).throws(/aontu\/scalar/);
        (0, code_1.expect)(G('a&a|b&a')).equal('a');
        (0, code_1.expect)(G('(a&a)|(b&a)')).equal('a');
        (0, code_1.expect)(G('(a&a)|nil')).equal('a');
        (0, code_1.expect)(G('a&a|nil')).equal('a');
        (0, code_1.expect)(G('a|(b&a)')).equal('a');
        (0, code_1.expect)(G('(a|b)&a')).equal('a');
        (0, code_1.expect)(G('(a|b)&b')).equal('b');
        (0, code_1.expect)(N('(a|b)&c')).equal('nil');
        (0, code_1.expect)(() => G('(a|b)&c')).throws(/aontu\//);
    });
    (0, node_test_1.test)('pref', () => {
        (0, code_1.expect)(G('*a|string')).equal('a');
        (0, code_1.expect)(G('*a|b')).equal('a');
        (0, code_1.expect)(G('**1|*b')).equal('b');
        (0, code_1.expect)(G('***1|**2|*3')).equal(3);
        (0, code_1.expect)(G('***a|**b|*c')).equal('c');
        (0, code_1.expect)(G('***1|**b|*true')).equal(true);
        (0, code_1.expect)(G('***1|*true')).equal(true);
        (0, code_1.expect)(G('x:*a')).equal({ x: 'a' });
        // expect(G('x:*a x:b')).equal({ x: 'b' })
        (0, code_1.expect)(G('x:*{a:1}')).equal({ x: { a: 1 } });
        (0, code_1.expect)(G('x:*{a:1} x:{a:2}')).equal({ x: { a: 2 } });
        (0, code_1.expect)(G('x:*{a:1}|{a:number}')).equal({ x: { a: 1 } });
        (0, code_1.expect)(G('x:*{a:1}|{a:number} x:{a:2}')).equal({ x: { a: 2 } });
    });
    (0, node_test_1.test)('spread-pref-order-independent', () => {
        // Spread with pref should be order independent.
        // When empty map {} appears before the pref value *K, the spread constraint
        // should still resolve correctly via the pref default.
        // Working order: pref before empty map
        (0, code_1.expect)(G('a:&:k:string a:x:k:*K a:x:{}')).equal({ a: { x: { k: 'K' } } });
        // Failing order (bug): empty map before pref
        (0, code_1.expect)(G('a:&:k:string a:x:{} a:x:k:*K')).equal({ a: { x: { k: 'K' } } });
        // Additional order independence checks
        (0, code_1.expect)(G('a:x:{} a:&:k:string a:x:k:*K')).equal({ a: { x: { k: 'K' } } });
        (0, code_1.expect)(G('a:x:k:*K a:&:k:string a:x:{}')).equal({ a: { x: { k: 'K' } } });
        // Verify concrete values still work in both orders with spread
        (0, code_1.expect)(G('a:&:k:string a:x:{} a:x:k:K')).equal({ a: { x: { k: 'K' } } });
        (0, code_1.expect)(G('a:&:k:string a:x:k:K a:x:{}')).equal({ a: { x: { k: 'K' } } });
    });
    (0, node_test_1.test)('spread-pref-ref-order-independent', () => {
        // PrefVal wrapping RefVal should resolve against spread constraints.
        // The PrefVal superpeg must be recomputed after the ref resolves.
        // Pref+ref with spread, no empty map
        (0, code_1.expect)(G('v:K a:&:k:string a:x:k:*$.v')).equal({ v: 'K', a: { x: { k: 'K' } } });
        // Pref+ref with spread and empty map, both orders
        (0, code_1.expect)(G('v:K a:&:k:string a:x:{} a:x:k:*$.v')).equal({ v: 'K', a: { x: { k: 'K' } } });
        (0, code_1.expect)(G('v:K a:&:k:string a:x:k:*$.v a:x:{}')).equal({ v: 'K', a: { x: { k: 'K' } } });
        // Forward ref (target defined after usage)
        (0, code_1.expect)(G('a:&:k:string a:x:{} a:x:k:*$.v v:K')).equal({ v: 'K', a: { x: { k: 'K' } } });
    });
});
//# sourceMappingURL=unify.test.js.map