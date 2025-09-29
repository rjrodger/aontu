/* Copyright (c) 2021-2024 Richard Rodger, MIT License */

import type { Val, Options, FST } from './type'

import { Lang } from './lang'
import { Unify, Context } from './unify'
import { Nil } from './val/Nil'
import { MapVal } from './val/MapVal'
import { descErr } from './err'

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
function Aontu(src?: string | Partial<Options>, popts?: Partial<Options>): Val {
  try {
    let opts = prepareOptions(src, popts)
    let deps = {}

    // TODO: handle empty src
    let val = parse(opts, { deps })

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
    return new Nil({ why: 'unknown', msg: err.message, err: [err] })
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


function parse(opts: Options, ctx: { deps: any }): Val {
  const lang = new Lang(opts)
  const val = lang.parse(opts.src, { src: opts.src, deps: ctx.deps, fs: opts.fs })
  return val
}

const util = {
  parse,
  options: prepareOptions,
}

export { Aontu, Val, Nil, Lang, Context, parse, util }

export default Aontu
