/* Copyright (c) 2021-2023 Richard Rodger, MIT License */

import {
  Jsonic,
  Plugin,
  Rule,
  RuleSpec,
  Context,
  JsonicError,
} from '@jsonic/jsonic-next'

import { Debug } from '@jsonic/jsonic-next/debug'

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
  let addpath = (v: Val, p: string[]) => (v.path = [...(p || [])], v)


  jsonic.options({
    value: {
      def: {
        // NOTE: specify with functions as jsonic/deep will
        // remove class prototype as options are assumed plain
        // (except for functions).
        // TODO: jsonic should be able to pass context into these
        'string': {
          val: (r: Rule) =>
            addpath(new ScalarTypeVal({ peg: String }), r.k.path)
        },
        'number': {
          val: (r: Rule) =>
            addpath(new ScalarTypeVal({ peg: Number }), r.k.path)
        },
        'integer': {
          val: (r: Rule) =>
            addpath(new ScalarTypeVal({ peg: Integer }), r.k.path)
        },
        'boolean': {
          val: (r: Rule) =>
            addpath(new ScalarTypeVal({ peg: Boolean }), r.k.path)
        },
        'nil': {
          val: (r: Rule) =>
            addpath(new Nil('literal'), r.k.path)
        },

        // TODO: FIX: need a TOP instance to hold path
        'top': { val: () => TOP },
      }
    },

    map: {
      merge: (prev: any, curr: any) => {
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
            return addpath(new ConjunctVal({ peg: [pval, cval] }), prev.path)
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
    'conjunct-infix': (r: Rule, _op: Op, terms: any) =>
      addpath(new ConjunctVal({ peg: terms }), r.k.path),

    'disjunct-infix': (r: Rule, _op: Op, terms: any) =>
      addpath(new DisjunctVal({ peg: terms }), r.k.path),

    'dot-prefix': (r: Rule, _op: Op, terms: any) => {
      return addpath(new RefVal({ peg: terms, prefix: true }), r.k.path)
    },

    'dot-infix': (r: Rule, _op: Op, terms: any) => {
      return addpath(new RefVal({ peg: terms }), r.k.path)
    },

    'star-prefix': (r: Rule, _op: Op, terms: any) =>
      addpath(new PrefVal({ peg: terms[0] }), r.k.path),

    'dollar-prefix': (r: Rule, _op: Op, terms: any) => {
      // $.a.b absolute path
      if (terms[0] instanceof RefVal) {
        terms[0].absolute = true
        return terms[0]
      }
      return addpath(new VarVal({ peg: terms[0] }), r.k.path)
    },

    'plus-infix': (r: Rule, _op: Op, terms: any) => {
      return addpath(new PlusVal({ peg: [terms[0], terms[1]] }), r.k.path)
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
      },
      evaluate: (r: Rule, op: Op, terms: any) => {
        let val: Val = opmap[op.name](r, op, terms)
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
          valnode = addpath(new StringVal({ peg: r.node }), r.k.path)
        }
        else if ('number' === valtype) {
          if (Number.isInteger(r.node)) {
            valnode = addpath(new IntegerVal({ peg: r.node }), r.k.path)
          }
          else {
            valnode = addpath(new NumberVal({ peg: r.node }), r.k.path)
          }
        }
        else if ('boolean' === valtype) {
          valnode = addpath(new BooleanVal({ peg: r.node }), r.k.path)
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

      .close([{ s: [CJ, CL], b: 2, g: 'spread,json,more' }])

    return rs
  })


  jsonic.rule('map', (rs: RuleSpec) => {
    rs
      .open([{ s: [CJ, CL], p: 'pair', b: 2, g: 'spread' }])

      .bc((r: Rule) => {

        let mo = r.node

        //  Handle defered conjuncts, e.g. `{x:1 @"foo"}`
        if (mo.___merge) {
          let mop = { ...mo }
          delete mop.___merge

          // TODO: needs addpath?
          let mopv = new MapVal({ peg: mop })

          r.node =
            addpath(new ConjunctVal({ peg: [mopv, ...mo.___merge] }), r.k.path)
        }
        else {
          r.node = addpath(new MapVal({ peg: mo }), r.k.path)
        }

        return undefined
      })

      .close([{ s: [CJ, CL], b: 2, g: 'spread,json,more' }])

    return rs
  })


  jsonic.rule('list', (rs: RuleSpec) => {
    rs.bc((r: Rule) => {
      r.node = addpath(new ListVal({ peg: r.node }), r.k.path)

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


  parse(src: string, opts?: any): Val {
    // JSONIC-UPDATE - check meta
    let jm: any = {
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
