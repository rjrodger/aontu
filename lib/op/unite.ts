/* Copyright (c) 2021-2022 Richard Rodger, MIT License */


import type { Val } from '../type'

import { DONE, TOP } from '../type'
import { Context } from '../unify'

import { ConjunctVal } from '../val/ConjunctVal'
import { DisjunctVal } from '../val/DisjunctVal'
import { PrefVal } from '../val/PrefVal'
import { RefVal } from '../val/RefVal'
import { Nil } from '../val/Nil'




import { Operation } from './op'


// Vals should only have to unify downwards (in .unify) over Vals they understand.
// and for complex Vals, TOP, which means self unify if not yet done
const unite: Operation = (ctx: Context, a?: Val, b?: Val, whence?: string) => {
  let out = a

  // console.log('AA OP unite  IN', a?.canon, b?.canon,
  //   'W', whence,
  //   'E', 0 < ctx?.err?.length ? ctx.err.map((e: Val) => e.canon) : '')


  if (b && (TOP === a || !a)) {
    //console.log('Utb', b.canon)
    out = b
  }

  else if (a && (TOP === b || !b)) {
    //console.log('Uta', a.canon)
    out = a
  }

  else if (a && b && TOP !== b) {
    if (a instanceof Nil) {
      out = update(a, b)
    }
    else if (b instanceof Nil) {
      out = update(b, a)
    }
    else if (a instanceof ConjunctVal) {
      // console.log('Q', a.canon, b.canon)
      out = a.unify(b, ctx)
    }
    else if (
      b instanceof ConjunctVal ||
      b instanceof DisjunctVal ||
      b instanceof RefVal ||
      b instanceof PrefVal
    ) {

      // console.log('U', a.canon, b.canon)
      // return b.unify(a, ctx)
      out = b.unify(a, ctx)
      // console.log('UO', out.canon)
    }

    // Exactly equal scalars.
    else if (a.constructor === b.constructor && a.peg === b.peg) {
      out = update(a, b)
    }

    else {
      out = a.unify(b, ctx)
    }
  }

  if (!out || !out.unify) {
    out = Nil.make(ctx, 'unite', a, b)
  }

  if (DONE !== out.done) {
    out = out.unify(TOP, ctx)
  }

  // console.log('AA OP unite OUT', a?.canon, b?.canon, '->', out && out.canon,
  //   0 < ctx?.err?.length ? ctx.err.map((e: Val) => e.canon) : '')

  return out
}


function update(x: Val, _y: Val) {
  // TODO: update x with y.site
  return x
}


export {
  unite
}
