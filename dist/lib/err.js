"use strict";
/* Copyright (c) 2021-2024 Richard Rodger, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.descErr = descErr;
const node_fs_1 = __importDefault(require("node:fs"));
const jsonic_next_1 = require("@jsonic/jsonic-next");
const { errmsg } = jsonic_next_1.util;
// TODO: move to utility?
function descErr(err, ctx) {
    var _a, _b, _c;
    if (err === null || err === void 0 ? void 0 : err.isNil) {
        // console.trace()
        if (null == err.msg || '' === err.msg) {
            let v1 = err.primary;
            let v2 = err.secondary;
            /*
            err.msg =
              'Cannot ' +
              (null == v2 ? 'resolve' : 'unify') +
      
              (0 < err.path?.length ? ' path ' + err.path.join('.') : '') +
              ' ' + (err.url ? 'in ' + err.url : '') + ':\n' +
      
              (null == v1 ? '' :
                'LHS: ' +
                (0 < v1.path?.length ? v1.path.join('.') + ':' : '') +
                `<${v1.canon}>:${v1.row}:${v1.col}` + ' ' +
                ((v1.url && v1.url !== err.url) ? ' in ' + v1.url : '') + '\n'
              ) +
      
              (null == v2 ? '' :
                'RHS: ' +
                (0 < v2.path?.length ? v2.path.join('.') + ':' : '') +
                `<${v2.canon}>:${v2.row}:${v2.col}` + ' ' +
                ((v2.url && v2.url !== err.url) ? ' in ' + v2.url : '') + '\n'
              ) +
              ''
              */
            // console.log(v1)
            // TODO: src should come from @jsonic/multisource
            // let v1src = null == v1 || null == v1.url ? ctx?.src : Fs.readFileSync(v1.url, 'utf8')
            // let v2src = null == v2 || null == v2.url ? ctx?.src : Fs.readFileSync(v2.url, 'utf8')
            let v1src = resolveSrc(v1, ctx);
            let v2src = resolveSrc(v2, ctx);
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
        return err.map((n) => descErr(n, ctx));
    }
}
function resolveSrc(v, ctx) {
    let src = null == v || null == v.url ? ctx === null || ctx === void 0 ? void 0 : ctx.src :
        node_fs_1.default.existsSync(v.url) ? node_fs_1.default.readFileSync(v.url, 'utf8') : '';
    return src;
}
//# sourceMappingURL=err.js.map