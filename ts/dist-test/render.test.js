"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// The fold alone (docs/design/RENDER.0.md D9): the arms a spec row
// cannot reach, because `render` hands the fold an instance the
// vocabulary has shaped -- every default filled, every unit a map.
// A caller of `renderValue` may hand it less, and the fold answers
// for what it is given.
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const render_1 = require("../dist/render");
(0, node_test_1.describe)('render-value', () => {
    // The options are optional: `render(src)` alone renders the root
    // under the defaults, which is how an embedder calls it.
    (0, node_test_1.test)('render-takes-no-options', () => {
        const report = (0, render_1.render)('code: units: [{ path: "a.txt", lang: "text", decls: [] }]');
        node_assert_1.default.strictEqual(report.verdict, 'ok');
        node_assert_1.default.deepStrictEqual(report.units, [{ path: 'a.txt', lang: 'text', text: '' }]);
    });
    (0, node_test_1.test)('nothing-to-render', () => {
        node_assert_1.default.deepStrictEqual((0, render_1.renderValue)({}), { verdict: 'ok', units: [], lossy: [] });
        node_assert_1.default.deepStrictEqual((0, render_1.renderValue)(undefined), { verdict: 'ok', units: [], lossy: [] });
    });
    (0, node_test_1.test)('sparse-pieces-take-the-vocabulary-defaults', () => {
        const report = (0, render_1.renderValue)({
            code: {
                units: [{
                        path: 'a.txt', lang: 'text',
                        decls: [{
                                k: 'frag', of: [
                                    { k: 'line', of: ['x'] },
                                    { k: 'blank' },
                                    { k: 'raw', text: 'y\n' },
                                ]
                            }],
                    }],
            },
        });
        node_assert_1.default.strictEqual(report.verdict, 'lossy');
        node_assert_1.default.strictEqual(report.units[0].text, 'x\n\ny\n');
    });
});
//# sourceMappingURL=render.test.js.map