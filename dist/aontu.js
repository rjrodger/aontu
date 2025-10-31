"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatExplain = exports.AontuX = exports.util = exports.Context = exports.Lang = exports.NilVal = void 0;
exports.Aontu = Aontu;
exports.parse = parse;
const lang_1 = require("./lang");
Object.defineProperty(exports, "Lang", { enumerable: true, get: function () { return lang_1.Lang; } });
const unify_1 = require("./unify");
Object.defineProperty(exports, "Context", { enumerable: true, get: function () { return unify_1.Context; } });
const val_1 = require("./val");
Object.defineProperty(exports, "NilVal", { enumerable: true, get: function () { return val_1.NilVal; } });
const err_1 = require("./err");
const utility_1 = require("./utility");
Object.defineProperty(exports, "formatExplain", { enumerable: true, get: function () { return utility_1.formatExplain; } });
class AontuX {
    constructor(popts) {
        this.opts = popts;
        this.lang = new lang_1.Lang(this.opts);
    }
    ctx(arg) {
        return arg instanceof AontuContext ? arg :
            new AontuContext(arg);
    }
    parse(src, ac) {
        if (!(ac instanceof unify_1.Context)) {
            ac = this.ctx({ ...(ac ?? {}) });
        }
        const opts = prepareOptions(src, { ...this.opts });
        const deps = {};
        let val = parse(this.lang, opts, { deps });
        if (undefined === val) {
            val = new val_1.MapVal({ peg: {} });
        }
        val.deps = deps;
        ac.root = val;
        if (val.err && 0 < val.err.length) {
            val.err.map((err) => ac.adderr(err));
            if (!ac.collect) {
                throw new AontuError(ac.errmsg(), ac.err);
            }
            return undefined;
        }
        return val;
    }
    unify(src, ac) {
        if (!(ac instanceof unify_1.Context)) {
            ac = this.ctx({ ...(ac ?? {}), src });
        }
        let pval = src.isVal ? src : this.parse(src, ac);
        let osrc = 'string' === typeof src ? src : (ac.src ?? '');
        if (undefined === pval) {
            return undefined;
        }
        let uni = new unify_1.Unify(pval, this.lang, ac, osrc);
        let res = uni.res;
        let err = uni.err;
        res.deps = pval.deps;
        res.err = err;
        ac.root = res;
        if (res.err && 0 < res.err.length) {
            if (!ac.collect) {
                throw new AontuError(ac.errmsg(), ac.err);
            }
        }
        return res;
    }
    generate(src, meta) {
        try {
            let out = undefined;
            let ac = this.ctx({
                src,
                err: meta?.err,
                explain: meta?.explain,
                var: meta?.var,
            });
            let pval = this.parse(src, ac);
            if (undefined !== pval && 0 === pval.err.length) {
                let uval = this.unify(pval, ac);
                if (undefined !== uval && 0 === uval.err.length) {
                    out = uval.isNil ? undefined : uval.gen(ac);
                    if (0 < ac.err.length) {
                        if (!ac.collect) {
                            throw new AontuError(ac.errmsg(), ac.err);
                        }
                        out = undefined;
                    }
                }
            }
            return out;
        }
        catch (err) {
            if (err instanceof AontuError) {
                throw err;
            }
            const unex = new AontuError('Aontu: unexpected error: ' + err.message);
            Object.assign(unex, err);
            unex.stack = err.stack;
            throw unex;
        }
    }
}
exports.AontuX = AontuX;
class AontuContext extends unify_1.Context {
    constructor(cfg) {
        cfg = cfg ?? {
            root: new val_1.NilVal()
        };
        super(cfg);
    }
}
class AontuError extends Error {
    constructor(msg, errs) {
        super(msg);
        this.errs = () => errs ?? [];
    }
}
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
    try {
        let opts = prepareOptions(src, popts);
        let deps = {};
        // TODO: handle empty src
        let val = parse(new lang_1.Lang(opts), opts, { deps });
        if (null == val) {
            val = new val_1.MapVal({ peg: {} });
        }
        let uni = new unify_1.Unify(val, undefined, undefined, opts.src);
        let res = uni.res;
        let err = uni.err;
        (0, err_1.descErr)(uni.err, { src: opts.src, fs: opts.fs });
        res.deps = deps;
        res.err = err;
        return res;
    }
    // NOTE: errors always return as Nil, and are never thrown.
    catch (err) {
        return new val_1.NilVal({ why: 'unknown', msg: err.message, err: [err] });
    }
}
function prepareOptions(src, popts) {
    // Convert convenience first param into Options.src
    let srcopts = 'string' === typeof src ? { src } :
        null == src ? {} : src;
    let opts = {
        ...{
            src: '',
            print: 0,
        },
        ...srcopts,
        ...(popts || {}),
    };
    opts.src = null == opts.src ? '' : opts.src;
    return opts;
}
function parse(lang, opts, ctx) {
    const val = lang.parse(opts.src, { src: opts.src, deps: ctx.deps, fs: opts.fs });
    return val;
}
const util = {
    parse,
    options: prepareOptions,
};
exports.util = util;
exports.default = Aontu;
//# sourceMappingURL=aontu.js.map