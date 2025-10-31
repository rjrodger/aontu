/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

import type { Val, Options } from './type'

import { Lang } from './lang'
import { Unify, Context } from './unify'
import { NilVal, MapVal } from './val'
import { descErr } from './err'
import { formatExplain } from './utility'



type AontuOptions = {

}




class AontuX {
  opts: any // AontuOptions
  lang: Lang

  constructor(popts?: Partial<AontuOptions>) {
    this.opts = popts
    this.lang = new Lang(this.opts)
  }


  ctx(arg?: AontuContextConfig | AontuContext): AontuContext {
    return arg instanceof AontuContext ? arg :
      new AontuContext(arg)
  }


  parse(src: string, ac?: AontuContext): Val | undefined {
    if (!(ac instanceof Context)) {
      ac = this.ctx({ ...(ac ?? {}) })
    }

    const opts = prepareOptions(src, { ...this.opts })
    const deps = {}

    let val = parse(this.lang, opts, { deps })

    if (undefined === val) {
      val = new MapVal({ peg: {} })
    }

    val.deps = deps
    ac.root = val

    if (val.err && 0 < val.err.length) {
      val.err.map((err: any) => ac.adderr(err))

      if (!ac.collect) {
        throw new AontuError(ac.errmsg(), ac.err)
      }

      return undefined
    }

    return val
  }


  unify(src: string | Val, ac?: AontuContext | any): Val | undefined {
    if (!(ac instanceof Context)) {
      ac = this.ctx({ ...(ac ?? {}), src })
    }

    let pval = (src as Val).isVal ? src as Val : this.parse(src as string, ac)
    let osrc = 'string' === typeof src ? src : (ac.src ?? '')

    if (undefined === pval) {
      return undefined
    }

    let uni = new Unify(pval, this.lang, ac, osrc)
    let res = uni.res
    let err = uni.err

    res.deps = pval.deps
    res.err = err

    ac.root = res

    if (res.err && 0 < res.err.length) {
      if (!ac.collect) {
        throw new AontuError(ac.errmsg(), ac.err)
      }
    }

    return res
  }


  generate(src: string, meta?: any): any {
    try {
      let out = undefined
      let ac = this.ctx({
        src,
        err: meta?.err,
        explain: meta?.explain,
        var: meta?.var,
      })
      let pval = this.parse(src, ac)

      if (undefined !== pval && 0 === pval.err.length) {
        let uval = this.unify(pval, ac)

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



type AontuContextConfig = {
  root?: Val
  path?: []
  err?: Omit<NilVal[], "push">
  explain?: any[],
  vc?: number
  cc?: number
  var?: Record<string, Val>
  src?: string
  seenI?: number
  seen?: Record<string, number>
}


class AontuContext extends Context {
  constructor(cfg?: AontuContextConfig) {
    cfg = cfg ?? {
      root: new NilVal()
    }
    super(cfg as any)
  }

}



class AontuError extends Error {
  constructor(msg: string, errs?: NilVal[]) {
    super(msg)
    this.errs = () => errs ?? []
  }

  errs: () => NilVal[]
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
function Aontu(src?: string | Partial<Options>, popts?: Partial<Options>): Val {
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


function prepareOptions(
  src?: string | Partial<Options>,
  popts?: Partial<Options>,
): Options {
  // Convert convenience first param into Options.src
  let srcopts: Partial<Options> = 'string' === typeof src ? { src } :
    null == src ? {} : src

  let opts: Options = {
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


function parse(lang: Lang, opts: Options, ctx: { deps: any }): Val {
  const val = lang.parse(opts.src, { src: opts.src, deps: ctx.deps, fs: opts.fs })
  return val
}

const util = {
  parse,
  options: prepareOptions,
}

export {
  Aontu, Val, NilVal, Lang, Context, parse, util, AontuX,
  formatExplain

}

export default Aontu
