/* Copyright (c) 2021-2023 Richard Rodger, MIT License */

import {
  Jsonic,
  Plugin,
  Rule,
  RuleSpec,
  Context,
  JsonicError,
} from 'jsonic'

import { Debug } from 'jsonic/debug'

import {
  MultiSource
} from '@jsonic/multisource'

import {
  makeFileResolver
} from '@jsonic/multisource/resolver/file'

import {
  makePkgResolver
} from '@jsonic/multisource/resolver/pkg'

import {
  makeMemResolver
} from '@jsonic/multisource/resolver/mem'


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



import { DisjunctVal } from './val/DisjunctVal'
import { ConjunctVal } from './val/ConjunctVal'
import { ListVal } from './val/ListVal'
import { MapVal } from './val/MapVal'
import { Nil } from './val/Nil'
import { PrefVal } from './val/PrefVal'
import { RefVal } from './val/RefVal'
import { VarVal } from './val/VarVal'
import { PlusVal } from './val/PlusVal'
import { NullVal } from './val/NullVal'



import {
  TOP,
  ScalarTypeVal,
  Integer,
  StringVal,
  NumberVal,
  IntegerVal,
  BooleanVal,
} from './val'



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
  // let addsite = (v: Val, p: string[]) => (v.path = [...(p || [])], v)
  let addsite = (v: Val, r: Rule, ctx: Context) => {

    v.row = null == r.o0 ? -1 : r.o0.rI
    v.col = null == r.o0 ? -1 : r.o0.cI
    v.url = ctx.meta.multisource ? ctx.meta.multisource.path : ''
    v.path = r.k ? [...(r.k.path || [])] : []

    return v
  }


  jsonic.options({
    value: {
      def: {
        // NOTE: specify with functions as jsonic/deep will
        // remove class prototype as options are assumed plain
        // (except for functions).
        // TODO: jsonic should be able to pass context into these
        'string': {
          val: (r: Rule, ctx: Context) =>
            addsite(new ScalarTypeVal({ peg: String }), r, ctx)
        },
        'number': {
          val: (r: Rule, ctx: Context) =>
            addsite(new ScalarTypeVal({ peg: Number }), r, ctx)
        },
        'integer': {
          val: (r: Rule, ctx: Context) =>
            addsite(new ScalarTypeVal({ peg: Integer }), r, ctx)
        },
        'boolean': {
          val: (r: Rule, ctx: Context) =>
            addsite(new ScalarTypeVal({ peg: Boolean }), r, ctx)
        },
        'nil': {
          val: (r: Rule, ctx: Context) =>
            addsite(new Nil('literal'), r, ctx)
        },

        // TODO: FIX: need a TOP instance to hold path
        'top': { val: () => TOP },
      }
    },

    map: {
      merge: (prev: any, curr: any, _r: Rule, ctx: Context) => {
        let pval = (prev as Val)
        let cval = (curr as Val)

        if (pval?.isVal && cval?.isVal) {

          // TODO: test multi element conjuncts work
          if (pval instanceof ConjunctVal && cval instanceof ConjunctVal) {
            pval.append(cval)
            return pval
          }
          else if (pval instanceof ConjunctVal) {
            pval.append(cval)
            return pval
          }
          // else if (cval instanceof ConjunctVal) {
          //   cval.append(pval)
          //   return cval
          // }
          else {
            return addsite(new ConjunctVal({ peg: [pval, cval] }), prev, ctx)
          }
        }

        // Handle defered conjuncts, where MapVal does not yet
        // exist, by creating ConjunctVal later.
        else {
          prev.___merge = (prev.___merge || [])
          prev.___merge.push(curr)
          return prev
        }
      }
    }
  })


  let opmap: any = {
    'conjunct-infix': (r: Rule, ctx: Context, _op: Op, terms: any) =>
      addsite(new ConjunctVal({ peg: terms }), r, ctx),

    'disjunct-infix': (r: Rule, ctx: Context, _op: Op, terms: any) =>
      addsite(new DisjunctVal({ peg: terms }), r, ctx),

    'dot-prefix': (r: Rule, ctx: Context, _op: Op, terms: any) => {
      return addsite(new RefVal({ peg: terms, prefix: true }), r, ctx)
    },

    'dot-infix': (r: Rule, ctx: Context, _op: Op, terms: any) => {
      return addsite(new RefVal({ peg: terms }), r, ctx)
    },

    'star-prefix': (r: Rule, ctx: Context, _op: Op, terms: any) =>
      addsite(new PrefVal({ peg: terms[0] }), r, ctx),

    'dollar-prefix': (r: Rule, ctx: Context, _op: Op, terms: any) => {
      // $.a.b absolute path
      if (terms[0] instanceof RefVal) {
        terms[0].absolute = true
        return terms[0]
      }
      return addsite(new VarVal({ peg: terms[0] }), r, ctx)
    },

    'plus-infix': (r: Rule, ctx: Context, _op: Op, terms: any) => {
      return addsite(new PlusVal({ peg: [terms[0], terms[1]] }), r, ctx)
    },

    'negative-prefix': (r: Rule, ctx: Context, _op: Op, terms: any) => {
      let val = terms[0]
      val.peg = -1 * val.peg
      return addsite(val, r, ctx)
    },

    'positive-prefix': (r: Rule, ctx: Context, _op: Op, terms: any) => {
      let val = terms[0]
      return addsite(val, r, ctx)
    },

    'plain-paren': (r: Rule, ctx: Context, _op: Op, terms: any) => {
      let val = terms[0]
      return addsite(val, r, ctx)
    },

  }


  jsonic
    .use(Expr, {
      op: {
        // disjunct > conjunct: c & b | a -> c & (b | a)
        'conjunct': {
          infix: true, src: '&', left: 14_000_000, right: 15_000_000
        },
        'disjunct': {
          infix: true, src: '|', left: 16_000_000, right: 17_000_000
        },

        'plus-infix': {
          src: '+',
          infix: true,
          left: 20_000_000,
          right: 21_000_000,
        },

        'dollar-prefix': {
          src: '$',
          prefix: true,
          right: 31_000_000,
        },

        'dot-infix': {
          src: '.',
          infix: true,
          left: 25_000_000,
          right: 24_000_000,
        },

        'dot-prefix': {
          src: '.',
          prefix: true,
          right: 24_000_000,
        },

        'star': {
          src: '*',
          prefix: true,
          right: 24_000_000,
        },

        addition: null,
        subtraction: null,
        multiplication: null,
        division: null,
        remainder: null,
      },
      evaluate: (r: Rule, ctx: Context, op: Op, terms: any) => {
        // console.log('EVAL', op.name, terms)

        let val: Val = opmap[op.name](r, ctx, op, terms)
        return val
      }
    })


  let CJ = jsonic.token['#E&']
  let CL = jsonic.token.CL


  jsonic.rule('val', (rs: RuleSpec) => {

    rs
      .open([{ s: [CJ, CL], p: 'map', b: 2, n: { pk: 1 }, g: 'spread' }])

      .bc((r: Rule, ctx: Context) => {

        let valnode: Val = r.node
        let valtype = typeof valnode

        if ('string' === valtype) {
          valnode = addsite(new StringVal({ peg: r.node }), r, ctx)
        }
        else if ('number' === valtype) {
          if (Number.isInteger(r.node)) {
            valnode = addsite(new IntegerVal({ peg: r.node }), r, ctx)
          }
          else {
            valnode = addsite(new NumberVal({ peg: r.node }), r, ctx)
          }
        }
        else if ('boolean' === valtype) {
          valnode = addsite(new BooleanVal({ peg: r.node }), r, ctx)
        }
        else if (null === valnode) {
          valnode = addsite(new NullVal({ peg: r.node }), r, ctx)
        }

        if (null != valnode && 'object' === typeof valnode) {
          let st = r.o0
          valnode.row = st.rI
          valnode.col = st.cI
          valnode.url = ctx.meta.multisource && ctx.meta.multisource.path
        }
        // else { ERROR? }

        r.node = valnode

        return undefined
      })

      .close([{ s: [CJ, CL], b: 2, g: 'spread,json,more' }])

    return rs
  })


  jsonic.rule('map', (rs: RuleSpec) => {
    rs
      .open([{ s: [CJ, CL], p: 'pair', b: 2, g: 'spread' }])

      .bc((r: Rule, ctx: Context) => {

        let mo = r.node

        //  Handle defered conjuncts, e.g. `{x:1 @"foo"}`
        if (mo.___merge) {
          let mop = { ...mo }
          delete mop.___merge

          // TODO: needs addpath?
          let mopv = new MapVal({ peg: mop })

          r.node =
            addsite(new ConjunctVal({ peg: [mopv, ...mo.___merge] }), r, ctx)
        }
        else {
          r.node = addsite(new MapVal({ peg: mo }), r, ctx)
        }

        return undefined
      })

      .close([{ s: [CJ, CL], b: 2, g: 'spread,json,more' }])

    return rs
  })


  jsonic.rule('list', (rs: RuleSpec) => {
    rs.bc((r: Rule, ctx: Context) => {
      r.node = addsite(new ListVal({ peg: r.node }), r, ctx)

      return undefined
    })

    return rs
  })


  jsonic.rule('pair', (rs: RuleSpec) => {
    rs
      .open([{
        s: [CJ, CL], p: 'val',
        u: { spread: true },
        g: 'spread'
      }])

      // NOTE: manually adjust path - @jsonic/path ignores as not pair:true
      .ao((r) => {
        if (0 < r.d && r.u.spread) {
          r.child.k.path = [...r.k.path, '&']
          r.child.k.key = '&'
        }
      })

      .bc((rule: Rule) => {
        // TRAVERSE PARENTS TO GET PATH

        if (rule.u.spread) {
          rule.node[MapVal.SPREAD] =
            (rule.node[MapVal.SPREAD] || { o: rule.o0.src, v: [] })

          rule.node[MapVal.SPREAD].v.push(rule.child.node)
        }

        return undefined
      })

      .close([
        { s: [CJ, CL], c: (r) => r.lte('dmap', 1), r: 'pair', b: 2, g: 'spread,json,pair' },
        { s: [CJ, CL], b: 2, g: 'spread,json,more' }
      ])


    return rs
  })


  jsonic.rule('elem', (rs: RuleSpec) => {
    rs
      // PPP
      .open([{ s: [CJ, CL], p: 'val', u: { spread: true }, n: { pk: 1 }, g: 'spread' }])

      .bc((rule: Rule) => {
        // TRAVERSE PARENTS TO GET PATH

        if (rule.u.spread) {
          rule.node[ListVal.SPREAD] =
            (rule.node[ListVal.SPREAD] || { o: rule.o0.src, v: [] })
          rule.node[ListVal.SPREAD].v.push(rule.child.node)
        }

        return undefined
      })

      .close([{ s: [CJ, CL], r: 'elem', b: 2, g: 'spread,json,more' }])

    return rs
  })

}


// const includeFileResolver = makeFileResolver((spec: any) => {
//   return 'string' === typeof spec ? spec : spec?.peg
// })

function makeModelResolver(options: any) {
  const useRequire = options.require || require

  let memResolver = makeMemResolver({
    ...(options.resolver?.mem || {})
  })

  // let fileResolver = makeFileResolver({
  //   ...(options.resolver?.file || {})
  // })

  // TODO: make this consistent with other resolvers
  let fileResolver = makeFileResolver((spec: any) => {
    return 'string' === typeof spec ? spec : spec?.peg
  })

  let pkgResolver = makePkgResolver({
    require: useRequire,
    ...(options.resolver?.pkg || {})
  })

  return function ModelResolver(
    spec: any,
    popts: any,
    rule: Rule,
    ctx: Context,
    jsonic: Jsonic
  ) {

    let path = 'string' === typeof spec ? spec : spec?.peg
    let search: any = []
    let res = memResolver(path, popts, rule, ctx, jsonic)
    res.path = path
    if (res.found) {
      return res
    }

    search = search.concat(res.search)

    res = fileResolver(path, popts, rule, ctx, jsonic)
    res.path = path
    if (res.found) {
      return res
    }

    search = search.concat(res.search)

    res = pkgResolver(path, popts, rule, ctx, jsonic)
    res.path = path
    if (res.found) {
      return res
    }

    res.search = search.concat(res.search)
    return res
  }
}


class Lang {
  jsonic: Jsonic
  options: Options = {
    src: '',
    print: -1,
    debug: false,
    trace: false,
  }


  constructor(options?: Partial<Options>) {
    this.options = Object.assign({}, this.options, options) as Options

    const modelResolver = makeModelResolver(this.options)

    this.jsonic = Jsonic.make()

    if (this.options.debug) {
      this.jsonic.use(Debug, {
        trace: this.options.trace
      })
    }

    this.jsonic
      .use(AontuJsonic)
      .use(MultiSource, {
        // resolver: options?.resolver || includeFileResolver
        resolver: options?.resolver || modelResolver
      })
  }


  parse(src: string, opts?: Partial<Options>): Val {
    // JSONIC-UPDATE - check meta
    let jm: any = {
      fs: opts?.fs,
      fileName: this.options.path,
      multisource: {
        path: this.options.path,
        deps: (opts && opts.deps) || undefined
      }
    }

    // Pass through Jsonic debug log value
    if (opts && null != opts.log && Number.isInteger(opts.log)) {
      jm.log = opts.log
    }

    // jm.log = -1

    let val: Val

    try {
      val = this.jsonic(src, jm)
    }
    catch (e: any) {
      if (e instanceof JsonicError || 'JsonicError' === e.constructor.name) {
        val = new Nil({
          why: 'parse',
          err: new Nil({
            why: 'syntax',
            msg: e.message,
            err: e,
          })
        })
      }
      else {
        throw e
      }
    }

    return val
  }
}

export {
  Lang,
  Site,
}
