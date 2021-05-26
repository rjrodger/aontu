"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.util = exports.Nil = exports.Val = exports.Aontu = void 0;
const lang_1 = require("./lib/lang");
const unify_1 = require("./lib/unify");
const val_1 = require("./lib/val");
Object.defineProperty(exports, "Val", { enumerable: true, get: function () { return val_1.Val; } });
Object.defineProperty(exports, "Nil", { enumerable: true, get: function () { return val_1.Nil; } });
/*
NEXT:
inject path from multisource into Vals when created
report via nil error
also trace deps into top val and watch via model
*/
// TODO: error reporting
// TODO: debug tracing
// TODO: providers - e.g source files from paths
const NoResolver = () => ({
    path: '<no-path>',
    full: '<no-full>',
    base: '<no-base>'
});
/* `Aontu('a:1') => opts={src:'a:1',print:0,...}`
 * `Aontu('a:1',{print:1}) => opts={src:'a:1',print:1,...}`
 * `Aontu({src:'a:1'},{src:'a:2'}) => opts={src:'a:2',print:0,...}`
 */
function Aontu(src, popts) {
    let opts = util.options(src, popts);
    // console.log('A opts', opts)
    let lang = new lang_1.Lang(opts);
    let deps = {};
    let val = lang.parse(opts.src, { deps: deps });
    let uni = new unify_1.Unify(val);
    let res = uni.res;
    res.deps = deps;
    //res.map = uni.map
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
                resolver: NoResolver,
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