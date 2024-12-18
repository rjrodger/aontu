/* Copyright (c) 2021-2024 Richard Rodger, MIT License */

import type { Val, Options } from './lib/type'

import { Lang } from './lib/lang'
import { Unify, Context } from './lib/unify'
import { Nil } from './lib/val/Nil'
import { descErr } from './lib/err'

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
function Aontu(src: string | Partial<Options>, popts?: Partial<Options>): Val {
  let opts = util.options(src, popts)

  // console.log('OPTS', opts)

  let deps = {}

  // TODO: handle empty src
  let val = util.parse(opts, { deps })
  let uni = new Unify(val as unknown as Val)
  let res = uni.res
  let err = uni.err

  descErr(uni.err, { src: opts.src })

  res.deps = deps
  res.err = err

  return res
}

const util = {
  options: (
    src: string | Partial<Options>,
    popts?: Partial<Options>,
  ): Options => {
    // Convert convenience first param into Options.src
    let srcopts: Partial<Options> = 'string' === typeof src ? { src } : src

    let opts: Options = {
      ...{
        src: '',
        print: 0,
      },
      ...srcopts,
      ...(popts || {}),
    }
    return opts
  },

  parse(opts: Options, ctx: { deps: any }): Val {
    let lang = new Lang(opts)
    let val = lang.parse(opts.src, { deps: ctx.deps })
    return val
  },
}

export { Aontu, Val, Nil, Lang, Context, util }
export default Aontu
