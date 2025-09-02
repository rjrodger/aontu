"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.descErr = descErr;
const jsonic_1 = require("jsonic");
const { errmsg } = jsonic_1.util;
// TODO: move to utility?
function descErr(err, errctx) {
    var _a, _b, _c;
    if (err === null || err === void 0 ? void 0 : err.isNil) {
        // console.trace()
        if (null == err.msg || '' === err.msg) {
            let v1 = err.primary;
            let v2 = err.secondary;
            let v1src = resolveSrc(v1, errctx);
            let v2src = resolveSrc(v2, errctx);
            let valpath = (0 < ((_a = err.path) === null || _a === void 0 ? void 0 : _a.length) ? err.path.join('.') : '');
            let attempt = (null == v2 ? 'resolve' : 'unify');
            err.msg = [
                errmsg({
                    color: true,
                    name: 'aontu',
                    code: err.why,
                    msg: 'Cannot ' +
                        attempt +
                        ' path $.' + valpath + ' value' + (null == v2 ? '' : 's'),
                }),
                (null != v1 && errmsg({
                    color: true,
                    msg: 'Cannot ' + attempt + ' value: ' + v1.canon +
                        (null == v2 ? '' : ' with value: ' + v2.canon),
                    smsg: 'value was: ' + v1.canon,
                    file: (_b = v1.url) === null || _b === void 0 ? void 0 : _b.replace(process.cwd() + '/', ''),
                    src: v1src,
                    row: v1.row,
                    col: v1.col,
                })),
                (null != v2 && errmsg({
                    color: true,
                    msg: 'Cannot ' + attempt + ' value: ' + v2.canon + ' with value: ' + v1.canon,
                    smsg: 'value was: ' + v2.canon,
                    file: (_c = v2.url) === null || _c === void 0 ? void 0 : _c.replace(process.cwd() + '/', ''),
                    src: v2src,
                    row: v2.row,
                    col: v2.col,
                })),
            ].filter(n => null != n && false !== n).join('\n');
        }
        return err;
    }
    else {
        return err.map((n) => descErr(n, errctx));
    }
}
function resolveSrc(v, errctx) {
    var _a;
    let src = null == v || null == v.url ? errctx === null || errctx === void 0 ? void 0 : errctx.src :
        ((_a = errctx === null || errctx === void 0 ? void 0 : errctx.fs) === null || _a === void 0 ? void 0 : _a.existsSync(v.url)) ? errctx.fs.readFileSync(v.url, 'utf8') : '';
    return src;
}
//# sourceMappingURL=err.js.map