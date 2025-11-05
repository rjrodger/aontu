/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import {
  walk,
  explainOpen,
  ec,
  explainClose,
} from '../utility'


import type {
  Val,
  ValSpec,
} from '../type'

import {
  DONE,
} from '../type'

import { AontuContext } from '../ctx'
import { unite } from '../unify'


import {
  top
} from './valutil'


import { StringVal } from './StringVal'
import { IntegerVal } from './IntegerVal'
import { NumberVal } from './NumberVal'
import { ConjunctVal } from './ConjunctVal'
import { NilVal } from './NilVal'
import { VarVal } from './VarVal'
import { FeatureVal } from './FeatureVal'



class RefVal extends FeatureVal {
  isRef = true

  absolute: boolean = false
  prefix: boolean = false

  constructor(
    spec: {
      peg: any[],
      absolute?: boolean,
      prefix?: boolean
    },
    ctx?: AontuContext
  ) {
    super(spec, ctx)
    this.peg = []

    this.absolute = true === this.absolute ? true : // absolute sticks
      true === spec.absolute ? true : false

    this.prefix = true === spec.prefix

    for (let pI = 0; pI < spec.peg.length; pI++) {
      this.append(spec.peg[pI])
    }

    //console.log('RefVal', this.id, this.peg)
  }


  append(part: any) {
    let partval

    // console.log('APPEND', part)

    if ('string' === typeof part) {
      partval = part
      this.peg.push(partval)
    }

    else if (part instanceof StringVal) {
      partval = part.peg
      this.peg.push(partval)
    }

    else if (part instanceof IntegerVal) {
      // partval = '' + part.peg
      partval = part.src
      this.peg.push(partval)
    }

    // TODO: this is a bit of a hack, review
    // Seems like a fundamental ambiguity?
    // Resolved by path function
    else if (part instanceof NumberVal) {
      // let partvals: string[] = part.peg.toFixed(11).replace(/(\.0)?0+$/, '$1').split('.')
      let partvals: string[] = part.src.split('.')
      this.peg.push(...partvals)
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


  unify(peer: Val, ctx: AontuContext, trace?: any[]): Val {
    peer = peer ?? top()

    const te = ctx.explain && explainOpen(ctx, trace, 'Ref', this, peer)
    let out: Val = this
    // let why = 'id'

    if (this.id !== peer.id) {

      // TODO: not resolved when all Vals in path are done is an error
      // as path cannot be found
      // let resolved: Val | undefined = null == ctx ? this : ctx.find(this)
      let found: Val | undefined = null == ctx ? this : this.find(ctx)

      const resolved = found ?? this

      if (null == resolved && this.canon === peer.canon) {
        out = this
      }
      else if (resolved instanceof RefVal) {
        if (peer.isTop) {
          out = this
          // why = 'pt'
        }
        else if (peer.isNil) {
          out = NilVal.make(ctx, 'ref[' + this.peg + ']', this, peer)
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
        out = unite(ctx, resolved, peer, 'ref', ec(te, 'RES'))
        // why = 'u'
      }

      out.dc = DONE === out.dc ? DONE : this.dc + 1
    }

    explainClose(te, out)
    return out
  }


  find(ctx: AontuContext) {
    let out: Val | undefined = undefined

    if (this.path.join('.').startsWith(this.peg.join('.'))) {
      out = NilVal.make(ctx, 'path-cycle', this)
    }
    else {

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
            part = (part as VarVal).unify(top(), ctx)
            if (part.isNil) {
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

      let refpath: string[] = []

      if (this.absolute) {
        refpath = parts
      }
      else {
        // TODO: deprecate $KEY, etc
        refpath = this.path.slice(
          0,
          (
            modes.includes('SELF') ? 0 :
              modes.includes('PARENT') ? -1 :
                -1 // siblings
          )
        ).concat(parts)
      }

      let sep = '.'
      refpath = refpath
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

      let node = ctx.root as Val
      let pI = 0

      if (null != node) {
        for (; pI < refpath.length; pI++) {
          let part = refpath[pI]

          if (node.isMap) {
            node = node.peg[part]
          }
          else if (node.isList) {
            node = node.peg[part]
          }
          else {
            break;
          }
        }
      }

      if (pI === refpath.length) {
        out = node

        // Types and hidden values are cloned and made concrete
        if (null != out && (out.mark.type || out.mark.hide)) {
          out = out.clone(ctx)

          walk(out, (_key: string | number | undefined, val: Val) => {
            val.mark.type = false
            val.mark.hide = false
            return val
          })
        }
      }
    }

    return out
  }


  same(peer: Val): boolean {
    return null == peer ? false : this.peg === peer.peg
  }


  clone(ctx: AontuContext, spec?: ValSpec): Val {
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


  gen(ctx?: AontuContext) {
    // Unresolved ref cannot be generated, so always an error.
    let nil = NilVal.make(
      ctx,
      'ref',
      this, // (formatPath(this.peg, this.absolute) as any),
      undefined,
    )

    // TODO: refactor to use Site
    nil.path = this.path
    nil.url = this.url
    nil.row = this.row
    nil.col = this.col

    // descErr(nil, ctx)

    if (null == ctx) {
      //   // ctx.err.push(nil)
      //   ctx.adderr(nil)
      // }
      // else {
      throw new Error((null == nil.msg || '' === nil.msg) ? 'RefVal: unknown error' : nil.msg)
    }

    return undefined
  }


  inspection() {
    return [
      this.absolute ? 'absolute' : '',
      this.prefix ? 'prefix' : '',
    ].filter(p => '' != p).join(',')
  }

}


export {
  RefVal,
}
