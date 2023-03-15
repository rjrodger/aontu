"use strict";
/* Copyright (c) 2021-2022 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.util = exports.Context = exports.Lang = exports.Nil = exports.Aontu = void 0;
const lang_1 = require("./lib/lang");
Object.defineProperty(exports, "Lang", { enumerable: true, get: function () { return lang_1.Lang; } });
const unify_1 = require("./lib/unify");
Object.defineProperty(exports, "Context", { enumerable: true, get: function () { return unify_1.Context; } });
const Nil_1 = require("./lib/val/Nil");
Object.defineProperty(exports, "Nil", { enumerable: true, get: function () { return Nil_1.Nil; } });
const err_1 = require("./lib/err");
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
/* `Aontu('a:1') => opts={src:'a:1',print:0,...}`
 * `Aontu('a:1',{print:1}) => opts={src:'a:1',print:1,...}`
 * `Aontu({src:'a:1'},{src:'a:2'}) => opts={src:'a:2',print:0,...}`
 */
function Aontu(src, popts) {
    let opts = util.options(src, popts);
    let lang = new lang_1.Lang(opts);
    let deps = {};
    let val = lang.parse(opts.src, { deps: deps });
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
                resolver: lang_1.includeFileResolver,
            },
            ...srcopts,
            ...(popts || {}),
        };
        return opts;
    },
};
exports.util = util;
exports.default = Aontu;
//# sourceMappingURL=aontu.js.map