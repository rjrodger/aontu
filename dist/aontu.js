"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatExplain = exports.util = exports.Lang = exports.AontuContext = exports.Aontu = void 0;
exports.runparse = runparse;
const lang_1 = require("./lang");
Object.defineProperty(exports, "Lang", { enumerable: true, get: function () { return lang_1.Lang; } });
const unify_1 = require("./unify");
const ctx_1 = require("./ctx");
Object.defineProperty(exports, "AontuContext", { enumerable: true, get: function () { return ctx_1.AontuContext; } });
const MapVal_1 = require("./val/MapVal");
const utility_1 = require("./utility");
Object.defineProperty(exports, "formatExplain", { enumerable: true, get: function () { return utility_1.formatExplain; } });
const err_1 = require("./err");
class Aontu {
    constructor(popts) {
        this.opts = popts ?? {};
        this.lang = new lang_1.Lang(this.opts);
    }
    ctx(arg) {
        arg = arg ?? {};
        return new ctx_1.AontuContext(arg);
    }
    parse(src, opts, ac) {
        let out;
        let errs = [];
        ac = ac ?? this.ctx();
        ac.addopts(opts);
        if (null == src || 'string' !== typeof src) {
            out = (0, err_1.makeNilErr)(ac, 'parse_bad_src');
            errs.push(out);
        }
        if (0 === errs.length) {
            out = runparse(src, this.lang, ac);
            out.deps = ac.deps;
            ac.root = out;
        }
        handleErrors(errs, out, ac);
        return out;
    }
    // unify(src: string | Val, ac?: AontuContext | any): Val | undefined {
    unify(src, opts, ac) {
        let out;
        let errs = [];
        ac = ac ?? this.ctx();
        ac.addopts(opts);
        let pval;
        if ('string' === typeof src) {
            pval = this.parse(src, undefined, ac);
        }
        else if (src.isVal) {
            pval = src;
        }
        else {
            out = (0, err_1.makeNilErr)(ac, 'unify_no_src');
            errs.push(out);
        }
        if (null != pval && 0 === errs.length) {
            let uni = new unify_1.Unify(pval, this.lang, ac, src);
            errs = uni.err;
            out = uni.res;
            if (null == out) {
                out = (0, err_1.makeNilErr)(ac, 'unify_no_res');
                if (0 === errs.length) {
                    errs = [out];
                }
            }
            out.deps = pval.deps;
            out.err = errs;
            ac.root = out;
        }
        handleErrors(errs, out, ac);
        return out;
    }
    generate(src, meta) {
        try {
            let out = undefined;
            let ac = this.ctx({
                src,
                err: meta?.err,
                explain: meta?.explain,
                vars: meta?.vars,
            });
            let pval = this.parse(src, {}, ac);
            if (undefined !== pval && 0 === pval.err.length) {
                let uval = this.unify(pval, {}, ac);
                if (undefined !== uval && 0 === uval.err.length) {
                    out = uval.isNil ? undefined : uval.gen(ac);
                    if (0 < ac.err.length) {
                        if (!ac.collect) {
                            throw new err_1.AontuError(ac.errmsg(), ac.err);
                        }
                        out = undefined;
                    }
                }
            }
            return out;
        }
        catch (err) {
            if (err instanceof err_1.AontuError) {
                throw err;
            }
            const unex = new err_1.AontuError('Aontu: unexpected error: ' + err.message);
            Object.assign(unex, err);
            unex.stack = err.stack;
            throw unex;
        }
    }
}
exports.Aontu = Aontu;
function handleErrors(errs, out, ac) {
    errs.map((err) => ac.adderr(err));
    if (out) {
        out.err.map((err) => ac.adderr(err));
    }
    if (0 < ac.err.length) {
        if (ac.collect) {
            if (out) {
                out.err = ac.err;
            }
        }
        else {
            throw new err_1.AontuError(ac.errmsg(), ac.err);
        }
    }
}
/*
class AontuContext extends Context {
  constructor(cfg?: AontuContextConfig) {
    cfg = cfg ?? {
      root: new NilVal()
    }
    if ('string' === typeof cfg.path) {
      cfg.srcpath = cfg.path
      cfg.path = undefined
    }
    super(cfg as any)
  }

}
*/
/*
  function AontuOld(src?: string | Partial<Options>, popts?: Partial<Options>): Val {
  try {
    let opts = prepareOptions(src, popts)
    let deps = {}

    // TODO: handle empty src
    let val = parse(new Lang(opts), opts, { deps })

    if (null == val) {
      val = new MapVal({ peg: {} })
    }

    let uni = new Unify(val as unknown as Val, undefined, undefined, opts.src)
    let res = uni.res
    let err = uni.err

    descErr(uni.err, { src: opts.src, fs: opts.fs })

    res.deps = deps
    res.err = err

    return res
  }

  // NOTE: errors always return as Nil, and are never thrown.
  catch (err: any) {
    return new NilVal({ why: 'unknown', msg: err.message, err: [err] })
  }
}
*/
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
function runparse(src, lang, ctx) {
    const popts = {
        // src: ctx.src,
        deps: ctx.deps,
        fs: ctx.fs,
        path: ctx.opts.path
    };
    let val;
    const tsrc = src.trim().replace(/^(\n\s*)+/, '');
    if ('string' === typeof src && '' !== tsrc) {
        val = lang.parse(src, popts);
    }
    if (undefined === val) {
        val = new MapVal_1.MapVal({ peg: {} });
    }
    return val;
}
const util = {
    runparse,
    options: prepareOptions,
};
exports.util = util;
// export default AontuOld
exports.default = Aontu;
//# sourceMappingURL=aontu.js.map