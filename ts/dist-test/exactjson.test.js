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
/*
 * D9 -- the generate contract, from the TypeScript side.
 *
 * Two things are pinned here that no shared TSV row can reach:
 *
 *   1. THE RUNTIME TYPES generate() returns. Byte-exact serialisation
 *      cannot see them: an integral bigdecimal (`0d1e3`) and a
 *      biginteger serialise to DIFFERENT text, but a biginteger and an
 *      ordinary integer serialise to the SAME text while generate()
 *      returned the wrong object. Canon pins the AST kind, the `gens`
 *      rows pin the bytes, and only these assertions pin the object.
 *      go/generate_test.go is the mirror on the Go side.
 *
 *   2. THE EMITTER ITSELF -- `exactJSON`, the public export the CLI and
 *      the spec runner's `gens` mode both go through. Its Go
 *      counterpart is `json.Encoder` with `SetEscapeHTML(false)` (see
 *      specGens in go/spec_test.go), so the anchor test below asserts
 *      that on everything WITHOUT an exact leaf the emitter is
 *      byte-identical to JSON.stringify -- which is what the `gens`
 *      mode already settled the two ports on.
 */
const node_test_1 = require("node:test");
const Assert = __importStar(require("node:assert"));
const aontu_1 = require("../dist/aontu");
const gen = (src) => new aontu_1.Aontu().generate(src);
(0, node_test_1.describe)('generate-native-types', () => {
    (0, node_test_1.test)('a-biginteger-generates-as-a-native-bigint', () => {
        const out = gen('x:0d5');
        Assert.equal(typeof out.x, 'bigint');
        Assert.equal(out.x, 5n);
        // The case the bytes cannot distinguish: an ordinary integer and a
        // biginteger of the same value both serialise as `5`, so only the
        // runtime type separates them.
        Assert.equal(typeof gen('x:5').x, 'number');
        Assert.equal((0, aontu_1.exactJSON)(gen('x:5')), (0, aontu_1.exactJSON)(out));
        // Exact past binary64 -- the reason the leaf exists. As a plain
        // `number` this would have been 9007199254740992.
        const big = gen('x:0d9007199254740993');
        Assert.equal(typeof big.x, 'bigint');
        Assert.equal(big.x, 9007199254740993n);
        Assert.equal(typeof gen('x:-0d5').x, 'bigint');
        Assert.equal(gen('x:-0d5').x, -5n);
    });
    (0, node_test_1.test)('a-bigdecimal-generates-as-a-Decimal', () => {
        const out = gen('x:0d0.1');
        Assert.ok(out.x instanceof aontu_1.Decimal);
        Assert.ok(out.x.equals(aontu_1.Decimal.fromString('0.1')));
        // An INTEGRAL bigdecimal is still a Decimal, never a bigint and
        // never a number: `0d1e3` is a bigdecimal by source (D3) and the
        // leaves are disjoint (D2).
        const integral = gen('x:0d1e3');
        Assert.ok(integral.x instanceof aontu_1.Decimal);
        Assert.equal(typeof integral.x, 'object');
        Assert.equal(integral.x.toString(), '1000.0');
        // Exact arithmetic reaches generate() as a Decimal too.
        const sum = gen('x:0d0.1+0d0.2');
        Assert.ok(sum.x instanceof aontu_1.Decimal);
        Assert.equal(sum.x.toString(), '0.3');
    });
    (0, node_test_1.test)('an-integer-past-the-safe-range-generates-as-a-bigint', () => {
        // Issue #21's generate half. Go's integer leaf is an int64, exact
        // across the whole window; TypeScript's is a double, so above the
        // safe-integer range a `number` no longer renders its own digits --
        // JSON.stringify(2**60) is 1152921504606847000, a DIFFERENT integer.
        // Handing the emitter a bigint is what lets it write the true value,
        // and the emitter cannot work it out for itself: by then a
        // float-kind 1e21 (whose `1e+21` shortest form IS correct, in both
        // ports) looks like just another number.
        const big = gen('x:1152921504606846976');
        Assert.equal(typeof big.x, 'bigint');
        Assert.equal(big.x, 1152921504606846976n);
        Assert.equal((0, aontu_1.exactJSON)(big), '{"x":1152921504606846976}');
        Assert.equal(typeof gen('x:-1152921504606846976').x, 'bigint');
        Assert.equal(gen('x:-1152921504606846976').x, -1152921504606846976n);
        // Exact integer arithmetic (D6) is the second route into the window.
        const sum = gen('x:576460752303423488+576460752303423488');
        Assert.equal(typeof sum.x, 'bigint');
        Assert.equal(sum.x, 1152921504606846976n);
        // THE LINE IS Number.isSafeInteger, so it falls between 2^53-1 and
        // 2^53. Both serialise to the same bytes, which is exactly why the
        // `gens` rows cannot see this boundary and this test has to.
        Assert.equal(typeof gen('x:9007199254740991').x, 'number');
        Assert.equal(typeof gen('x:9007199254740992').x, 'bigint');
        Assert.equal((0, aontu_1.exactJSON)(gen('x:9007199254740992')), '{"x":9007199254740992}');
        // A float-kind value stays a number at any magnitude: its shortest
        // form is the right answer and the exact digits would be wrong.
        Assert.equal(typeof gen('x:1e21').x, 'number');
        Assert.equal((0, aontu_1.exactJSON)(gen('x:1e21')), '{"x":1e+21}');
        // 10^20 is exact, outside int64, and so number kind by R1 -- the
        // control that shows the cut is on KIND, not on magnitude.
        Assert.equal(typeof gen('x:100000000000000000000').x, 'number');
        // An integer-kind bigint is still not a biginteger: the leaves stay
        // disjoint (D2), and only canon can tell them apart.
        Assert.equal(new aontu_1.Aontu().unify('x:1152921504606846976').canon, '{"x":1152921504606846976}');
        Assert.equal(new aontu_1.Aontu().unify('x:0d1152921504606846976').canon, '{"x":0d1152921504606846976}');
    });
    (0, node_test_1.test)('the-ordinary-leaves-are-untouched', () => {
        // A 0d-free document generates exactly what it always did.
        const out = gen('a:1 b:1.5 c:x d:true e:null f:[1,2] g:{h:1}');
        Assert.equal(typeof out.a, 'number');
        Assert.equal(typeof out.b, 'number');
        Assert.equal(typeof out.c, 'string');
        Assert.equal(typeof out.d, 'boolean');
        Assert.equal(out.e, null);
        Assert.ok(Array.isArray(out.f));
        Assert.equal(typeof out.f[0], 'number');
        Assert.equal(typeof out.g, 'object');
    });
    (0, node_test_1.test)('exact-types-survive-nesting', () => {
        const out = gen('x:{y:0d7} z:[0d1,0d0.5]');
        Assert.equal(typeof out.x.y, 'bigint');
        Assert.equal(typeof out.z[0], 'bigint');
        Assert.ok(out.z[1] instanceof aontu_1.Decimal);
    });
    (0, node_test_1.test)('JSON-stringify-cannot-serialise-the-result', () => {
        // The reason exactJSON exists, asserted rather than asserted about:
        // the standard serialiser THROWS on the biginteger leaf...
        Assert.throws(() => JSON.stringify(gen('x:0d5')), TypeError);
        // ...and silently mangles the bigdecimal into an object shape (and
        // then throws on the bigint coefficient inside it).
        Assert.throws(() => JSON.stringify(gen('x:0d0.1')), TypeError);
    });
});
(0, node_test_1.describe)('exactjson', () => {
    (0, node_test_1.test)('writes-exact-digits-as-raw-json-numbers', () => {
        Assert.equal((0, aontu_1.exactJSON)(gen('x:0d5')), '{"x":5}');
        Assert.equal((0, aontu_1.exactJSON)(gen('x:-0d5')), '{"x":-5}');
        Assert.equal((0, aontu_1.exactJSON)(gen('x:0d123456789012345678901234567890')), '{"x":123456789012345678901234567890}');
        Assert.equal((0, aontu_1.exactJSON)(gen('x:0d9007199254740993')), '{"x":9007199254740993}');
        // Plain digits, no `0d` marker -- that is canon's business, not
        // JSON's -- but an integral bigdecimal keeps its `.0` so the JSON
        // still shows a decimal.
        Assert.equal((0, aontu_1.exactJSON)(gen('x:0d0.1')), '{"x":0.1}');
        Assert.equal((0, aontu_1.exactJSON)(gen('x:0d1e3')), '{"x":1000.0}');
        Assert.equal((0, aontu_1.exactJSON)(gen('x:-0d1.5')), '{"x":-1.5}');
        Assert.equal((0, aontu_1.exactJSON)(gen('x:[0d1,0d2]')), '{"x":[1,2]}');
        Assert.equal((0, aontu_1.exactJSON)(gen('x:{y:0d7}')), '{"x":{"y":7}}');
    });
    (0, node_test_1.test)('is-JSON-stringify-byte-for-byte-without-the-exact-leaves', () => {
        // The Go-parity anchor. Go's encoder (HTML escaping OFF) was
        // aligned with JSON.stringify when the `gens` mode landed, so
        // agreeing with JSON.stringify here is how this emitter stays
        // aligned with Go for everything the exact leaves did not add.
        // Control characters, written by code point so the source file
        // carries no invisible bytes: NUL, backspace, formfeed, escape,
        // unit separator. JS and Go both shorthand \b and \f and both
        // write \u00xx for the rest.
        const CONTROLS = String.fromCharCode(0, 8, 12, 27, 31);
        const values = [
            null, true, false, 0, -0, 1, 1.5, 1e21, 1e-7, 1e20, -3,
            '', 'x', 'x y', 'a"b', 'a\\b', 'a\nb\tc', CONTROLS,
            '<b>&</b>', 'café 中文 😀',
            [], {}, [1, 'a', null], { a: 1, b: [2, { c: 'd' }] },
            { '': 1 }, [[[]]], { a: {} }, { a: [] },
        ];
        for (const v of values) {
            for (const indent of [undefined, 0, 2, 4, '\t', '..']) {
                Assert.equal((0, aontu_1.exactJSON)(v, indent), JSON.stringify(v, null, indent), 'mismatch for ' + JSON.stringify(v) + ' @ ' + indent);
            }
        }
    });
    (0, node_test_1.test)('indent-is-the-only-difference-between-cli-and-gens', () => {
        const out = gen('x:0d5 y:[0d1,2]');
        Assert.equal((0, aontu_1.exactJSON)(out), '{"x":5,"y":[1,2]}');
        Assert.equal((0, aontu_1.exactJSON)(out, 2), [
            '{',
            '  "x": 5,',
            '  "y": [',
            '    1,',
            '    2',
            '  ]',
            '}',
        ].join('\n'));
        // JSON.stringify's `space` semantics: a string indent, and a number
        // clamped to ten spaces.
        Assert.equal((0, aontu_1.exactJSON)({ a: 1 }, '\t'), '{\n\t"a": 1\n}');
        Assert.equal((0, aontu_1.exactJSON)({ a: 1 }, 99), '{\n' + ' '.repeat(10) + '"a": 1\n}');
        Assert.equal((0, aontu_1.exactJSON)({ a: 1 }, 0), '{"a":1}');
        // Empty containers stay on one line, indent or not.
        Assert.equal((0, aontu_1.exactJSON)({ a: {}, b: [] }, 2), '{\n  "a": {},\n  "b": []\n}');
    });
    (0, node_test_1.test)('escapes-line-and-paragraph-separators', () => {
        // The one place JS and Go's encoder disagree by default: Go escapes
        // U+2028/U+2029, JS leaves them literal. Byte parity wins, and the
        // escaped form is still legal JSON that decodes to the same string.
        const LS = String.fromCharCode(0x2028);
        const PS = String.fromCharCode(0x2029);
        Assert.equal((0, aontu_1.exactJSON)({ a: 'x' + LS + 'y' }), '{"a":"x\\u2028y"}');
        Assert.equal((0, aontu_1.exactJSON)({ a: 'x' + PS + 'y' }), '{"a":"x\\u2029y"}');
        Assert.equal((0, aontu_1.exactJSON)([LS + PS]), '["\\u2028\\u2029"]');
        Assert.equal(JSON.parse((0, aontu_1.exactJSON)({ a: LS })).a, LS);
        // A key is escaped by the same path as a value.
        Assert.equal((0, aontu_1.exactJSON)({ ['k' + LS]: 1 }), '{"k\\u2028":1}');
        // HTML stays literal, exactly as the gens mode settled.
        Assert.equal((0, aontu_1.exactJSON)({ a: '<b>&</b>' }), '{"a":"<b>&</b>"}');
    });
    (0, node_test_1.test)('handles-the-values-JSON-stringify-would-drop', () => {
        // Unlike JSON.stringify this always returns a string, so a caller
        // never has to test for `undefined` before writing the output.
        Assert.equal((0, aontu_1.exactJSON)(undefined), 'null');
        Assert.equal((0, aontu_1.exactJSON)(5n), '5');
        Assert.equal((0, aontu_1.exactJSON)(new aontu_1.Decimal(15n, 1)), '1.5');
        // Non-finite numbers have no JSON form; `null` matches
        // JSON.stringify (and R2 keeps -0 out of generated output anyway).
        Assert.equal((0, aontu_1.exactJSON)({ a: NaN, b: Infinity }), '{"a":null,"b":null}');
        // In an object an undefined member is dropped, in a list it is null.
        Assert.equal((0, aontu_1.exactJSON)({ a: undefined, b: 1 }), '{"b":1}');
        Assert.equal((0, aontu_1.exactJSON)([undefined, 1]), '[null,1]');
    });
    (0, node_test_1.test)('refuses-a-cycle-instead-of-looping-forever', () => {
        const cyclic = { a: 1 };
        cyclic.self = cyclic;
        Assert.throws(() => (0, aontu_1.exactJSON)(cyclic), /circular/);
        // A SHARED (but acyclic) subtree is not a cycle and must serialise:
        // unification produces those routinely.
        const shared = { v: 1 };
        Assert.equal((0, aontu_1.exactJSON)({ a: shared, b: shared }), '{"a":{"v":1},"b":{"v":1}}');
    });
});
//# sourceMappingURL=exactjson.test.js.map