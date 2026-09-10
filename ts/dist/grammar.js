"use strict";
/* Copyright (c) 2026 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PARSE_CHECK_EVERY = exports.PARSE_STEP_MAX = void 0;
exports.compileGrammar = compileGrammar;
exports.parseWith = parseWith;
// The grammar seam, ADR-033. Twin of go/grammar.go.
const parser_1 = require("@tabnas/parser");
const abnf_1 = require("@tabnas/abnf");
// A constant, not a trust knob: this bounds a third party's grammar.
const PARSE_STEP_MAX = 100000;
exports.PARSE_STEP_MAX = PARSE_STEP_MAX;
const PARSE_CHECK_EVERY = 100;
exports.PARSE_CHECK_EVERY = PARSE_CHECK_EVERY;
const cache = new Map();
const steps = { n: 0 };
function compileGrammar(src) {
    const hit = cache.get(src);
    if (undefined !== hit) {
        return hit;
    }
    let out;
    try {
        // Lexing off, or the engine reads `1 . 2 . 3` as `1.2.3`. The hook
        // is installed here because the engine takes it at construction.
        const tn = new parser_1.Tabnas({
            space: { lex: false },
            parse: {
                budget: {
                    checkEveryN: PARSE_CHECK_EVERY,
                    onCheck: () => (steps.n += PARSE_CHECK_EVERY) <= PARSE_STEP_MAX,
                }
            }
        });
        tn.use(abnf_1.abnf);
        tn.abnf(src);
        out = [tn, undefined];
    }
    catch (e) {
        out = [undefined, String(e?.message ?? e).split('\n')[0]];
    }
    cache.set(src, out);
    return out;
}
function parseWith(grammar, text, _ctx) {
    steps.n = 0;
    try {
        return [grammar.parse(text), undefined];
    }
    catch (e) {
        return [undefined, String(e?.message ?? e).split('\n')[0]];
    }
} /* node:coverage ignore next 8 */
//# sourceMappingURL=grammar.js.map