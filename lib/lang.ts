/* Copyright (c) 2021 Richard Rodger, MIT License */

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
  Options
} from './common'

import {
  Val,
  Nil,
  TOP,
  MapVal,
  ScalarTypeVal,
  Integer,
  StringVal,
  NumberVal,
  IntegerVal,
  BooleanVal,
  DisjunctVal,
  ConjunctVal,
  RefVal,
  PrefVal,
} from './val'



class Site {
  row: number = -1
  col: number = -1
  url: string = ''

  static NONE = new Site(TOP)

  constructor(val: Val) {
    // TODO: logic to select most meaningful site if val has no site,
    // but has peg children that do.
    this.row = val.row
    this.col = val.col
    this.url = val.url
  }


}


let AontuJsonic: Plugin = function aontu(jsonic: Jsonic) {

  jsonic.options({
    value: {
      // JSONIC-UPDATE: map: { val: ... }
      map: {
        // NOTE: specify with functions as jsonic/deep will
        // remove class prototype as options are assumed plain
        // (except for functions).
        // TODO: jsonic should be able to pass context into these
        'string': { val: () => new ScalarTypeVal(String) },
        'number': { val: () => new ScalarTypeVal(Number) },
        'integer': { val: () => new ScalarTypeVal(Integer) },
        'boolean': { val: () => new ScalarTypeVal(Boolean) },
        'nil': { val: () => new Nil('literal') },
        'top': { val: () => TOP },
      }
    },

    // // JSONIC-UPDATE: fixed: { token }
    // fixed: {
    //   token: {
    //     '#A&': '&',
    //     '#A|': '|',
    //     '#A/': '/',
    //     '#A*': '*', // TODO: REVIEW char as * is a bit overloaded
    //     '#A=': '=',
    //   }
    // },

    // JSONIC-UPDATE: check impl
    map: {
      merge: (prev: any, curr: any) => {
        let pval = (prev as Val)
        let cval = (curr as Val)
        return new ConjunctVal([pval, cval])
      }
    }
  })


  let opmap: any = {
    'conjunct-infix': (_op: Op, terms: any) => new ConjunctVal(terms),
    'disjunct-infix': (_op: Op, terms: any) => new DisjunctVal(terms),

    'dot-prefix': (_op: Op, terms: any) => new RefVal(terms, true),
    'dot-infix': (_op: Op, terms: any) => new RefVal(terms),

    'star-prefix': (_op: Op, terms: any) => new PrefVal(terms[0]),
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
      evaluate: (op: Op, terms: any) => {
        // console.log('LANG EVAL', op, terms)
        return opmap[op.name](op, terms)
      }
    })

  // console.log(jsonic.token)
  let CJ = jsonic.token['#E&']
  let CL = jsonic.token.CL

  // let NR = jsonic.token.NR
  // let TX = jsonic.token.TX
  // let ST = jsonic.token.ST
  // let VL = jsonic.token.VL
  // let OB = jsonic.token.OB
  // let OS = jsonic.token.OS


  // let DJ = jsonic.token['#A|']
  // let FS = jsonic.token['#A/']
  // let AK = jsonic.token['#A*']
  // let EQ = jsonic.token['#A=']


  // JSONIC-UPDATE: rule.open[], rule.close[] - replace with rule.oN|cN

  // jsonic.rule('expr', (rs: RuleSpec) => {
  //   rs
  //     .open([
  //       { s: [[CJ, DJ, AK]], p: 'disjunct', b: 1, n: { expr: 1 } },
  //     ])

  //     .close([
  //       { s: [] }
  //     ])

  //     // NOTE: expr node are meta structures, not Vals
  //     // t=most recent term on the left, o=Val
  //     .bo((r: Rule) => r.node = { t: r.node })

  //     .ac((r: Rule) => {
  //       let cn = r.child.node.o

  //       if (cn instanceof PrefVal) {
  //         return r.o0.bad('single-pref')
  //       }

  //       // replace first val with expr val
  //       r.node = cn

  //       if ('val' === r.parent?.name) {
  //         r.parent.node = r.node
  //       }
  //     })

  // })


  // jsonic.rule('disjunct', (rs: RuleSpec) => {
  //   rs
  //     .open([
  //       {
  //         s: [CJ], p: 'conjunct', b: 1
  //       },
  //       {
  //         s: [AK], p: 'pref', b: 1
  //       },
  //       {
  //         s: [DJ, AK], p: 'pref', b: 1,
  //         a: (r: Rule) => {
  //           // Append to existing or start new
  //           r.node.o = r.node.o instanceof DisjunctVal ?
  //             r.node.o : new DisjunctVal([r.node.t])
  //         }
  //       },
  //       {
  //         s: [DJ, [NR, TX, ST, VL, OB, OS]], b: 1,
  //         p: 'val',
  //         a: (r: Rule) => {
  //           // Append to existing or start new
  //           r.node.o = r.node.o instanceof DisjunctVal ?
  //             r.node.o : new DisjunctVal([r.node.t])
  //         }
  //       },
  //     ])

  //     .close([
  //       {
  //         s: [DJ], r: 'disjunct', b: 1, a: (r: Rule) => {
  //           // higher precedence term (e.g &) was on the left
  //           let cn = r.child.node?.o || r.child.node
  //           r.node.t = cn
  //         }
  //       },
  //       {
  //         s: [CJ], r: 'disjunct', b: 1, a: (r: Rule) => {
  //           // & with higher precedence to the right
  //           let cn = r.child.node?.o || r.child.node
  //           r.node.t = cn
  //           r.child.node = null
  //         }
  //       },
  //       {}
  //     ])
  //     .ac((r: Rule) => {
  //       // child values may be normal or expr metas
  //       let cn = r.child.node?.o || r.child.node
  //       if (cn) {
  //         if (r.node.o instanceof DisjunctVal) {
  //           r.node.o.append(cn)
  //         }
  //         else {
  //           // this rule was just a pass-through
  //           r.node.o = cn
  //         }
  //       }
  //     })
  // })



  // jsonic.rule('conjunct', (rs: RuleSpec) => {
  //   rs
  //     .open([
  //       {
  //         s: [CJ, [NR, TX, ST, VL, OB, OS, FS]], b: 1,
  //         p: 'val',
  //         a: (r: Rule) => {
  //           r.node = {
  //             o: r.node.o instanceof ConjunctVal ?
  //               r.node.o : new ConjunctVal([r.node.t])
  //           }
  //         }
  //       },
  //     ])
  //     .close([
  //       {
  //         s: [CJ], r: 'conjunct', b: 1
  //       },
  //       {}
  //     ])
  //     .ac((r: Rule) => {
  //       let cn = r.child.node?.o || r.child.node
  //       if (cn) {
  //         if (r.node.o instanceof ConjunctVal) {
  //           r.node.o.append(cn)
  //         }
  //         else {
  //           r.node.o = cn
  //         }
  //       }
  //     })
  // })


  // jsonic.rule('path', (rs: RuleSpec) => {
  //   rs
  //     .open([
  //       { s: [FS, [TX, ST, NR, VL]], p: 'part', b: 2 }
  //     ])
  //     .bo((r: Rule) => r.node = new RefVal('/'))
  // })


  // jsonic.rule('part', (rs: RuleSpec) => {
  //   rs.
  //     open([
  //       {
  //         s: [FS, [TX, ST, NR, VL]], r: 'part', a: (r: Rule) => {
  //           r.node.append(r.o1.src)
  //         }
  //       },
  //       {}, // no more parts
  //     ])
  // })



  //   // rs.def.open.unshift({
  //   //   s: [[CJ, DJ], EQ], p: 'val', u: { spread: true }
  //   // })

  //   // // TODO: make before/after function[]
  //   // let orig_bc: any = rs.def.bc
  //   // rs.def.bc = function(rule: Rule, ctx: Context) {
  //   //   let out = orig_bc.call(this, rule, ctx)

  //   //   if (rule.use.spread) {
  //   //     rule.node[MapVal.SPREAD] =
  //   //       (rule.node[MapVal.SPREAD] || { o: rule.o0.src, v: [] })
  //   //     rule.node[MapVal.SPREAD].v.push(rule.child.node)
  //   //   }

  //   //   return out
  //   // }

  //   return rs
  // })


  // jsonic.rule('pref', (rs: RuleSpec) => {
  //   rs
  //     .open([
  //       {
  //         s: [AK, [NR, TX, ST, VL, OB, OS, FS]], b: 1,
  //         p: 'val',
  //       },
  //     ])
  //     .close([
  //       // Can't be in a conjunct
  //       { s: [CJ], e: (r: Rule) => r.o1 },
  //       {}
  //     ])
  //     .ac((r: Rule) => {
  //       r.node = new PrefVal(r.child.node)
  //     })
  // })



  jsonic.rule('val', (rs: RuleSpec) => {
    // rs.def.open.unshift(
    //   // Prefs are always within an expression
    //   { s: [AK, [NR, TX, ST, VL, OB, OS, FS]], p: 'expr', b: 2 },
    //   { s: [FS, [TX, ST, NR, VL]], p: 'path', b: 2 },
    // )
    // rs.def.close.unshift(
    //   {
    //     s: [[CJ, DJ]], p: 'expr', b: 1, c: (r: Rule) => {
    //       return null == r.n.expr || 0 === r.n.expr
    //     }
    //   },
    // )


    // TODO: wrap utility needed for jsonic to do this?
    let orig_bc: any = rs.def.bc
    rs.def.bc = function(rule: Rule, ctx: Context) {
      let out = orig_bc.call(this, rule, ctx)

      let valnode: Val = rule.node
      let valtype = typeof valnode

      if ('string' === valtype) {
        valnode = new StringVal(rule.node)
      }
      else if ('number' === valtype) {
        if (Number.isInteger(rule.node)) {
          valnode = new IntegerVal(rule.node)
        }
        else {
          valnode = new NumberVal(rule.node)
        }
      }
      else if ('boolean' === valtype) {
        valnode = new BooleanVal(rule.node)
      }

      let st = rule.o0
      valnode.row = st.rI
      valnode.col = st.cI

      // JSONIC-UPDATE: still valid? check multisource
      valnode.url = ctx.meta.multisource && ctx.meta.multisource.path

      rule.node = valnode

      return out
    }
    return rs
  })



  jsonic.rule('map', (rs: RuleSpec) => {
    let orig_bc = rs.def.bc
    rs.def.bc = function(rule: Rule, ctx: Context) {
      let out = orig_bc ? orig_bc.call(this, rule, ctx) : undefined

      rule.node = new MapVal(rule.node)

      return out
    }
    return rs
  })


  jsonic.rule('pair', (rs: RuleSpec) => {
    let orig_bc: any = rs.def.bc
    rs
      .open([{ s: [CJ, CL], p: 'val', u: { spread: true }, g: 'spread' }])
      .bc((...rest: any) => {
        orig_bc(...rest)

        let rule = rest[0]
        if (rule.use.spread) {
          rule.node[MapVal.SPREAD] =
            (rule.node[MapVal.SPREAD] || { o: rule.o0.src, v: [] })
          rule.node[MapVal.SPREAD].v.push(rule.child.node)
        }
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

    let val = this.jsonic(src, jm)

    return val
  }
}

export {
  Lang,
  Site,
  includeFileResolver,
}
