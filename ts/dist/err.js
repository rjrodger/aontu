"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AontuError = void 0;
exports.getHint = getHint;
exports.makeNilErr = makeNilErr;
exports.descErr = descErr;
const jsonic_1 = require("jsonic");
const NilVal_1 = require("./val/NilVal");
const hints_1 = require("./hints");
const { errmsg, strinject } = jsonic_1.util;
function getHint(why, details) {
    if (hints_1.hints[why]) {
        let txt = hints_1.hints[why];
        return details ? strinject(txt, details) : txt;
    }
    return undefined;
}
function makeNilErr(ctx, why, av, bv, attempt, details) {
    // C1-inner: when a DisjunctVal trial is in progress, failures are
    // transient markers — none of the NilVal fields (site, path,
    // primary, secondary, details) ever surface to the user because
    // DisjunctVal replaces the oval entry with TRIAL_NIL and filters
    // by isNil. Allocating a fresh NilVal per failure (~60k per
    // foo-sdk run from IntegerVal/BooleanVal/ScalarVal.unify et al.)
    // is pure waste. Short-circuit to the shared sentinel; push once
    // to ctx.err so the caller's `trialErr.length > 0` check still
    // signals failure.
    if (ctx !== undefined && ctx._trialMode === true) {
        if (ctx.err.length === 0)
            ctx.err.push(NilVal_1.TRIAL_NIL);
        return NilVal_1.TRIAL_NIL;
    }
    const nilval = NilVal_1.NilVal.make(ctx, why, av, bv, attempt, details);
    return nilval;
}
// TODO: move to utility?
function descErr(err, errctx) {
    if (err?.isNil) {
        if (null == err.msg || '' === err.msg) {
            let v1 = err.primary;
            let v2 = err.secondary;
            let v1src = resolveSrc(v1, errctx, 'primary');
            let v2src = resolveSrc(v2, errctx, 'secondary');
            let path = ['$', ...err.path].filter((p) => null != p && '' != p);
            let valpath = (0 < path.length ? path.join('.') : '');
            let attempt = null != err.attempt ? err.attempt : (null == v2 ? 'resolve' : 'unify');
            const details = err.details;
            err.msg = [
                errmsg({
                    color: { active: true },
                    name: 'aontu',
                    code: err.why,
                    txts: {
                        msg: 'Cannot ' +
                            attempt +
                            ' value' + (null == v2 ? '' : 's') +
                            ' at path ' + valpath,
                        hint: getHint(err.why, err.details)
                    }
                }),
                '\n',
                (null != v1 && errmsg({
                    // TODO: color should come from jsonic config
                    color: { active: true, line: '\x1b[34m' },
                    txts: {
                        msg: 'Cannot ' + attempt + ' value: ' + v1.canon +
                            (null == v2 ? '' : ' with value: ' + v2.canon), // + ' #' + err.id,
                        site: ''
                    },
                    smsg: (null == details?.key ? '' : 'key ' + details?.key + ' ') +
                        'value was: ' + v1.canon,
                    file: resolveFile(v1.site.url),
                    src: v1src,
                    row: v1.site.row,
                    col: v1.site.col,
                })),
                (null != v2 && errmsg({
                    // TODO: color should come from jsonic config
                    color: { active: true, line: '\x1b[34m' },
                    txts: {
                        msg: 'Cannot ' + attempt + ' value: ' + v2.canon +
                            ' with value: ' + v1.canon, // + ' #' + err.id,
                        site: ''
                    },
                    smsg: (null == details?.key ? '' : 'key ' + details?.key + ' ') +
                        'value was: ' + v2.canon,
                    file: resolveFile(v2.site.url),
                    src: v2src,
                    row: v2.site.row,
                    col: v2.site.col,
                })),
            ]
                .filter((n) => null != n && false !== n)
                .join('\n')
                // TODO: update jsonic errmsg to avoid multiple empty lines
                .replace(/\n\n/g, '\n');
        }
        return err;
    }
    else {
        return err.map((n) => descErr(n, errctx));
    }
}
function resolveFile(url) {
    const cwd = process.cwd();
    let out = url?.replace(cwd + '/', '') ?? '<no-file>';
    out = out === cwd || '' === out ? '<no-file>' : out;
    return out;
}
function resolveSrc(v, errctx, position) {
    let src = undefined;
    const url = v?.site.url;
    // Cache reads on errctx for the lifetime of the error-formatting pass.
    // When many NilVals share the same source file (common during batch
    // descErr after unify), this avoids re-reading the same file N times.
    const cache = errctx ? (errctx._srcCache ??= new Map()) : null;
    if (null != url) {
        if (cache && cache.has(url)) {
            src = cache.get(url);
        }
        else {
            try {
                const fileExists = errctx?.fs?.existsSync(url);
                if (fileExists) {
                    src = errctx?.fs?.readFileSync(url, 'utf8') ?? undefined;
                }
            }
            catch (fe) {
                // ignore as more important to report original error
            }
            if (cache && null != src) {
                cache.set(url, src);
            }
        }
    }
    if (undefined == src || '' === src) {
        if (errctx?.src) {
            src = errctx.src;
        }
        else if (errctx) {
            src = 'SOURCE-NOT-FOUND:' + (null != url ? (' ' + url) : '') +
                (null == errctx?.fs ? ' (NO-FS)' : '');
        }
    }
    return src;
}
class AontuError extends Error {
    constructor(msg, errs) {
        super(msg);
        this.aontu = true;
        this.name = this.constructor.name;
        this.errs = () => errs ?? [];
        this.stack = this.stack?.split('\n')
            .filter(line => !line.match(/aontu\/(src|dist)\//))
            .join('\n');
    }
}
exports.AontuError = AontuError;
//# sourceMappingURL=err.js.map