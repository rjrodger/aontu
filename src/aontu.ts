/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

import type { Val, AontuOptions } from './type'

import { Lang } from './lang'
import { Unify } from './unify'
import { AontuContext, AontuContextConfig } from './ctx'
import { MapVal } from './val/MapVal'
import { formatExplain } from './utility'
import { makeNilErr, AontuError } from './err'


class Aontu {
  opts: Record<string, any> // AontuOptions
  lang: Lang


  constructor(popts?: Partial<AontuOptions>) {
    this.opts = popts ?? {}
    this.lang = new Lang(this.opts)
  }


  ctx(arg?: AontuContextConfig): AontuContext {
    arg = arg ?? {}
    return new AontuContext(arg)
  }


  parse(src: string, opts?: AontuOptions, ac?: AontuContext): Val | undefined {
    let out: Val | undefined
    let errs: any[] = []

    ac = ac ?? this.ctx()
    ac.addopts(opts)

    if (null == src || 'string' !== typeof src) {
      out = makeNilErr(ac, 'parse_bad_src')
      errs.push(out)
    }

    if (0 === errs.length) {
      out = runparse(src, this.lang, ac)
      out.deps = ac.deps
      ac.root = out
    }

    handleErrors(errs, out, ac)

    return out
  }


  // unify(src: string | Val, ac?: AontuContext | any): Val | undefined {
  unify(src: string | Val, opts?: AontuOptions, ac?: AontuContext | any): Val {
    let out: Val | undefined
    let errs: any[] = []

    ac = ac ?? this.ctx()
    ac.addopts(opts)

    let pval: Val | undefined

    if ('string' === typeof src) {
      pval = this.parse(src, undefined, ac)
    }
    else if (src.isVal) {
      pval = src
    }
    else {
      out = makeNilErr(ac, 'unify_no_src')
      errs.push(out)
    }

    if (null != pval && 0 === errs.length) {
      let uni = new Unify(pval, this.lang, ac, src)
      errs = uni.err

      out = uni.res

      if (null == out) {
        out = makeNilErr(ac, 'unify_no_res')
        if (0 === errs.length) {
          errs = [out]
        }
      }

      out.deps = pval.deps
      out.err = errs
      ac.root = out
    }

    handleErrors(errs, out, ac)

    return out as Val
  }


  generate(src: string, meta?: any): any {
    try {
      let out = undefined
      let ac = this.ctx({
        src,
        err: meta?.err,
        explain: meta?.explain,
        vars: meta?.vars,
      })
      let pval = this.parse(src, {}, ac)

      if (undefined !== pval && 0 === pval.err.length) {
        let uval = this.unify(pval, {}, ac)

        if (undefined !== uval && 0 === uval.err.length) {
          out = uval.isNil ? undefined : uval.gen(ac as any)

          if (0 < ac.err.length) {
            if (!ac.collect) {
              throw new AontuError(ac.errmsg(), ac.err)
            }
            out = undefined
          }
        }
      }

      return out
    }
    catch (err: any) {
      if (err instanceof AontuError) {
        throw err
      }
      const unex = new AontuError('Aontu: unexpected error: ' + err.message)
      Object.assign(unex, err)
      unex.stack = err.stack
      throw unex
    }
  }

}

function handleErrors(errs: any[], out: Val | undefined, ac: AontuContext) {
  errs.map((err: any) => ac.adderr(err))

  if (out) {
    out.err.map((err: any) => ac.adderr(err))
  }

  if (0 < ac.err.length) {
    if (ac.collect) {
      if (out) {
        out.err = ac.err
      }
    }
    else {
      throw new AontuError(ac.errmsg(), ac.err)
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


function prepareOptions(
  src?: string | Partial<AontuOptions>,
  popts?: Partial<AontuOptions>,
): AontuOptions {
  // Convert convenience first param into Options.src
  let srcopts: Partial<AontuOptions> = 'string' === typeof src ? { src } :
    null == src ? {} : src

  let opts: AontuOptions = {
    ...{
      src: '',
      print: 0,
    },
    ...srcopts,
    ...(popts || {}),
  }

  opts.src = null == opts.src ? '' : opts.src

  return opts
}


function runparse(src: string, lang: Lang, ctx: AontuContext): Val {
  const popts = {
    // src: ctx.src,
    deps: ctx.deps,
    fs: ctx.fs,
    path: ctx.opts.path
  }
  let val

  const tsrc = src.trim().replace(/^(\n\s*)+/, '')

  if ('string' === typeof src && '' !== tsrc) {
    val = lang.parse(src, popts)
  }

  if (undefined === val) {
    val = new MapVal({ peg: {} })
  }

  return val
}


const util = {
  runparse,
  options: prepareOptions,
}

export {
  Aontu,
  AontuOptions,
  AontuContext,

  Val,
  Lang,
  runparse,
  util,
  formatExplain
}

// export default AontuOld
export default Aontu
