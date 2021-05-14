

import { Resolver } from '@jsonic/multisource'



type Options = {
  src: string,    // Source text.
  print: number,  // Print debug verbosity
  resolver?: Resolver, // Source resolver
  base?: string, // Base path for resolver
}



export {
  Options,
  Resolver,
}
