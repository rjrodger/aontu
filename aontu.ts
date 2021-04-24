/* Copyright (c) 2021 Richard Rodger, MIT License */


import { Options } from './lib/common'
import { Lang } from './lib/lang'
import { Unify } from './lib/unify'


// TODO: error reporting
// TODO: debug tracing
// TODO: providers - e.g source files from paths


type Val = {
  canon: string
  gen: (log: any[]) => any
}


/* `Aontu('a:1') => opts={src:'a:1',print:0,...}`
 * `Aontu('a:1',{print:1}) => opts={src:'a:1',print:1,...}`
 * `Aontu({src:'a:1'},{src:'a:2'}) => opts={src:'a:2',print:0,...}`
 */
function Aontu(src: string | Partial<Options>, popts?: Partial<Options>): Val {
  let opts = util.options(src, popts)
  let lang = new Lang(opts)
  let val = lang.parse(opts.src)
  let uni = new Unify(val)
  return uni.res
}


const util = {
  options: (src: string | Partial<Options>, popts?: Partial<Options>): Options => {
    let srcopts: Partial<Options> = 'string' === typeof (src) ? { src } : src
    let opts: Options = {
      ...{
        src: '',
        print: 0,
      },
      ...srcopts,
      ...(popts || {})
    }
    return opts
  }
}


export {
  Aontu,
  Val,
  util,
}
export default Aontu


