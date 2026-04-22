"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.unite = exports.Unify = void 0;
const ctx_1 = require("./ctx");
const type_1 = require("./type");
const err_1 = require("./err");
const lang_1 = require("./lang");
const utility_1 = require("./utility");
const top_1 = require("./val/top");
// TODO: FIX: false positive when too many top unifications
const MAXCYCLE = 999;
// Vals should only have to unify downwards (in .unify) over Vals they understand.
// and for complex Vals, TOP, which means self unify if not yet done
const unite = (ctx, a, b, whence) => {
    // Fast paths that don't recurse and so don't need cycle-detection:
    // short-circuit before the saw-key build and seen-map lookup (which
    // together cost ~2.5µs per call). Only return early when the result
    // is already `done` — a non-done result would need the trailing
    // top() unify below.
    //
    //   A6a: same ref, already done
    //   A6b: different ref but same id + both done
    //   P1:  exact-equal scalars that are already done (14% of calls
    //        in foo-sdk, ~100% with a.done=true)
    if (a !== undefined && a !== null) {
        if (a === b) {
            if (a.done)
                return a;
        }
        else if (b !== undefined && b !== null) {
            if (a.done && b.done) {
                if (a.id === b.id)
                    return a;
                if (a.constructor === b.constructor && a.peg === b.peg
                    && !a.isNil && !b.isNil
                    && !a.isConjunct && !a.isDisjunct
                    && !a.isRef && !a.isPref && !a.isFunc && !a.isExpect) {
                    return a;
                }
                // Id-keyed cache: reuse results for the exact same Val pair.
                const uc = ctx._uniteCache;
                if (uc !== undefined) {
                    const ucKey = a.id + '|' + b.id;
                    const ucHit = uc.get(ucKey);
                    if (ucHit !== undefined)
                        return ucHit;
                }
            }
        }
    }
    const te = ctx.explain && (0, utility_1.explainOpen)(ctx, ctx.explain, 'unite', a, b);
    let out = a;
    let why = 'u';
    // Cycle-detection key. Use numeric path index for speed; fall back to
    // full string key when debug is enabled so the saw value is human-readable.
    const saw = ctx.opts.debug
        ? (a ? a.id + (a.done ? '' : '*') : '') + '~' +
            (b ? b.id + (b.done ? '' : '*') : '') + '@' + ctx.pathstr
        : (a ? a.id + (a.done ? 'd' : '') : 0) + '~' +
            (b ? b.id + (b.done ? 'd' : '') : 0) + '~' + ctx.pathidx;
    // NOTE: if this error occurs "unreasonably", attemp to avoid unnecesary unification
    // See for example PrefVal peg.id equality inspection.
    const sawCount = ctx.seen[saw] ?? 0;
    if (MAXCYCLE < sawCount) {
        // console.log('SAW', sawCount, saw, a?.id, a?.canon, b?.id, b?.canon, ctx.cc)
        out = (0, err_1.makeNilErr)(ctx, 'unify_cycle', a, b);
    }
    else {
        ctx.seen[saw] = sawCount + 1;
        try {
            let unified = false;
            // Dispatch ladder. Structure note:
            //   - `a == null` is degenerate (shouldn't happen in practice:
            //     the top-level call seeds with a real Val). Kept for safety.
            //   - TOP is the unit element: unifying with it returns the
            //     other side. Handle both sides.
            //   - Otherwise route by Val type. Complex Vals (Conjunct,
            //     Disjunct, Ref, Pref, Func, Expect) have their own unify
            //     that knows how to absorb the peer; prefer `a.unify` when
            //     `a` is complex, else `b.unify` when `b` is complex. If
            //     neither is complex and it's not a plain-scalar match, fall
            //     through to the generic `a.unify` (concrete Val classes
            //     each handle their own peer case).
            if (a == null) {
                out = b;
                why = 'b';
            }
            else if (b == null || b.isTop) {
                out = a;
                why = 'a';
            }
            else if (a.isTop) {
                out = b;
                why = 'b';
            }
            else if (a.isNil) {
                out = update(a, b);
                why = 'an';
            }
            else if (b.isNil) {
                out = update(b, a);
                why = 'bn';
            }
            else if (a.isConjunct || a.isExpect) {
                out = a.unify(b, te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'AC') }) : ctx);
                unified = true;
                why = 'a*';
            }
            else if (b.isConjunct
                || b.isDisjunct
                || b.isRef
                || b.isPref
                || b.isFunc
                || b.isExpect) {
                out = b.unify(a, te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'BW') }) : ctx);
                unified = true;
                why = 'bv';
            }
            // Exactly equal scalars (not caught by early fast-path — e.g.
            // because a or b isn't .done yet).
            else if (a.constructor === b.constructor && a.peg === b.peg) {
                out = update(a, b);
                why = 'up';
            }
            else {
                out = a.unify(b, te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'GN') }) : ctx);
                unified = true;
                why = 'ab';
            }
            if (!out || !out.unify) {
                out = (0, err_1.makeNilErr)(ctx, 'unite', a, b, whence + '/nil');
                why += 'N';
            }
            // Any non-done top-level result self-unifies with TOP to ensure
            // its children finish converging. Skipped when `unified` is true
            // because the branch that set `out = X.unify(Y, ctx)` already
            // ran that Val's own unify logic.
            if (!out.done && !unified) {
                out = out.unify((0, top_1.top)(), te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'ND') }) : ctx);
                why += 'T';
            }
        }
        catch (err) {
            // TODO: handle unexpected
            out = (0, err_1.makeNilErr)(ctx, 'internal', a, b);
        }
    }
    ctx.explain && (0, utility_1.explainClose)(te, out);
    // Store in id-keyed cache when both operands were done.
    if (a?.done && b?.done && out?.done && ctx._uniteCache !== undefined) {
        ctx._uniteCache.set(a.id + '|' + b.id, out);
    }
    return out;
};
exports.unite = unite;
function update(x, _y) {
    // TODO: update x with y.site
    return x;
}
class Unify {
    constructor(root, lang, ctx, src) {
        this.lang = lang || new lang_1.Lang();
        if ('string' === typeof root) {
            root = this.lang.parse(root);
        }
        if ('string' !== typeof src) {
            src = '';
        }
        this.cc = 0;
        this.root = root;
        this.res = root;
        // Always use a fresh array for mutable error collection to avoid
        // mutating the shared EMPTY_ERR singleton on Val instances.
        this.err = ctx?.err ?? (root.err.length > 0 ? root.err : []);
        this.explain = ctx?.explain ?? root.explain ?? null;
        let res = root;
        let uctx;
        // Only unify if no syntax errors
        if (!root.isNil) {
            if (ctx instanceof ctx_1.AontuContext) {
                uctx = ctx;
            }
            else {
                uctx = new ctx_1.AontuContext({
                    ...(ctx || {}),
                    root: res,
                    err: this.err,
                    explain: this.explain,
                    src,
                });
            }
            // TODO: messy
            // uctx.seterr(this.err)
            uctx.err = this.err;
            uctx.explain = this.explain;
            const explain = null == ctx?.explain ? undefined : ctx?.explain;
            const te = explain && (0, utility_1.explainOpen)(uctx, explain, 'root', res);
            // NOTE: if true === res.done already, then this loop never needs to run.
            let maxcc = 9; // 99
            for (; this.cc < maxcc && type_1.DONE !== res.dc; this.cc++) {
                // console.log('CC', this.cc, res.canon)
                uctx.cc = this.cc;
                uctx.seen = {};
                uctx._refCloneCache = new Map();
                uctx._uniteCache = new Map();
                res = unite(te ? uctx.clone({ explain: (0, utility_1.ec)(te, 'run') }) : uctx, res, (0, top_1.top)(), 'unify');
                if (0 < uctx.err.length) {
                    break;
                }
                uctx = uctx.clone({ root: res });
            }
            uctx.explain && (0, utility_1.explainClose)(te, res);
        }
        this.res = res;
    }
}
exports.Unify = Unify;
//# sourceMappingURL=unify.js.map