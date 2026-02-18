/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

// FIX: 1+2+3


import type { Val, AontuOptions } from './type'

import { Lang } from './lang'
import { Unify } from './unify'
import { AontuContext, AontuContextConfig } from './ctx'
import { MapVal } from './val/MapVal'
import { formatExplain } from './utility'
import { makeNilErr, AontuError } from './err'



class Aontu {
  opts: AontuOptions
  lang: Lang


  constructor(popts?: AontuOptions) {
    this.opts = popts ?? {}
    this.lang = new Lang(this.opts)
  }


  // Create a new context.
  ctx(cfg?: AontuContextConfig): AontuContext {
    cfg = cfg ?? {}
    cfg.fs = cfg.fs ?? this.opts.fs
    const ac = new AontuContext(cfg)
    return ac
  }


  // Parse source into a matching Val AST, not yet unified.
  parse(src: string, opts?: AontuOptions, ac?: AontuContext): Val | undefined {
    let out: Val | undefined
    let errs: any[] = []

    if (null == src) {
      src = ''
    }

    ac = ac ?? this.ctx()
    ac.addopts({ ...(opts ?? {}), src })

    if ('string' !== typeof src) {
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


  // Unify source or Val, returning a fully unified Val.
  unify(src: string | Val, opts?: AontuOptions, ac?: AontuContext | any): Val {
    let out: Val | undefined
    let errs: any[] = []

    ac = ac ?? this.ctx()
    ac.addopts({ ...(opts ?? {}), src })

    let pval: Val | undefined

    if (null == src) {
      src = ''
    }

    if ('string' === typeof src) {
      pval = this.parse(src, undefined, ac)
    }
    else if (src && src.isVal) {
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


  // Generate output structure from source, which must parse and fully unify.
  generate(src: string, opts?: any, ac?: AontuContext): any {
    try {
      let out = undefined

      ac = ac ?? this.ctx()
      ac.addopts({ ...(opts ?? {}), src })

      let pval = this.parse(src, undefined, ac)

      if (undefined !== pval && 0 === pval.err.length) {

        let uval = this.unify(pval, undefined, ac)
        // console.log('AONTU-GENERATE-UVAL', uval.constructor, uval.mark)

        if (undefined !== uval && 0 === uval.err.length) {

          out = uval.isNil ? (ac.adderr(uval as any), undefined) : uval.gen(ac as any)

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
      if (err instanceof AontuError || true === err.aontu) {
        throw err
      }
      const unex = new AontuError('Aontu: unexpected error: ' + err.message)
      Object.assign(unex, err)
      unex.stack = err.stack
      throw unex
    }
  }
}


// Either throw an exception or add collected errors to result.
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


// Perform parse of source code (minor customizations over Lang.parse).
function runparse(src: string, lang: Lang, ctx: AontuContext): Val {
  const popts = {
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
}


export {
  Aontu,
  AontuOptions,
  AontuContext,
  AontuError,

  Val,
  Lang,
  runparse,
  util,
  formatExplain
}


export default Aontu
