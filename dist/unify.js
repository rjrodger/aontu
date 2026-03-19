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
let uc = 0;
// Vals should only have to unify downwards (in .unify) over Vals they understand.
// and for complex Vals, TOP, which means self unify if not yet done
const unite = (ctx, a, b, whence) => {
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
    if (MAXCYCLE < ctx.seen[saw]) {
        // console.log('SAW', ctx.seen[saw], saw, a?.id, a?.canon, b?.id, b?.canon, ctx.cc)
        out = (0, err_1.makeNilErr)(ctx, 'unify_cycle', a, b);
    }
    else {
        ctx.seen[saw] = 1 + (ctx.seen[saw] ?? 0);
        try {
            let unified = false;
            if (b && (!a || a.isTop)) {
                out = b;
                why = 'b';
            }
            else if (a && (!b || b.isTop)) {
                out = a;
                why = 'a';
            }
            else if (a && b && !b.isTop) {
                if (a.isNil) {
                    out = update(a, b);
                    why = 'an';
                }
                else if (b.isNil) {
                    out = update(b, a);
                    why = 'bn';
                }
                else if (a.isConjunct) {
                    out = a.unify(b, te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'CJ') }) : ctx);
                    unified = true;
                    why = 'acj';
                }
                else if (a.isExpect) {
                    out = a.unify(b, te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'AE') }) : ctx);
                    unified = true;
                    why = 'ae';
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
                // Exactly equal scalars.
                else if (a.constructor === b.constructor && a.peg === b.peg) {
                    out = update(a, b);
                    why = 'up';
                }
                else {
                    out = a.unify(b, te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'GN') }) : ctx);
                    unified = true;
                    why = 'ab';
                }
            }
            if (!out || !out.unify) {
                out = (0, err_1.makeNilErr)(ctx, 'unite', a, b, whence + '/nil');
                why += 'N';
            }
            // console.log('UNITE-DONE', out.id, out.canon, out.done)
            // if (DONE !== out.dc && !unified) {
            if (!out.done && !unified) {
                let nout = out.unify((0, top_1.top)(), te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'ND') }) : ctx);
                out = nout;
                why += 'T';
            }
            // console.log('UNITE', why, a?.id, a?.canon, a?.done, b?.id, b?.canon, b?.done, '->', out?.id, out?.canon, out?.done)
            uc++;
        }
        catch (err) {
            // console.log(err)
            // TODO: handle unexpected
            out = (0, err_1.makeNilErr)(ctx, 'internal', a, b);
        }
    }
    ctx.explain && (0, utility_1.explainClose)(te, out);
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
        this.err = ctx?.err ?? root.err ?? [];
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