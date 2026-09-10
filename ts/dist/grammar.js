"use strict";
/* Copyright (c) 2026 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PARSE_CHECK_EVERY = exports.PARSE_STEP_MAX = void 0;
exports.compileGrammar = compileGrammar;
exports.parseWith = parseWith;
// THE GRAMMAR SEAM (G9): compiling an ABNF grammar, and running it
// under aontu's own budget. Kept out of AbnfFuncVal.ts so the two
// builtins hold no host-parser detail, and so the Go twin (go/abnf.go)
// has one file to mirror.
//
// THE PARSE IS BOUNDED, and that is not optional. `re()` carries the
// ReDoS guard because a regex match is counted by no evaluator budget
// (docs/trust.md clause 2), and a user-supplied grammar is strictly
// more expressive than the pattern subset that guard admits -- the
// compiler's own notes warn that pathological grammars grow under
// Paull's algorithm. The engine's cancellation hook is what makes this
// answerable: it calls back every N rule iterations and a `false`
// cancels the parse, so a runaway is refused the way any other
// unbounded evaluation is rather than stalling the host.
const parser_1 = require("@tabnas/parser");
const abnf_1 = require("@tabnas/abnf");
// The parse step ceiling. Deliberately a CONSTANT rather than a trust
// knob: the budgets a profile may lower or raise (passes, depth) bound
// aontu's own evaluation, and this bounds a third party's. A grammar
// needing more than this is not a grammar aontu should be running.
const PARSE_STEP_MAX = 100000;
exports.PARSE_STEP_MAX = PARSE_STEP_MAX;
// How often the engine asks. Small enough that a runaway is caught
// promptly, large enough that the callback is not the cost.
const PARSE_CHECK_EVERY = 100;
exports.PARSE_CHECK_EVERY = PARSE_CHECK_EVERY;
// Compiled grammars, by source. A grammar named at many sites compiles
// once; a grammar that does not compile is refused once, with the
// compiler's own reason rather than a summary of it.
const cache = new Map();
// The step counter the installed hook reads. One box, reset per parse:
// parsing is synchronous and re-entered only by a nested parse, which
// no grammar can start, so a single counter is the whole state.
const steps = { n: 0 };
function compileGrammar(src) {
    const hit = cache.get(src);
    if (undefined !== hit) {
        return hit;
    }
    let out;
    try {
        // Whitespace is NOT skipped: a grammar aontu runs describes a
        // string with no spaces in it (a version, an address, a media
        // type), and the engine's lexer would otherwise read `1 . 2 . 3`
        // as `1.2.3` -- accepting input the grammar's author did not.
        //
        // The budget hook is installed HERE because the engine takes it at
        // construction, not per parse. A compiled grammar is cached and
        // reused, so the counter it reads is reset by parseWith before each
        // run rather than captured per call.
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