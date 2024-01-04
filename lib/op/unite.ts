/* Copyright (c) 2021-2023 Richard Rodger, MIT License */



import type { Val } from '../type'

import { DONE } from '../type'
import { Context } from '../unify'


import { ConjunctVal } from '../val/ConjunctVal'
import { DisjunctVal } from '../val/DisjunctVal'
import { ListVal } from '../val/ListVal'
import { MapVal } from '../val/MapVal'
import { Nil } from '../val/Nil'
import { PrefVal } from '../val/PrefVal'
import { RefVal } from '../val/RefVal'
import { ValBase } from '../val/ValBase'


import {
  TOP,
} from '../val'


import { Operation } from './op'


let uc = 0


// Vals should only have to unify downwards (in .unify) over Vals they understand.
// and for complex Vals, TOP, which means self unify if not yet done
const unite: Operation = (ctx: Context, a?: any, b?: any, whence?: string) => {
  let out = a
  let why = 'u'
  // console.log('AA OP unite  IN', a?.canon, b?.canon,
  //   'W', whence,
  //   'E', 0 < ctx?.err?.length ? ctx.err.map((e: Val) => e.canon) : '')

  let unified = false

  if (b && (TOP === a || !a)) {
    //console.log('Utb', b.canon)
    out = b
    why = 'b'
  }

  else if (a && (TOP === b || !b)) {
    //console.log('Uta', a.canon)
    out = a
    why = 'a'
  }

  else if (a && b && TOP !== b) {
    if (a.isNil) {
      out = update(a, b)
      why = 'an'
    }
    else if (b.isNil) {
      out = update(b, a)
      why = 'bn'
    }
    else if (a.isConjunctVal) {
      // console.log('Q', a.canon, b.canon)
      out = a.unify(b, ctx)
      unified = true
      why = 'acj'
    }
    else if (
      b.isConjunctVal ||
      b.isDisjunctVal ||
      b.isRefVal ||
      b.isPrefVal
    ) {

      // console.log('U', a.canon, b.canon)
      // return b.unify(a, ctx)
      out = b.unify(a, ctx)
      unified = true
      // console.log('UO', out.canon)
      why = 'bv'
    }

    // Exactly equal scalars.
    else if (a.constructor === b.constructor && a.peg === b.peg) {
      out = update(a, b)
      why = 'up'
    }

    else {
      // console.log('QQQ')
      out = a.unify(b, ctx)
      unified = true
      why = 'ab'
    }
  }

  if (!out || !out.unify) {
    out = Nil.make(ctx, 'unite', a, b)
    why += 'N'
  }

  if (DONE !== out.done && !unified) {
    out = out.unify(TOP, ctx)
    why += 'T'
  }

  // console.log('AA OP unite OUT', a?.canon, b?.canon, '->', out && out.canon,
  //   0 < ctx?.err?.length ? ctx.err.map((e: Val) => e.canon) : '')

  uc++

  // TODO: KEEP THIS! print in debug mode! push to ctx.log?
  /*
  console.log(
    'U',
    ('' + ctx.cc).padStart(2),
    ('' + uc).padStart(4),
    (whence || '').substring(0, 16).padEnd(16),
    why.padEnd(6),
    ctx.path.join('.').padEnd(16),
    (a || '').constructor.name.substring(0, 3),
    '&',
    (b || '').constructor.name.substring(0, 3),
    '|',
    '  '.repeat(ctx.path.length),
    a?.canon, '&', b?.canon, '->', out.canon)
  */

  return out
}


function update(x: Val, _y: Val) {
  // TODO: update x with y.site
  return x
}


export {
  unite
}
