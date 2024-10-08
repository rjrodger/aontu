"use strict";
/* Copyright (c) 2021-2024 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.descErr = descErr;
// TODO: move to utility?
function descErr(err) {
    var _a, _b, _c;
    if (err === null || err === void 0 ? void 0 : err.isNil) {
        // console.trace()
        if (null == err.msg || '' === err.msg) {
            let v1 = err.primary;
            let v2 = err.secondary;
            // console.log(err)
            err.msg =
                'Cannot ' +
                    (null == v2 ? 'resolve' : 'unify') +
                    (0 < ((_a = err.path) === null || _a === void 0 ? void 0 : _a.length) ? ' path ' + err.path.join('.') : '') +
                    ' ' + (err.url ? 'in ' + err.url : '') + ':\n' +
                    (null == v1 ? '' :
                        'LHS: ' +
                            (0 < ((_b = v1.path) === null || _b === void 0 ? void 0 : _b.length) ? v1.path.join('.') + ':' : '') +
                            `<${v1.canon}>:${v1.row}:${v1.col}` + ' ' +
                            ((v1.url && v1.url !== err.url) ? ' in ' + v1.url : '') + '\n') +
                    (null == v2 ? '' :
                        'RHS: ' +
                            (0 < ((_c = v2.path) === null || _c === void 0 ? void 0 : _c.length) ? v2.path.join('.') + ':' : '') +
                            `<${v2.canon}>:${v2.row}:${v2.col}` + ' ' +
                            ((v2.url && v2.url !== err.url) ? ' in ' + v2.url : '') + '\n') +
                    '';
        }
        return err;
    }
    else {
        return err.map((n) => descErr(n));
    }
}
//# sourceMappingURL=err.js.map