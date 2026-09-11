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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const Fs = __importStar(require("node:fs"));
const Path = __importStar(require("node:path"));
const render_1 = require("../dist/render");
(0, node_test_1.describe)('render-value', () => {
    // The options are optional: `render(src)` alone renders the root
    // under the defaults, which is how an embedder calls it.
    (0, node_test_1.test)('render-takes-no-options', () => {
        const report = (0, render_1.render)('aontu: Code: units: [{ path: "a.txt", lang: "text", decls: [] }]');
        node_assert_1.default.strictEqual(report.verdict, 'ok');
        node_assert_1.default.deepStrictEqual(report.units, [{ path: 'a.txt', lang: 'text', text: '' }]);
    });
    // A profile document, the same way: `renderProfile(src)` alone, and
    // the answer carries the vocabulary's defaults.
    (0, node_test_1.test)('render-profile-takes-no-options-and-fills-the-defaults', () => {
        const loaded = (0, render_1.renderProfile)('aontu: render: Lang: lang: "text"');
        node_assert_1.default.strictEqual(loaded.errors, undefined);
        node_assert_1.default.strictEqual(loaded.profile.lang, 'text');
        node_assert_1.default.deepStrictEqual(loaded.profile.indent, { unit: ' ', width: 2 });
        node_assert_1.default.strictEqual(loaded.profile.lowering, undefined);
        const refused = (0, render_1.renderProfile)('aontu: render: Lang: lang: 1');
        node_assert_1.default.strictEqual(refused.profile, undefined);
        node_assert_1.default.strictEqual(refused.errors?.[0].path, '$.aontu.render.Lang.lang');
    });
    (0, node_test_1.test)('nothing-to-render', () => {
        node_assert_1.default.deepStrictEqual((0, render_1.renderValue)({}), { verdict: 'ok', units: [], lossy: [] });
        node_assert_1.default.deepStrictEqual((0, render_1.renderValue)(undefined), { verdict: 'ok', units: [], lossy: [] });
    });
    (0, node_test_1.test)('sparse-pieces-take-the-vocabulary-defaults', () => {
        const report = (0, render_1.renderValue)({
            aontu: { Code: {
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
                } },
        });
        node_assert_1.default.strictEqual(report.verdict, 'lossy');
        node_assert_1.default.strictEqual(report.units[0].text, 'x\n\ny\n');
    });
    // THE RENDERER NEVER WRITES (RENDER.0.md D8; docs/trust.md): the
    // library answers bytes, and only the verb's --out places them. A
    // filesystem import here would be the first step of a regression,
    // so the source is read for one. The Go twin scans go/render.go.
    (0, node_test_1.test)('render-source-has-no-filesystem-access', () => {
        const src = Fs.readFileSync(Path.join(__dirname, '..', 'src', 'render.ts'), 'utf8');
        node_assert_1.default.doesNotMatch(src, /node:fs|from 'fs'|require\(|writeFileSync|mkdirSync|child_process/);
    });
});
//# sourceMappingURL=render.test.js.map