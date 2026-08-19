/* Copyright (c) 2021-2025 Richard Rodger, MIT License */



import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { StringVal } from '../val/StringVal'
import { ConjunctVal } from '../val/ConjunctVal'



import { FuncBaseVal } from './FuncBaseVal'
import { makeNilErr } from '../err'


class KeyFuncVal extends FuncBaseVal {
  isKeyFunc = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
    // this.dc = DONE
  }


  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new KeyFuncVal(spec)
  }

  funcname() {
    return 'key'
  }


  // `key()` is the first value to take THE STAGING RULE (G8 phase 0,
  // see AontuContext.settle): its answer is a segment of its own path,
  // so it must not answer while a spread, a reference or a `move` can
  // still move it. It residuates until the model stops changing, and
  // fires on the settle pass. The residuation itself is FuncBaseVal's,
  // shared with the generation combinators.
  staged = true


  resolve(ctx: AontuContext, _args: Val[]) {
    let out: Val = this

    // if (!this.mark.type && !this.mark.hide) {
    //
    // THE LEVEL MUST BE AN INTEGER, OR ABSENT.
    //
    // A level is an index into the path (0 the own key, the default 1 the
    // parent), so the argument is an integer or it is a mistake. Both
    // exact integer leaves qualify -- `integer` and `biginteger` -- and
    // everything else is refused rather than silently meaning "parent",
    // which is what made a mistyped level undetectable.
    //
    // This also removes a crash. The test used to be
    // `isNaN(move) ? 1 : +move` with the COERCING global isNaN, which is
    // ToNumber, and ToNumber THROWS for a bigint (a biginteger's peg) and
    // for the null-prototype object a map's peg is -- neither has a
    // toString or valueOf to call. The exception escaped into unify's
    // catch-all and surfaced as an opaque [aontu/internal].
    const argval: any = this.peg?.[0]
    let move = 1

    if (null != argval) {
      if (argval.isInteger) {
        move = argval.peg as number
      }
      else if (argval.isBigInteger) {
        // A level far outside the path simply misses, exactly as an
        // out-of-range plain integer already does, so Number() here needs
        // no bound of its own.
        move = Number(argval.peg as bigint)
      }
      else {
        return makeNilErr(ctx, 'key_level', this)
      }
    }

    // THE PATH IS THE ONE IT IS BEING DRIVEN AT, not the one it
    // remembers. `this.path` is a cache that the residuation clone
    // refreshes each pass, and it is right for a key() the bag walk
    // reaches directly -- but a key() nested inside a function or
    // operator ARGUMENT is never reached that way: it is driven by its
    // enclosing call, which re-paths nothing, so it kept the position
    // the SOURCE TEXT put it at. Inside a template that is fatal: the
    // source position of `&: {k: "x" + key()}` (or of `pack`'s
    // template) is the template, not any of the destinations, and the
    // parse-time path of a function argument is not a document
    // position at all.
    // A stored path is only usable if it IS one: a path segment that is
    // not a key is not a position, and the parse-time path of a value
    // written inside a function ARGUMENT carries exactly that -- the
    // argument has no key, so its segment is not a string. Those values
    // are also the ones the bag walk never re-paths (a call re-paths
    // nothing it holds), which is why the stored path stays wrong
    // forever rather than being refreshed on the next pass. For them
    // the driving context is the only truth. For everything else the
    // stored path stays authoritative, because a TRANSPLANTED value
    // (move(), a shared clone) must answer for where it was put, not
    // for whichever driver happened to reach it first.
    let positioned = true
    for (const seg of this.path) {
      if ('string' !== typeof seg) {
        positioned = false
        break
      }
    }

    const here = positioned ? this.path : ctx.path
    const key = here[here.length - (1 + move)] ?? ''
    // console.log('KEY', this.path, move, key)

    out = new StringVal({ peg: key })
    // }

    return out
  }


  gen(_ctx: AontuContext): any {
    return undefined
  }

} /* node:coverage ignore next 6 */


export {
  KeyFuncVal,
}
