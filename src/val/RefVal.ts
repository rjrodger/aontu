/* Copyright (c) 2021-2023 Richard Rodger, MIT License */


/* TODO
   Rename ot PathVal
   
   $SELF.a - path starting at self
   $PARENT.b === .b - sibling

   implement $ as a prefix operator
   this allows "$AString" to be used for literal part names
*/



import type {
  Val,
  ValSpec,
} from '../type'

import {
  DONE,
} from '../type'

import {
  descErr
} from '../err'

import {
  Context,
} from '../unify'

import {
  unite
} from '../op/op'

import { TOP, StringVal } from '../val'
import { ConjunctVal } from './ConjunctVal'
import { MapVal } from './MapVal'
import { Nil } from './Nil'
import { VarVal } from './VarVal'
import { ValBase } from './ValBase'





class RefVal extends ValBase {
  isRefVal = true

  absolute: boolean = false
  prefix: boolean = false

  constructor(
    spec: {
      peg: any[],
      absolute?: boolean,
      prefix?: boolean
    },
    ctx?: Context
  ) {
    super(spec, ctx)
    this.peg = []

    this.absolute = true === this.absolute ? true : // absolute sticks
      true === spec.absolute ? true : false

    this.prefix = true === spec.prefix

    for (let pI = 0; pI < spec.peg.length; pI++) {
      this.append(spec.peg[pI])
    }
  }


  append(part: any) {
    let partval

    if ('string' === typeof part) {
      partval = part
      this.peg.push(partval)
    }

    else if (part instanceof StringVal) {
      partval = part.peg
      this.peg.push(partval)
    }

    else if (part instanceof VarVal) {
      partval = part
      this.peg.push(partval)
    }

    else if (part instanceof RefVal) {
      if (part.absolute) {
        this.absolute = true
      }

      if (this.prefix) {
        if (part.prefix) {
          this.peg.push('.')
        }
      }
      else {
        if (part.prefix) {
          if (0 === this.peg.length) {
            this.prefix = true
          }

          else if (0 < this.peg.length) {
            this.peg.push('.')
          }
        }
      }

      this.peg.push(...part.peg)
    }
  }


  unify(peer: Val, ctx: Context): Val {
    let out: Val = this
    // let why = 'id'

    if (this.id !== peer.id) {

      // TODO: not resolved when all Vals in path are done is an error
      // as path cannot be found
      // let resolved: Val | undefined = null == ctx ? this : ctx.find(this)
      let found: Val | undefined = null == ctx ? this : this.find(ctx)

      const resolved = found ?? this

      // const resolved = found ? found.clone(null, ctx) : this
      // console.log('REF', this.id, this.peg, '->',
      //  found?.id, found?.canon, 'C=', resolved?.id, resolved?.canon)

      if (null == resolved && this.canon === peer.canon) {
        out = this
      }
      else if (resolved instanceof RefVal) {
        if (TOP === peer) {
          out = this
          // why = 'pt'
        }
        else if (peer instanceof Nil) {
          out = Nil.make(ctx, 'ref[' + this.peg + ']', this, peer)
          // why = 'pn'
        }

        // same path
        // else if (this.peg === peer.peg) {
        else if (this.canon === peer.canon) {
          out = this
          // why = 'pp'
        }

        else {
          // Ensure RefVal done is incremented
          this.dc = DONE === this.dc ? DONE : this.dc + 1
          out = new ConjunctVal({ peg: [this, peer] }, ctx)
          // why = 'cj'
        }
      }
      else {
        out = unite(ctx, resolved, peer, 'ref')
        // why = 'u'
      }

      out.dc = DONE === out.dc ? DONE : this.dc + 1
    }

    // console.log('REF:', this.peg, '->', out.canon)
    return out
  }


  find(ctx: Context) {
    // TODO: relative paths
    // if (this.root instanceof MapVal && ref.absolute) {

    // NOTE: path *to* the ref, not the ref itself!
    let fullpath = this.path

    let parts: string[] = []

    let modes: string[] = []

    for (let pI = 0; pI < this.peg.length; pI++) {
      let part = this.peg[pI]
      if (part instanceof VarVal) {
        let strval = (part as VarVal).peg
        let name = strval ? '' + strval.peg : ''

        if ('KEY' === name) {
          if (pI === this.peg.length - 1) {
            modes.push(name)
          }
          else {
            // TODO: return a Nil explaining error
            return
          }
        }

        if ('SELF' === name) {
          if (pI === 0) {
            modes.push(name)
          }
          else {
            // TODO: return a Nil explaining error
            return
          }
        }
        else if ('PARENT' === name) {
          if (pI === 0) {
            modes.push(name)
          }
          else {
            // TODO: return a Nil explaining error
            return
          }
        }
        else if (0 === modes.length) {
          part = (part as VarVal).unify(TOP, ctx)
          if (part instanceof Nil) {
            // TODO: var not found, so can't find path
            return
          }
          else {
            part = '' + part.peg
          }
        }
      }
      else {
        parts.push(part)
      }
    }

    if (this.absolute) {
      fullpath = parts
    }
    else {
      fullpath = fullpath.slice(
        0,
        (
          modes.includes('SELF') ? 0 :
            modes.includes('PARENT') ? -1 :
              -1 // siblings
        )
      ).concat(parts)
    }

    let sep = '.'
    fullpath = fullpath
      .reduce(((a: string[], p: string) =>
        (p === sep ? a.length = a.length - 1 : a.push(p), a)), [])

    if (modes.includes('KEY')) {
      let key = this.path[this.path.length - 2]
      let sv = new StringVal({ peg: null == key ? '' : key }, ctx)

      // TODO: other props?
      sv.dc = DONE
      sv.path = this.path

      return sv
    }

    let node = ctx.root
    let pI = 0
    for (; pI < fullpath.length; pI++) {
      let part = fullpath[pI]

      if (node instanceof MapVal) {
        node = node.peg[part]
      }
      else {
        break;
      }
    }

    if (pI === fullpath.length) {
      return node
    }
  }


  same(peer: Val): boolean {
    return null == peer ? false : this.peg === peer.peg
  }


  clone(ctx: Context, spec?: ValSpec): Val {
    let out = (super.clone(ctx, {
      peg: this.peg,
      absolute: this.absolute,
      ...(spec || {})
    }) as RefVal)
    return out
  }


  get canon() {
    let str =
      (this.absolute ? '$' : '') +
      (0 < this.peg.length ? '.' : '') +
      // this.peg.join(this.sep)
      this.peg.map((p: any) => '.' === p ? '' :
        (p.isVal ? p.canon : '' + p))
        .join('.')
    return str
  }


  gen(ctx?: Context) {
    // Unresolved ref cannot be generated, so always an error.
    let nil = Nil.make(
      ctx,
      'ref',
      this, // (formatPath(this.peg, this.absolute) as any),
      undefined
    )

    // TODO: refactor to use Site
    nil.path = this.path
    nil.url = this.url
    nil.row = this.row
    nil.col = this.col

    descErr(nil, ctx)

    if (ctx) {
      // ctx.err.push(nil)
      ctx.adderr(nil)
    }
    else {
      throw new Error(nil.msg)
    }

    return undefined
  }
}


export {
  RefVal,
}
