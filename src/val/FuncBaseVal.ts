/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  DONE
} from '../type'

import { AontuContext } from '../ctx'
import { unite } from '../unify'


import {
  propagateMarks,
  ec,
  explainClose,
  explainOpen,
} from '../utility'

import { makeNilErr, AontuError } from '../err'

import {
  top
} from './top'

import { ConjunctVal } from '../val/ConjunctVal'
import { FeatureVal } from '../val/FeatureVal'


class FuncBaseVal extends FeatureVal {
  isFunc = true
  isGenable = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
    // console.log('FBV', this.id, this.constructor.name, this.peg?.[0]?.canon)
  }


  validateArgs(args: Val[], min: number) {
    if (min < args.length) {
      // TODO: this is an error as as a parse error, needs to be handled same way
      throw new AontuError('The ' + this.funcname() + ' function needs at least ' +
        min + ' argument' + (1 === min ? '' : 's') + '.')
    }
  }


  make(ctx: AontuContext, _spec: ValSpec): Val {
    return makeNilErr(ctx, 'func:' + this.funcname(), this, undefined, 'make')
  }


  unify(peer: Val, ctx: AontuContext): Val {
    const TOP = top()
    const te = ctx.explain && explainOpen(ctx, ctx.explain, 'Func:' + this.funcname(), this, peer)

    // const sc = this.id + '=' + this.canon
    // const pc = peer.id + '=' + peer.canon


    let why = ''
    let out: Val = this


    // console.log('FBV', this.id, this.constructor.name, this.mark.type, this.peg?.canon, 'PEER', peer.id, peer.canon)

    let pegdone = true

    if (this.id !== peer.id) {

      if (peer.isTop && (this.mark.type || this.mark.hide)) {
        this.dc = DONE
      }

      else {

        let newpeg: Val[] = []
        let newtype = this.mark.type
        let newhide = this.mark.hide

        let pegprep = this.prepare(ctx, this.peg)

        if (null === pegprep) {
          pegdone = true
          newpeg = this.peg
        }
        else {
          this.peg = pegprep

          for (let arg of this.peg) {
            // console.log('FUNCBASE-UNIFY-PEG-A', arg.canon)

            let newarg = arg
            if (!arg.done) {
              newarg = arg.unify(TOP, ctx.clone({ explain: ec(te, 'ARG') }))
              newtype = newtype || newarg.mark.type
              newhide = newhide || newarg.mark.hide
              // console.log('FUNCBASE-UNIFY-PEG-B', arg.canon, arg.done, '->', newarg.canon, newarg.done)
            }
            // pegdone &&= arg.done
            pegdone &&= newarg.done
            newpeg.push(newarg)
          }
        }

        // console.log('FUNCBASE-PEG', this.id, pegdone, this.peg.map((p: any) => p?.canon))

        if (pegdone) {
          const resolved = this.resolve(ctx, newpeg)
          // console.log('FUNC-RESOLVED', ctx.cc, resolved?.canon)

          out = resolved.done && peer.isTop ? resolved :
            unite(ctx.clone({ explain: ec(te, 'PEG') }),
              resolved, peer, 'func-' + this.funcname() + '/' + this.id)
          propagateMarks(this, out)

          // TODO: make should handle this using ctx?
          out.site.row = this.site.row
          out.site.col = this.site.col
          out.site.url = this.site.url
          out.path = this.path

          why += 'pegdone'
        }
        else if (peer.isTop) {
          this.notdone()
          out = this.make(ctx, { peg: newpeg, mark: { type: newtype, hide: newhide } })

          // TODO: make should handle this using ctx?
          out.site.row = this.site.row
          out.site.col = this.site.col
          out.site.url = this.site.url
          out.path = this.path

          why += 'top'
        }
        else if (peer.isNil) {
          this.notdone()
          out = peer
          why += 'nil'
        }
        else {
          this.notdone()
          out = new ConjunctVal({
            peg: [this, peer], mark: { type: newtype, hide: newhide }
          }, ctx)

          // TODO: make should handle this using ctx?
          out.site.row = this.site.row
          out.site.col = this.site.col
          out.site.url = this.site.url
          out.path = this.path

          why += 'defer'
        }
      }
    }

    // console.log('FUNC-UNIFY-OUT', ctx.cc, this.funcname(), this.id, this.canon, 'D=', pegdone, 'W=', why, peer.id, peer.canon, 'O=', out.dc, out.id, out.canon)

    explainClose(te, out)

    return out
  }



  get canon() {
    return '' +
      // (this.type ? '<type>' : '') +
      // (this.done ? '<done>' : '') +
      // (this.id + '=') +
      this.funcname() + '(' + (this.peg.map((p: any) => p.canon).join(',')) + ')'
  }


  funcname() {
    return 'func'
  }


  prepare(_ctx: AontuContext, args: Val[]): Val[] | null {
    return args
  }


  resolve(ctx: AontuContext, _args: Val[]): Val {
    return makeNilErr(ctx, 'func:' + this.funcname(), this, undefined, 'resolve')
  }


}


export {
  FuncBaseVal,
}
