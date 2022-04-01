/* Copyright (c) 2021 Richard Rodger, MIT License */

import { Options } from './lib/common'
import { Lang, includeFileResolver } from './lib/lang'
import { Unify } from './lib/unify'
import { Val, Nil } from './lib/val'

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
function Aontu(src: string | Partial<Options>, popts?: Partial<Options>): Val {
  let opts = util.options(src, popts)

  let lang = new Lang(opts)
  let deps = {}
  let val = lang.parse(opts.src, { deps: deps })
  let uni = new Unify(val as unknown as Val)
  let res = uni.res
  let err = uni.err

  res.deps = deps
  res.err = err

  return res
}

const util = {
  options: (
    src: string | Partial<Options>,
    popts?: Partial<Options>
  ): Options => {
    // Convert convenience first param into Options.src
    let srcopts: Partial<Options> = 'string' === typeof src ? { src } : src

    let opts: Options = {
      ...{
        src: '',
        print: 0,
        resolver: includeFileResolver,
      },
      ...srcopts,
      ...(popts || {}),
    }
    return opts
  },
}

export { Aontu, Val, Nil, Lang, util }
export default Aontu
