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
const { errmsg } = jsonic_1.util;
function getHint(why) {
    if (hints_1.hints[why]) {
        return hints_1.hints[why];
    }
    return undefined;
}
function makeNilErr(ctx, why, av, bv, attempt) {
    const nilval = NilVal_1.NilVal.make(ctx, why, av, bv, attempt);
    return nilval;
}
// TODO: move to utility?
function descErr(err, errctx) {
    if (err?.isNil) {
        if (null == err.msg || '' === err.msg) {
            let v1 = err.primary;
            let v2 = err.secondary;
            let v1src = resolveSrc(v1, errctx);
            let v2src = resolveSrc(v2, errctx);
            let path = ['$', ...err.path].filter((p) => null != p && '' != p);
            let valpath = (0 < path.length ? path.join('.') : '');
            let attempt = null != err.attempt ? err.attempt : (null == v2 ? 'resolve' : 'unify');
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
                        hint: getHint(err.why)
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
                    smsg: 'value was: ' + v1.canon,
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
                    smsg: 'value was: ' + v2.canon,
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
function resolveSrc(v, errctx) {
    let src = undefined;
    if (null != v?.site.url) {
        try {
            const fileExists = errctx?.fs?.existsSync(v.site.url);
            if (fileExists) {
                src = errctx?.fs?.readFileSync(v.site.url, 'utf8') ?? undefined;
            }
        }
        catch (fe) {
            // ignore as more important to report original error
        }
    }
    if (errctx && (undefined == src || '' === src)) {
        src = errctx.src ?? '';
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