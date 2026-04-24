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
const lang_1 = require("../dist/lang");
const SPEC_DIR = Path.resolve(__dirname, '..', 'test', 'spec');
function loadPathsSpec(filename) {
    const content = Fs.readFileSync(Path.join(SPEC_DIR, filename), 'utf8');
    const rows = [];
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            continue;
        const [input, countStr, canons] = trimmed.split('\t');
        rows.push({
            input,
            count: parseInt(countStr, 10),
            canons: canons ? canons.split(',') : [],
        });
    }
    return rows;
}
(0, node_test_1.describe)('paths', () => {
    const specs = loadPathsSpec('paths.tsv');
    for (const spec of specs) {
        (0, node_test_1.test)(`paths.tsv: ${spec.input}`, () => {
            const lang = new lang_1.Lang();
            lang.parse(spec.input);
            node_assert_1.default.strictEqual(lang.paths.length, spec.count, `path count mismatch for: ${spec.input} ` +
                `(got [${lang.paths.map((p) => p.canon)}])`);
            if (spec.canons.length > 0) {
                const actualCanons = lang.paths.map((p) => p.canon);
                node_assert_1.default.deepStrictEqual(actualCanons, spec.canons, `path canons mismatch for: ${spec.input}`);
            }
        });
    }
});
//# sourceMappingURL=paths.test.js.map