/* Copyright (c) 2021-2022 Richard Rodger, MIT License */

import {
  Jsonic,
  Plugin,
  Rule,
  RuleSpec,
  Context,
} from '@jsonic/jsonic-next'

import {
  MultiSource
} from '@jsonic/multisource'

import {
  makeFileResolver
} from '@jsonic/multisource/dist/resolver/file'

import {
  Expr,
  Op,
} from '@jsonic/expr'

import {
  Path
} from '@jsonic/path'


import type {
  Val,
  Options,
} from './type'

import {
  TOP
} from './type'

import { ConjunctVal } from './val/ConjunctVal'
import { DisjunctVal } from './val/DisjunctVal'
import { MapVal } from './val/MapVal'
import { ListVal } from './val/ListVal'
import { PrefVal } from './val/PrefVal'
import { RefVal } from './val/RefVal'
import { Nil } from './val/Nil'


import {
  ScalarTypeVal,
  Integer,
  StringVal,
  NumberVal,
  IntegerVal,
  BooleanVal,
} from './val'



// console.log('TOP', TOP)

class Site {
  row: number = -1
  col: number = -1
  url: string = ''

  // static NONE = new Site(TOP)

  constructor(val: Val) {
    // TODO: logic to select most meaningful site if val has no site,
    // but has peg children that do.
    this.row = val.row
    this.col = val.col
    this.url = val.url
  }


}


let AontuJsonic: Plugin = function aontu(jsonic: Jsonic) {

  jsonic.use(Path)

  // TODO: refactor Val constructor
  let addpath = (v: Val, p: string[]) => (v.path = [...(p || [])], v)


  jsonic.options({
    value: {
      map: {
        // NOTE: specify with functions as jsonic/deep will
        // remove class prototype as options are assumed plain
        // (except for functions).
        // TODO: jsonic should be able to pass context into these
        'string': {
          val: (r: Rule) =>
            addpath(new ScalarTypeVal(String), r.keep.path)
        },
        'number': {
          val: (r: Rule) =>
            addpath(new ScalarTypeVal(Number), r.keep.path)
        },
        'integer': {
          val: (r: Rule) =>
            addpath(new ScalarTypeVal(Integer), r.keep.path)
        },
        'boolean': {
          val: (r: Rule) =>
            addpath(new ScalarTypeVal(Boolean), r.keep.path)
        },
        'nil': {
          val: (r: Rule) =>
            addpath(new Nil('literal'), r.keep.path)
        },

        // TODO: FIX: need a TOP instance to hold path
        'top': { val: () => TOP },
      }
    },

    map: {
      merge: (prev: any, curr: any) => {
        let pval = (prev as Val)
        let cval = (curr as Val)
        return addpath(new ConjunctVal([pval, cval]), prev.path)
      }
    }
  })


  let opmap: any = {
    'conjunct-infix': (r: Rule, _op: Op, terms: any) =>
      addpath(new ConjunctVal(terms), r.keep.path),
    'disjunct-infix': (r: Rule, _op: Op, terms: any) =>
      addpath(new DisjunctVal(terms), r.keep.path),

    'dot-prefix': (r: Rule, _op: Op, terms: any) =>
      addpath(new RefVal(terms, true), r.keep.path),
    'dot-infix': (r: Rule, _op: Op, terms: any) =>
      addpath(new RefVal(terms), r.keep.path),

    'star-prefix': (r: Rule, _op: Op, terms: any) =>
      addpath(new PrefVal(terms[0]), r.keep.path),
  }


  jsonic
    .use(Expr, {
      op: {
        // disjunct > conjunct: c & b|a -> c & (b|a)
        'conjunct': {
          infix: true, src: '&', left: 14000, right: 15000
        },
        'disjunct': {
          // infix: true, src: '|', left: 14000, right: 15000
          infix: true, src: '|', left: 16000, right: 17000
        },

        'dot-infix': {
          src: '.',
          infix: true,
          left: 15_000_000,
          right: 14_000_000,
        },
        'dot-prefix': {
          src: '.',
          prefix: true,
          right: 14_000_000,
        },

        'star': {
          src: '*',
          prefix: true,
          right: 14_000_000,
        },
      },
      evaluate: (r: Rule, op: Op, terms: any) => {
        // console.log('LANG EVAL', r.keep, op, terms)
        let val: Val = opmap[op.name](r, op, terms)
        // console.dir(val, { depth: null })

        return val
      }
    })


  let CJ = jsonic.token['#E&']
  let CL = jsonic.token.CL


  jsonic.rule('val', (rs: RuleSpec) => {

    // TODO: wrap utility needed for jsonic to do this?
    // let orig_bc: any = rs.def.bc
    // rs.def.bc = function(rule: Rule, ctx: Context) {
    //   let out = orig_bc.call(this, rule, ctx)

    rs.bc((r: Rule, ctx: Context) => {

      let valnode: Val = r.node
      let valtype = typeof valnode

      // console.log('VAL RULE', valtype, r.use, r.node)

      if ('string' === valtype) {
        valnode = addpath(new StringVal(r.node), r.keep.path)
      }
      else if ('number' === valtype) {
        if (Number.isInteger(r.node)) {
          valnode = addpath(new IntegerVal(r.node), r.keep.path)
        }
        else {
          valnode = addpath(new NumberVal(r.node), r.keep.path)
        }
      }
      else if ('boolean' === valtype) {
        valnode = addpath(new BooleanVal(r.node), r.keep.path)
      }

      let st = r.o0
      valnode.row = st.rI
      valnode.col = st.cI

      // JSONIC-UPDATE: still valid? check multisource
      valnode.url = ctx.meta.multisource && ctx.meta.multisource.path

      r.node = valnode

      // return out
      return undefined
    })

    return rs
  })



  jsonic.rule('map', (rs: RuleSpec) => {
    // let orig_bc = rs.def.bc
    // rs.def.bc = function(rule: Rule, ctx: Context) {
    //   let out = orig_bc ? orig_bc.call(this, rule, ctx) : undefined

    rs.bc((r: Rule) => {

      // console.log('MAP RULE', rule.use, rule.node)
      r.node = addpath(new MapVal(r.node), r.keep.path)

      // return out
      return undefined
    })

    return rs
  })


  jsonic.rule('list', (rs: RuleSpec) => {
    // let orig_bc = rs.def.bc
    // rs.def.bc = function(rule: Rule, ctx: Context) {
    //   let out = orig_bc ? orig_bc.call(this, rule, ctx) : undefined

    rs.bc((r: Rule) => {
      r.node = addpath(new ListVal(r.node), r.keep.path)

      // return out
      return undefined
    })

    return rs
  })



  jsonic.rule('pair', (rs: RuleSpec) => {
    rs
      .open([{ s: [CJ, CL], p: 'val', u: { spread: true }, g: 'spread' }])

      .bc((rule: Rule) => {
        // TRAVERSE PARENTS TO GET PATH

        if (rule.use.spread) {
          rule.node[MapVal.SPREAD] =
            (rule.node[MapVal.SPREAD] || { o: rule.o0.src, v: [] })
          rule.node[MapVal.SPREAD].v.push(rule.child.node)
        }

        return undefined
      })

    return rs
  })


  jsonic.rule('elem', (rs: RuleSpec) => {
    rs
      .open([{ s: [CJ, CL], p: 'val', u: { spread: true }, g: 'spread' }])

      .bc((rule: Rule) => {
        // TRAVERSE PARENTS TO GET PATH

        if (rule.use.spread) {
          rule.node[ListVal.SPREAD] =
            (rule.node[ListVal.SPREAD] || { o: rule.o0.src, v: [] })
          rule.node[ListVal.SPREAD].v.push(rule.child.node)
        }

        return undefined
      })

    return rs
  })

}


const includeFileResolver = makeFileResolver((spec: any) => {
  return 'string' === typeof spec ? spec : spec?.peg
})


class Lang {
  jsonic: Jsonic
  options: Options = {
    src: '',
    print: -1,
  }

  constructor(options?: Partial<Options>) {
    this.options = Object.assign({}, this.options, options)
    this.jsonic = Jsonic.make()
      .use(AontuJsonic)
      .use(MultiSource, {
        resolver: options?.resolver || includeFileResolver
      })
  }

  parse(src: string, opts?: any): Val {

    // JSONIC-UPDATE - check meta
    let jm: any = {
      multisource: {
        // NOTE: multisource has property `path` NOT `base`
        path: this.options.base,
        deps: (opts && opts.deps) || undefined
      }
    }

    // Pass through Jsonic debug log value
    if (opts && null != opts.log && Number.isInteger(opts.log)) {
      jm.log = opts.log
    }

    // jm.log = -1

    let val = this.jsonic(src, jm)

    return val
  }
}

export {
  Lang,
  Site,
  includeFileResolver,
}
