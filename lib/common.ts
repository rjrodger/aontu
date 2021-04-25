

import { Jsonic, Context } from 'jsonic'

type Options = {
  src: string,    // Source text.
  print: number,  // Print debug verbosity
  resolver: Resolver
}

type Resolver = (path: string, jsonic: Jsonic, ctx: Context, opts: any) => any



export {
  Options
}
