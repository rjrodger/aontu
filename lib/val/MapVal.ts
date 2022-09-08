/* Copyright (c) 2021 Richard Rodger, MIT License */



import type {
  Val,
  ValMap,
} from '../type'

import {
  DONE,
  TOP,
} from '../type'

import {
  Context,
} from '../unify'


import {
  Site
} from '../lang'


import {
  unite
} from '../op/op'

import {
  ValBase,
} from '../val/ValBase'

import {
  Nil,
} from './Nil'

import {
  ConjunctVal,
} from './ConjunctVal'






class MapVal extends ValBase {
  static SPREAD = Symbol('spread')

  spread = {
    cj: (undefined as Val | undefined),
  }

  constructor(peg: ValMap, ctx?: Context) {
    super(peg, ctx)

    let spread = (this.peg as any)[MapVal.SPREAD]
    delete (this.peg as any)[MapVal.SPREAD]

    if (spread) {
      if ('&' === spread.o) {
        // TODO: handle existing spread!
        this.spread.cj =
          new ConjunctVal(Array.isArray(spread.v) ? spread.v : [spread.v], ctx)
      }
    }
  }

  // NOTE: order of keys is not preserved!
  // not possible in any case - consider {a,b} unify {b,a}
  unify(peer: Val, ctx: Context): Val {
    let done: boolean = true
    let out: MapVal = TOP === peer ? this : new MapVal({}, ctx)

    out.spread.cj = this.spread.cj

    if (peer instanceof MapVal) {
      out.spread.cj = null == out.spread.cj ? peer.spread.cj : (
        null == peer.spread.cj ? out.spread.cj : (
          out.spread.cj = new ConjunctVal([out.spread.cj, peer.spread.cj], ctx)
        )
      )
    }


    out.done = this.done + 1

    if (this.spread.cj) {
      //out.spread.cj =
      //  DONE !== this.spread.cj.done ? this.spread.cj.unify(TOP, ctx) :
      //    this.spread.cj
      out.spread.cj =
        DONE !== this.spread.cj.done ? unite(ctx, this.spread.cj) :
          this.spread.cj

    }


    // console.log(
    //   ('  '.repeat(ctx.path.length)),
    //   'MV spread', this.id, peer.id, out.id, '|',
    //   this.canon, peer.canon, out.canon, '|',
    //   (this.spread.cj || {}).done,
    //   (this.spread.cj || {}).canon, (out.spread.cj || {}).canon)

    let spread_cj = out.spread.cj || TOP

    // Always unify children first
    for (let key in this.peg) {
      //let oval = out.peg[key] = this.peg[key].unify(spread_cj, ctx.descend(key))
      //let oval =

      out.peg[key] =
        unite(ctx.descend(key), this.peg[key], spread_cj)

      done = (done && DONE === out.peg[key].done)

      //if (oval instanceof Nil) {
      // ctx.err.push(oval)
      //}
    }

    // console.log(
    //   ('  '.repeat(ctx.path.length)),
    //   'MV child ', this.id, peer.id, out.id, '|',
    //   this.canon, peer.canon, out.canon, '|',
    //   this.constructor.name,
    //   peer.constructor.name,
    //   out.constructor.name,
    // )

    if (peer instanceof MapVal) {
      //let upeer: MapVal = (peer.unify(TOP, ctx) as MapVal)
      let upeer: MapVal = (unite(ctx, peer) as MapVal)

      // console.log(
      //   ('  '.repeat(ctx.path.length)),
      //   'MV peer A', this.id, peer.id, out.id, '|',
      //   Object.keys(this.peg), Object.keys(upeer.peg), Object.keys(out.peg))

      for (let peerkey in upeer.peg) {
        let peerchild = upeer.peg[peerkey]
        let child = out.peg[peerkey]

        let oval = out.peg[peerkey] =
          undefined === child ? peerchild :
            child instanceof Nil ? child :
              peerchild instanceof Nil ? peerchild :
                //child.unify(peerchild, ctx.descend(peerkey))
                unite(ctx.descend(peerkey), child, peerchild)

        if (this.spread.cj) {
          //out.peg[peerkey] = out.peg[peerkey].unify(spread_cj, ctx)
          out.peg[peerkey] = unite(ctx, out.peg[peerkey], spread_cj)
        }

        done = (done && DONE === oval.done)

        if (oval instanceof Nil) {
          // ctx.err.push(oval)
        }

      }

      // console.log(
      //   ('  '.repeat(ctx.path.length)),
      //   'MV peer B', this.id, peer.id, out.id, '|',
      //   Object.keys(this.peg), Object.keys(upeer.peg), Object.keys(out.peg))

      //out.done = done ? DONE : out.done

      // console.log(' '.repeat(W) + 'MV OUT A', this.id, out.done, out.id, out.canon)//this.spread.cj, out.spread.cj)

      // console.log(
      //   ('  '.repeat(ctx.path.length)),
      //   'MV out ', this.id, peer.id, out.id, '|',
      //   this.canon, peer.canon, out.canon, '|',
      //   this.constructor.name,
      //   peer.constructor.name,
      //   out.constructor.name,
      // )


    }
    else if (TOP !== peer) {
      //out.done = done ? DONE : out.done

      //return (UNIFIER(out, peer, ctx) as MapVal)

      return Nil.make(ctx, 'map', this, peer)
    }

    out.done = done ? DONE : out.done
    return out
  }

  get canon() {
    let keys = Object.keys(this.peg)
    return '{' +
      (this.spread.cj ? '&:' + this.spread.cj.canon +
        (0 < keys.length ? ',' : '') : '') +
      keys
        .map(k => [JSON.stringify(k) + ':' + this.peg[k].canon]).join(',') +
      '}'
  }

  gen(ctx?: Context) {
    let out: any = {}
    for (let p in this.peg) {
      out[p] = this.peg[p].gen(ctx)
    }
    return out
  }
}





export {
  MapVal
}
