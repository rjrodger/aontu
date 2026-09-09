"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// The lowering's own arms (docs/design/RENDER.0.md P5): what the
// vocabulary keeps a spec row from reaching -- a non-ASCII name (the
// vocabulary's %name is ASCII), a container of a container (a
// container takes leaves only, so the paren rule has no row), a
// profile with a lowering and no type forms -- and the word splitter
// and case styles at their edges. Twin of go/lower_test.go; what both
// ports must agree on through the vocabulary is test/spec/render.tsv.
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const aontu_1 = require("../dist/aontu");
const render_1 = require("../dist/render");
const lower_1 = require("../dist/lower");
function ctx(family, profile) {
    return { profile: { lang: family, ...profile }, family, unit: 'u', lossy: [] };
}
(0, node_test_1.describe)('lower', () => {
    (0, node_test_1.test)('words-split-at-the-ascii-boundaries-and-non-ascii-rides', () => {
        node_assert_1.default.deepStrictEqual((0, lower_1.splitWords)('HTTPServer2Go'), ['HTTP', 'Server', '2', 'Go']);
        node_assert_1.default.deepStrictEqual((0, lower_1.splitWords)('utf8_string-value'), ['utf', '8', 'string', 'value']);
        node_assert_1.default.deepStrictEqual((0, lower_1.splitWords)('naïveName'), ['naïve', 'Name']);
        node_assert_1.default.deepStrictEqual((0, lower_1.splitWords)('a b'), ['a', 'b']);
        node_assert_1.default.deepStrictEqual((0, lower_1.splitWords)('__'), []);
        // A code point at or above U+0080 is never split and never
        // converted: it rides into its word, whatever the style.
        node_assert_1.default.strictEqual((0, lower_1.caseName)('crème_brûlée', 'pascal', []), 'CrèmeBrûlée');
        node_assert_1.default.strictEqual((0, lower_1.caseName)('über2Go', 'snake', []), 'über_2_go');
        node_assert_1.default.strictEqual((0, lower_1.caseName)('a-b c', 'kebab', []), 'a-b-c');
        node_assert_1.default.strictEqual((0, lower_1.caseName)('a-b c', 'screaming', []), 'A_B_C');
        node_assert_1.default.strictEqual((0, lower_1.caseName)('ledgerId', 'camel', ['ID']), 'ledgerID');
        node_assert_1.default.strictEqual((0, lower_1.caseName)('id', 'camel', ['ID']), 'id');
        node_assert_1.default.strictEqual((0, lower_1.caseName)('__', 'pascal', []), '__');
        node_assert_1.default.strictEqual((0, lower_1.caseName)('AsIs_x', 'as-is', []), 'AsIs_x');
    });
    (0, node_test_1.test)('quote-follows-the-profile-quote-and-table', () => {
        const profile = { str: { quote: "'", escape: { '10': '\\n' } } };
        node_assert_1.default.strictEqual((0, lower_1.quote)('it\'s "x"\n', profile), "'it\\u0027s \"x\"\\n\\u0002'");
        // No str at all: the double quote, and a bare table.
        node_assert_1.default.strictEqual((0, lower_1.quote)('a"b\\c', {}), '"a\\u0022b\\u005cc"');
    });
    (0, node_test_1.test)('literals-spell-as-the-family-does', () => {
        const go = ctx('go', {});
        const ts = ctx('typescript', {});
        node_assert_1.default.strictEqual((0, lower_1.literal)(1.5, go), '1.5');
        node_assert_1.default.strictEqual((0, lower_1.literal)(null, go), 'nil');
        node_assert_1.default.strictEqual((0, lower_1.literal)(null, ts), 'null');
        node_assert_1.default.strictEqual((0, lower_1.literal)(false, ts), 'false');
        node_assert_1.default.strictEqual((0, lower_1.literal)('s', ts), '"s"');
    });
    (0, node_test_1.test)('a-literal-set-in-go-takes-the-shared-primitive', () => {
        const go = ctx('go', {});
        const prim = (of) => (0, lower_1.typeExpr)({ k: 'lit', of }, go, '$').text;
        node_assert_1.default.strictEqual(prim([1.5, 2]), 'float');
        node_assert_1.default.strictEqual(prim([1, 2]), 'int');
        node_assert_1.default.strictEqual(prim([true]), 'bool');
        node_assert_1.default.strictEqual(prim([null]), 'null');
        node_assert_1.default.strictEqual(prim(['a', 1]), 'any');
        node_assert_1.default.strictEqual(go.lossy.length, 5);
    });
    (0, node_test_1.test)('a-profile-without-type-forms-falls-back-to-the-names', () => {
        // A supplied profile may name a lowering and no forms: the
        // primitive is its own name, and a form is open-less and close-less.
        const ts = ctx('typescript', {});
        node_assert_1.default.strictEqual((0, lower_1.typeExpr)({ k: 'prim', prim: 'int' }, ts, '$').text, 'int');
        node_assert_1.default.strictEqual((0, lower_1.typeExpr)({ k: 'list', of: { k: 'prim', prim: 'int' } }, ts, '$').text, 'int');
        node_assert_1.default.strictEqual((0, lower_1.typeExpr)({ k: 'map', key: { k: 'prim', prim: 'string' }, of: { k: 'prim', prim: 'int' } }, ts, '$').text, 'string, int');
        node_assert_1.default.strictEqual((0, lower_1.typeExpr)({ k: 'union', of: [{ k: 'prim', prim: 'a' }, { k: 'prim', prim: 'b' }] }, ts, '$').text, 'a | b');
    });
    (0, node_test_1.test)('the-paren-rule-puts-a-lower-precedence-inner-in-parens', () => {
        // The vocabulary keeps a container to leaves, so a list of a
        // nullable reaches the fold only through renderValue -- where the
        // TypeScript forms say (string | null)[] and not string | null[].
        const profile = new aontu_1.Aontu().generate('@"aontu:lang/typescript"').aontu.profile;
        const report = (0, render_1.renderValue)({
            aontu: { code: {
                    units: [{
                            path: 'a.ts', lang: 'typescript',
                            decls: [{
                                    k: 'record', name: 'T', open: false, check: [], fields: [{
                                            name: 'a', optional: false,
                                            type: { k: 'list', of: { k: 'opt', of: { k: 'prim', prim: 'string' } } },
                                        }],
                                }],
                        }],
                },
            }
        }, { profiles: [profile] });
        node_assert_1.default.strictEqual(report.verdict, 'ok');
        node_assert_1.default.strictEqual(report.units[0].text, 'export interface T {\n  a: (string | null)[];\n}\n');
    });
    (0, node_test_1.test)('a-body-piece-without-a-depth-nests-as-depth-zero-does', () => {
        // renderValue takes an instance the caller built, where the
        // vocabulary's `at: *0` default has not been filled: a line piece
        // with no `at` in a function body nests as a line at depth 0 does.
        const profile = new aontu_1.Aontu().generate('@"aontu:lang/typescript"').aontu.profile;
        const unit = (piece) => ({
            aontu: { code: {
                    units: [{
                            path: 'a.ts', lang: 'typescript',
                            decls: [{
                                    k: 'func', name: 'f', params: [],
                                    body: { k: 'frag', of: [piece, { k: 'blank' }, 'done()'] },
                                }],
                        }],
                } },
        });
        const bare = (0, render_1.renderValue)(unit({ k: 'line', of: ['go()'] }), { profiles: [profile] });
        const at0 = (0, render_1.renderValue)(unit({ k: 'line', at: 0, of: ['go()'] }), { profiles: [profile] });
        node_assert_1.default.strictEqual(bare.verdict, at0.verdict);
        node_assert_1.default.strictEqual(bare.units.length, 1);
        node_assert_1.default.strictEqual(bare.units[0].text, at0.units[0].text);
        node_assert_1.default.ok(bare.units[0].text.includes('\n  go()\n\n  done()\n'));
    });
});
//# sourceMappingURL=lower.test.js.map