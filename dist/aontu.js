"use strict";
/* Copyright (c) 2021-2024 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.util = exports.Context = exports.Lang = exports.Nil = void 0;
exports.Aontu = Aontu;
exports.parse = parse;
const lang_1 = require("./lib/lang");
Object.defineProperty(exports, "Lang", { enumerable: true, get: function () { return lang_1.Lang; } });
const unify_1 = require("./lib/unify");
Object.defineProperty(exports, "Context", { enumerable: true, get: function () { return unify_1.Context; } });
const Nil_1 = require("./lib/val/Nil");
Object.defineProperty(exports, "Nil", { enumerable: true, get: function () { return Nil_1.Nil; } });
const MapVal_1 = require("./lib/val/MapVal");
const err_1 = require("./lib/err");
// TODO: BUG: foo: { bar: {} } zed: {} puts zed a wrong level
// TODO: exclude tests from dist!!!
// TODO: propogate property path and url properly over unification, and multisource
/*
NEXT:
inject path from multisource into Vals when created
report via nil error
also trace deps into top val and watch via model
*/
// TODO: error reporting
// TODO: debug tracing
// TODO: providers - e.g source files from paths
// TODO: Aontu should return final generated version?
/* `Aontu('a:1') => opts={src:'a:1',print:0,...}`
 * `Aontu('a:1',{print:1}) => opts={src:'a:1',print:1,...}`
 * `Aontu({src:'a:1'},{src:'a:2'}) => opts={src:'a:2',print:0,...}`
 */
function Aontu(src, popts) {
    // TODO: review: why is an undefined src allowed?
    let opts = prepareOptions(src, popts);
    let deps = {};
    // TODO: handle empty src
    let val = parse(opts, { deps });
    if (null == val) {
        val = new MapVal_1.MapVal({ peg: {} });
    }
    let uni = new unify_1.Unify(val);
    let res = uni.res;
    let err = uni.err;
    (0, err_1.descErr)(uni.err, { src: opts.src, fs: opts.fs });
    res.deps = deps;
    res.err = err;
    return res;
}
function prepareOptions(src, popts) {
    // Convert convenience first param into Options.src
    let srcopts = 'string' === typeof src ? { src } : src;
    let opts = {
        ...{
            src: '',
            print: 0,
        },
        ...srcopts,
        ...(popts || {}),
    };
    return opts;
}
function parse(opts, ctx) {
    const lang = new lang_1.Lang(opts);
    const val = lang.parse(opts.src, { deps: ctx.deps, fs: opts.fs });
    return val;
}
const util = {
    parse,
    options: prepareOptions,
};
exports.util = util;
exports.default = Aontu;
//# sourceMappingURL=aontu.js.map