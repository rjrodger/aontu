/* Copyright (c) 2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  DONE,
} from '../type'

import {
  walk,
} from '../utility'

import { AontuContext } from '../ctx'
import { unite } from '../unify'

import { makeNilErr } from '../err'

import {
  top
} from './top'

import { StringVal } from './StringVal'
import { IntegerVal } from './IntegerVal'
import { NumberVal } from './NumberVal'
import { VarVal } from './VarVal'
import { ConjunctVal } from './ConjunctVal'
import { DisjunctVal } from './DisjunctVal'
import { FeatureVal } from './FeatureVal'


class PathVal extends FeatureVal {
  isPath = true
  isGenable = true
  cjo = 32500

  absolute: boolean = false
  prefix: boolean = false
  _resolved: Val | undefined = undefined

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

    else if (part instanceof IntegerVal) {
      partval = part.src
      this.peg.push(partval)
    }

    else if (part instanceof NumberVal) {
      let partvals: string[] = part.src.split('.')
      this.peg.push(...partvals)
    }

    else if (part instanceof VarVal) {
      partval = part
      this.peg.push(partval)
    }

    else if (part instanceof PathVal) {
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


  unify(peer: Val, ctx: AontuContext): Val {
    peer = peer ?? top()

    // Already resolved (e.g. path value from path() function) — skip find
    if (this.done) return this

    let out: Val = this
    const found = this.find(ctx)

    if (found != null && !found.isNil) {
      out = unite(ctx, found, peer, 'path')
    }
    else if (found?.isNil) {
      out = found
    }
    else {
      // Not yet resolvable — increment dc to signal not done
      this.dc = DONE === this.dc ? DONE : this.dc + 1
    }

    return out
  }


  find(ctx: AontuContext) {
    let out: Val | undefined = undefined

    // Check if self.path starts with peg (cycle detection).
    // Element-by-element comparison avoids string join+startsWith allocations.
    let isprefixpath = this.peg.length <= this.path.length
    if (isprefixpath) {
      for (let i = 0; i < this.peg.length; i++) {
        if (this.peg[i] !== this.path[i]) {
          isprefixpath = false
          break
        }
      }
    }
    // Degenerate case: peg is all empty strings (e.g. path("")) and path is empty.
    if (!isprefixpath && this.peg.length > 0 && this.path.length === 0) {
      let allEmpty = true
      for (let i = 0; i < this.peg.length; i++) {
        if ('' !== this.peg[i]) { allEmpty = false; break }
      }
      isprefixpath = allEmpty
    }

    let refpath: string[] = []
    let pI = 0
    // let descent = ''

    if (isprefixpath) {
      // console.log('SELFPATH', selfpath, 'PEGPATH', pegpath)
      out = makeNilErr(ctx, 'path_cycle', this)
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

      let node: Val | null = ctx.root as Val

      let nopath = false

      if (null != node) {
        for (; pI < refpath.length; pI++) {
          let part = refpath[pI]
          // console.log('PART', pI, part, node)

          // descent += (' | ' + pI + '=' + node.canon) // Util.inspect(node))

          if (node.isMap) {
            node = node.peg[part]
          }
          else if (node.isList) {
            node = node.peg[part]
          }
          else if (node.isConjunct || node.isDisjunct) {
            // Collect matching children from all junction terms,
            // flattening nested conjuncts and disjuncts.
            // Spreads match any key — their peg is always included.
            const matches: Val[] = []
            const stack = [...node.peg]
            while (stack.length > 0) {
              const term = stack.pop()!
              if (term.isConjunct || term.isDisjunct) {
                stack.push(...term.peg)
              }
              else if (term.isSpread) {
                matches.push(term.peg)
              }
              else if ((term.isMap || term.isList) && term.peg[part] != null) {
                matches.push(term.peg[part])
              }
            }
            if (matches.length === 1) {
              node = matches[0]
            }
            else if (matches.length > 1) {
              node = node.isConjunct
                ? new ConjunctVal({ peg: matches })
                : new DisjunctVal({ peg: matches })
            }
            else {
              node = null
            }
          }
          else if (node.done) {
            nopath = true
            break;
          }
          else {
            break;
          }

          if (null == node) {
            nopath = true
            break
          }

        }
      }

      // console.log('REFPATH', ctx.cc, pI, refpath, nopath, ctx.root, node)


      if (nopath) {
        out = makeNilErr(ctx, 'no_path', this)
      }
      else if (pI === refpath.length && node != null) {
        out = node

        // Types and hidden values are cloned and made concrete
        if (null != out) { //  && (out.mark.type || out.mark.hide)) {

          // console.log('FOUND-A', out)

          if (this.mark.type || this.mark.hide) {
            out.mark.type = this.mark.type
            out.mark.hide = this.mark.hide
          }

          if (this.mark._hide_found) {
            out.mark.hide = true
          }

          // Cache clone+walk results per (ref, target) per iteration.
          const cacheKey = this.id + '|' + out.id
          const cache = ctx._refCloneCache
          const cached = cache?.get(cacheKey)
          if (cached !== undefined) {
            out = cached
          }
          else {
            out = out.clone(ctx)
            out.mark.type = false
            out.mark.hide = false

            walk(out, (_key: string | number | undefined, val: Val) => {
              val.mark.type = false
              val.mark.hide = false
              return val
            })

            cache?.set(cacheKey, out)
          }
        }
      }
    }

    // console.log('REF-FIND', ctx.cc, this.id, selfpath, 'PEG=', pegpath, 'RP', pI, refpath.join('.'), descent, 'O=', out?.id, out?.canon, out?.done)

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
    }) as PathVal)
    return out
  }


  get canon() {
    let str =
      (this.absolute ? '$' : '') +
      (0 < this.peg.length ? '.' : '') +
      this.peg.map((p: any) => '.' === p ? '' :
        (p.isVal ? p.canon : '' + p))
        .join('.')
    return str
  }


  gen(ctx: AontuContext) {
    let nil = makeNilErr(
      ctx,
      'ref',
      this,
      undefined,
    )

    nil.path = this.path
    nil.site.url = this.site.url
    nil.site.row = this.site.row
    nil.site.col = this.site.col

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
  PathVal,
}
