"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.util = exports.Aontu = void 0;
const lang_1 = require("./lib/lang");
const unify_1 = require("./lib/unify");
/* `Aontu('a:1') => opts={src:'a:1',print:0,...}`
 * `Aontu('a:1',{print:1}) => opts={src:'a:1',print:1,...}`
 * `Aontu({src:'a:1'},{src:'a:2'}) => opts={src:'a:2',print:0,...}`
 */
function Aontu(src, popts) {
    let opts = util.options(src, popts);
    let val = lang_1.AontuLang(opts.src);
    let uni = new unify_1.Unify(val);
    return uni.res;
}
exports.Aontu = Aontu;
const util = {
    options: (src, popts) => {
        let srcopts = 'string' === typeof (src) ? { src } : src;
        let opts = {
            ...{
                src: '',
                print: 0,
            },
            ...srcopts,
            ...(popts || {})
        };
        return opts;
    }
};
exports.util = util;
exports.default = Aontu;
//# sourceMappingURL=aontu.js.map