"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.util = exports.Context = exports.Lang = exports.Nil = exports.Aontu = void 0;
// import { Lang, includeFileResolver } from './lib/lang'
const lang_1 = require("./lib/lang");
Object.defineProperty(exports, "Lang", { enumerable: true, get: function () { return lang_1.Lang; } });
const unify_1 = require("./lib/unify");
Object.defineProperty(exports, "Context", { enumerable: true, get: function () { return unify_1.Context; } });
const Nil_1 = require("./lib/val/Nil");
Object.defineProperty(exports, "Nil", { enumerable: true, get: function () { return Nil_1.Nil; } });
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
// const NoResolver: Resolver = () => ({
//   kind: '<no-kind>',
//   path: '<no-path>',
//   full: '<no-full>',
//   base: '<no-base>',
//   abs: true,
//   found: false,
// })
// TODO: Aontu should return final generated version?
/* `Aontu('a:1') => opts={src:'a:1',print:0,...}`
 * `Aontu('a:1',{print:1}) => opts={src:'a:1',print:1,...}`
 * `Aontu({src:'a:1'},{src:'a:2'}) => opts={src:'a:2',print:0,...}`
 */
function Aontu(src, popts) {
    let opts = util.options(src, popts);
    let deps = {};
    let val = util.parse(opts, { deps });
    let uni = new unify_1.Unify(val);
    let res = uni.res;
    let err = uni.err;
    (0, err_1.descErr)(uni.err);
    res.deps = deps;
    res.err = err;
    return res;
}
exports.Aontu = Aontu;
const util = {
    options: (src, popts) => {
        // Convert convenience first param into Options.src
        let srcopts = 'string' === typeof src ? { src } : src;
        let opts = {
            ...{
                src: '',
                print: 0,
                // resolver: includeFileResolver,
            },
            ...srcopts,
            ...(popts || {}),
        };
        return opts;
    },
    parse(opts, ctx) {
        let lang = new lang_1.Lang(opts);
        let val = lang.parse(opts.src, { deps: ctx.deps });
        return val;
    },
};
exports.util = util;
exports.default = Aontu;
//# sourceMappingURL=aontu.js.map