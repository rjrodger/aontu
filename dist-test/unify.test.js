"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const expect_1 = require("./expect");
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
        (0, expect_1.expect)(G('a')).equal('a');
        (0, expect_1.expect)(G('a&a')).equal('a');
        (0, expect_1.expect)(G('a|a')).equal('a');
        (0, expect_1.expect)(G('(a)')).equal('a');
        (0, expect_1.expect)(G('(a&a)')).equal('a');
        (0, expect_1.expect)(G('(a|a)')).equal('a');
        (0, expect_1.expect)(G('(a)&a')).equal('a');
        (0, expect_1.expect)(G('(a&a)&a')).equal('a');
        (0, expect_1.expect)(G('(a|a)&a')).equal('a');
        (0, expect_1.expect)(G('a&(a)')).equal('a');
        (0, expect_1.expect)(G('a&(a&a)')).equal('a');
        (0, expect_1.expect)(G('a&(a|a)')).equal('a');
        (0, expect_1.expect)(G('a&(a)&a')).equal('a');
        (0, expect_1.expect)(G('a&(a&a)&a')).equal('a');
        (0, expect_1.expect)(G('a&(a|a)&a')).equal('a');
        (0, expect_1.expect)(G('a&a')).equal('a');
        (0, expect_1.expect)(G('a&a&a')).equal('a');
        (0, expect_1.expect)(G('a|a&a')).equal('a');
        (0, expect_1.expect)(G('a&a|a')).equal('a');
        (0, expect_1.expect)(G('a&a&a&a')).equal('a');
        (0, expect_1.expect)(G('a&a|a&a')).equal('a');
        (0, expect_1.expect)(G('(a)|a')).equal('a');
        (0, expect_1.expect)(G('(a&a)|a')).equal('a');
        (0, expect_1.expect)(G('(a|a)|a')).equal('a');
        (0, expect_1.expect)(G('a|(a)')).equal('a');
        (0, expect_1.expect)(G('a|(a&a)')).equal('a');
        (0, expect_1.expect)(G('a|(a|a)')).equal('a');
        (0, expect_1.expect)(G('a|(a)|a')).equal('a');
        (0, expect_1.expect)(G('a|(a&a)|a')).equal('a');
        (0, expect_1.expect)(G('a|(a|a)|a')).equal('a');
        (0, expect_1.expect)(G('a|a')).equal('a');
        (0, expect_1.expect)(G('a&a|a')).equal('a');
        (0, expect_1.expect)(G('a|a|a')).equal('a');
        (0, expect_1.expect)(G('a|a&a')).equal('a');
        (0, expect_1.expect)(G('a|a|a|a')).equal('a');
        (0, expect_1.expect)(G('a|a&a|a')).equal('a');
        (0, expect_1.expect)(G('x:a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a&a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a|a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:(a)')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:(a&a)')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:(a|a)')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:(a)&a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:(a&a)&a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:(a|a)&a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a&(a)')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a&(a&a)')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a&(a|a)')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a&(a)&a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a&(a&a)&a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a&(a|a)&a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a&a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a&a&a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a|a&a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a&a|a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a&a&a&a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a&a|a&a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:(a)|a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:(a&a)|a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:(a|a)|a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a|(a)')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a|(a&a)')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a|(a|a)')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a|(a)|a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a|(a&a)|a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a|(a|a)|a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a|a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a&a|a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a|a|a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a|a&a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a|a|a|a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('x:a|a&a|a')).equal({ x: 'a' });
        (0, expect_1.expect)(G('[a]')).equal(['a']);
        (0, expect_1.expect)(G('[a&a]')).equal(['a']);
        (0, expect_1.expect)(G('[a|a]')).equal(['a']);
        (0, expect_1.expect)(G('[(a)]')).equal(['a']);
        (0, expect_1.expect)(G('[(a&a)]')).equal(['a']);
        (0, expect_1.expect)(G('[(a|a)]')).equal(['a']);
        (0, expect_1.expect)(G('[(a)&a]')).equal(['a']);
        (0, expect_1.expect)(G('[(a&a)&a]')).equal(['a']);
        (0, expect_1.expect)(G('[(a|a)&a]')).equal(['a']);
        (0, expect_1.expect)(G('[a&(a)]')).equal(['a']);
        (0, expect_1.expect)(G('[a&(a&a)]')).equal(['a']);
        (0, expect_1.expect)(G('[a&(a|a)]')).equal(['a']);
        (0, expect_1.expect)(G('[a&(a)&a]')).equal(['a']);
        (0, expect_1.expect)(G('[a&(a&a)&a]')).equal(['a']);
        (0, expect_1.expect)(G('[a&(a|a)&a]')).equal(['a']);
        (0, expect_1.expect)(G('[a&a]')).equal(['a']);
        (0, expect_1.expect)(G('[a&a&a]')).equal(['a']);
        (0, expect_1.expect)(G('[a|a&a]')).equal(['a']);
        (0, expect_1.expect)(G('[a&a|a]')).equal(['a']);
        (0, expect_1.expect)(G('[a&a&a&a]')).equal(['a']);
        (0, expect_1.expect)(G('[a&a|a&a]')).equal(['a']);
        (0, expect_1.expect)(G('[(a)|a]')).equal(['a']);
        (0, expect_1.expect)(G('[(a&a)|a]')).equal(['a']);
        (0, expect_1.expect)(G('[(a|a)|a]')).equal(['a']);
        (0, expect_1.expect)(G('[a|(a)]')).equal(['a']);
        (0, expect_1.expect)(G('[a|(a&a)]')).equal(['a']);
        (0, expect_1.expect)(G('[a|(a|a)]')).equal(['a']);
        (0, expect_1.expect)(G('[a|(a)|a]')).equal(['a']);
        (0, expect_1.expect)(G('[a|(a&a)|a]')).equal(['a']);
        (0, expect_1.expect)(G('[a|(a|a)|a]')).equal(['a']);
        (0, expect_1.expect)(G('[a|a]')).equal(['a']);
        (0, expect_1.expect)(G('[a&a|a]')).equal(['a']);
        (0, expect_1.expect)(G('[a|a|a]')).equal(['a']);
        (0, expect_1.expect)(G('[a|a&a]')).equal(['a']);
        (0, expect_1.expect)(G('[a|a|a|a]')).equal(['a']);
        (0, expect_1.expect)(G('[a|a&a|a]')).equal(['a']);
    });
    (0, node_test_1.test)('condis-different', () => {
        (0, expect_1.expect)(G('a')).equal('a');
        (0, expect_1.expect)(N('a|b')).equal('"a"|"b"');
        (0, expect_1.expect)(() => G('a|b')).throws(/aontu\/scalar/);
        (0, expect_1.expect)(N('a&b')).equal('nil');
        (0, expect_1.expect)(() => G('a&b')).throws(/aontu\/scalar/);
        (0, expect_1.expect)(G('x:a')).equal({ x: 'a' });
        (0, expect_1.expect)(N('x:a|b')).equal('{"x":"a"|"b"}');
        (0, expect_1.expect)(() => G('x:a|b')).throws(/aontu\/scalar/);
        (0, expect_1.expect)(N('x:a&b')).equal('{"x":nil}');
        (0, expect_1.expect)(() => G('x:a&b')).throws(/aontu\/scalar/);
        (0, expect_1.expect)(G('(a|b)&a')).equal('a');
        (0, expect_1.expect)(G('a&(a|b)')).equal('a');
        (0, expect_1.expect)(G('a&(a|b)&a')).equal('a');
        (0, expect_1.expect)(G('a|b&a')).equal('a');
        (0, expect_1.expect)(G('a|(b&a)')).equal('a');
        (0, expect_1.expect)(G('(a|b)&a)')).equal('a');
        (0, expect_1.expect)(N('a&a|b')).equal('"a"|"b"');
        (0, expect_1.expect)(() => G('a&a|b')).throws(/aontu\/scalar/);
        (0, expect_1.expect)(G('a&a|b&a')).equal('a');
        (0, expect_1.expect)(G('(a&a)|(b&a)')).equal('a');
        (0, expect_1.expect)(G('(a&a)|nil')).equal('a');
        (0, expect_1.expect)(G('a&a|nil')).equal('a');
        (0, expect_1.expect)(G('a|(b&a)')).equal('a');
        (0, expect_1.expect)(G('(a|b)&a')).equal('a');
        (0, expect_1.expect)(G('(a|b)&b')).equal('b');
        (0, expect_1.expect)(N('(a|b)&c')).equal('nil');
        (0, expect_1.expect)(() => G('(a|b)&c')).throws(/aontu\//);
    });
    (0, node_test_1.test)('pref', () => {
        (0, expect_1.expect)(G('*a|string')).equal('a');
        (0, expect_1.expect)(G('*a|b')).equal('a');
        (0, expect_1.expect)(G('**1|*b')).equal('b');
        (0, expect_1.expect)(G('***1|**2|*3')).equal(3);
        (0, expect_1.expect)(G('***a|**b|*c')).equal('c');
        (0, expect_1.expect)(G('***1|**b|*true')).equal(true);
        (0, expect_1.expect)(G('***1|*true')).equal(true);
        (0, expect_1.expect)(G('x:*a')).equal({ x: 'a' });
        // expect(G('x:*a x:b')).equal({ x: 'b' })
        (0, expect_1.expect)(G('x:*{a:1}')).equal({ x: { a: 1 } });
        (0, expect_1.expect)(G('x:*{a:1} x:{a:2}')).equal({ x: { a: 2 } });
        (0, expect_1.expect)(G('x:*{a:1}|{a:number}')).equal({ x: { a: 1 } });
        (0, expect_1.expect)(G('x:*{a:1}|{a:number} x:{a:2}')).equal({ x: { a: 2 } });
    });
    (0, node_test_1.test)('spread-pref-order-independent', () => {
        // Spread with pref should be order independent.
        // When empty map {} appears before the pref value *K, the spread constraint
        // should still resolve correctly via the pref default.
        // Working order: pref before empty map
        (0, expect_1.expect)(G('a:&:k:string a:x:k:*K a:x:{}')).equal({ a: { x: { k: 'K' } } });
        // Failing order (bug): empty map before pref
        (0, expect_1.expect)(G('a:&:k:string a:x:{} a:x:k:*K')).equal({ a: { x: { k: 'K' } } });
        // Additional order independence checks
        (0, expect_1.expect)(G('a:x:{} a:&:k:string a:x:k:*K')).equal({ a: { x: { k: 'K' } } });
        (0, expect_1.expect)(G('a:x:k:*K a:&:k:string a:x:{}')).equal({ a: { x: { k: 'K' } } });
        // Verify concrete values still work in both orders with spread
        (0, expect_1.expect)(G('a:&:k:string a:x:{} a:x:k:K')).equal({ a: { x: { k: 'K' } } });
        (0, expect_1.expect)(G('a:&:k:string a:x:k:K a:x:{}')).equal({ a: { x: { k: 'K' } } });
    });
    (0, node_test_1.test)('spread-pref-ref-order-independent', () => {
        // PrefVal wrapping RefVal should resolve against spread constraints.
        // The PrefVal superpeg must be recomputed after the ref resolves.
        // Pref+ref with spread, no empty map
        (0, expect_1.expect)(G('v:K a:&:k:string a:x:k:*$.v')).equal({ v: 'K', a: { x: { k: 'K' } } });
        // Pref+ref with spread and empty map, both orders
        (0, expect_1.expect)(G('v:K a:&:k:string a:x:{} a:x:k:*$.v')).equal({ v: 'K', a: { x: { k: 'K' } } });
        (0, expect_1.expect)(G('v:K a:&:k:string a:x:k:*$.v a:x:{}')).equal({ v: 'K', a: { x: { k: 'K' } } });
        // Forward ref (target defined after usage)
        (0, expect_1.expect)(G('a:&:k:string a:x:{} a:x:k:*$.v v:K')).equal({ v: 'K', a: { x: { k: 'K' } } });
    });
    (0, node_test_1.test)('multi-pass-ref-chain', () => {
        // Paths are resolved in preprocessing, so chains resolve in 1 pass.
        // 2-chain
        (0, expect_1.expect)(G('a:$.b b:1')).equal({ a: 1, b: 1 });
        // 4-chain
        (0, expect_1.expect)(G('a:$.b b:$.c c:$.d d:1')).equal({ a: 1, b: 1, c: 1, d: 1 });
        // 8-chain
        (0, expect_1.expect)(G('a:$.b b:$.c c:$.d d:$.e e:$.f f:$.g g:$.h h:1')).equal({ a: 1, b: 1, c: 1, d: 1, e: 1, f: 1, g: 1, h: 1 });
        // Paths resolved in preprocessing — only 1 fixpoint pass needed
        const u8 = new unify_1.Unify('a:$.b b:$.c c:$.d d:$.e e:$.f f:$.g g:$.h h:1', lang);
        (0, expect_1.expect)(u8.cc).equal(1);
        (0, expect_1.expect)(u8.res.done).equal(true);
        // 10-chain
        (0, expect_1.expect)(G('a:$.b b:$.c c:$.d d:$.e e:$.f f:$.g g:$.h h:$.i i:$.j j:1')).equal({ a: 1, b: 1, c: 1, d: 1, e: 1, f: 1, g: 1, h: 1, i: 1, j: 1 });
    });
    (0, node_test_1.test)('multi-pass-nested-ref-chain', () => {
        // Paths resolved in preprocessing — nested chains also resolve in 1 pass.
        // 4-chain through nested paths
        (0, expect_1.expect)(G('a:{v:$.b.v} b:{v:$.c.v} c:{v:$.d.v} d:{v:1}')).equal({ a: { v: 1 }, b: { v: 1 }, c: { v: 1 }, d: { v: 1 } });
        // 8-chain through nested paths
        const src8 = [
            'a:{v:$.b.v}', 'b:{v:$.c.v}', 'c:{v:$.d.v}', 'd:{v:$.e.v}',
            'e:{v:$.f.v}', 'f:{v:$.g.v}', 'g:{v:$.h.v}', 'h:{v:1}',
        ].join(' ');
        (0, expect_1.expect)(G(src8)).equal({
            a: { v: 1 }, b: { v: 1 }, c: { v: 1 }, d: { v: 1 },
            e: { v: 1 }, f: { v: 1 }, g: { v: 1 }, h: { v: 1 },
        });
        const u8 = new unify_1.Unify(src8, lang);
        (0, expect_1.expect)(u8.cc).equal(1);
        (0, expect_1.expect)(u8.res.done).equal(true);
    });
    (0, node_test_1.test)('multi-pass-ref-with-spread', () => {
        // Ref chain feeding into a spread constraint.
        // The spread can only apply after the ref chain resolves.
        // 6-ref chain + spread with type constraint (verify via canon)
        // Paths resolved in preprocessing — ref chains resolve before fixpoint loop
        const u6 = new unify_1.Unify('t:$.u u:$.v v:$.w w:$.x x:$.y y:string m:{&:$.t,a:A,b:B}', lang);
        (0, expect_1.expect)(u6.cc).equal(1);
        (0, expect_1.expect)(u6.res.done).equal(true);
        // 4-ref chain + spread with concrete value
        (0, expect_1.expect)(G('t:$.u u:$.v v:$.w w:1 m:{x:$.t}')).equal({ t: 1, u: 1, v: 1, w: 1, m: { x: 1 } });
        const u4 = new unify_1.Unify('t:$.u u:$.v v:$.w w:1 m:{x:$.t}', lang);
        (0, expect_1.expect)(u4.cc).equal(1);
        (0, expect_1.expect)(u4.res.done).equal(true);
    });
});
//# sourceMappingURL=unify.test.js.map