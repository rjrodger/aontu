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
  ListVal,
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

  let CJ = jsonic.token['#E&']
  let CL = jsonic.token.CL


  jsonic.rule('val', (rs: RuleSpec) => {

    // TODO: wrap utility needed for jsonic to do this?
    // let orig_bc: any = rs.def.bc
    // rs.def.bc = function(rule: Rule, ctx: Context) {
    //   let out = orig_bc.call(this, rule, ctx)

    rs.bc(false, (rule: Rule, ctx: Context) => {

      let valnode: Val = rule.node
      let valtype = typeof valnode

      // console.log('VAL RULE', rule.use, rule.node)

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

      // return out
      return undefined
    })

    return rs
  })



  jsonic.rule('map', (rs: RuleSpec) => {
    // let orig_bc = rs.def.bc
    // rs.def.bc = function(rule: Rule, ctx: Context) {
    //   let out = orig_bc ? orig_bc.call(this, rule, ctx) : undefined

    rs.bc(false, (rule: Rule) => {

      // console.log('MAP RULE', rule.use, rule.node)
      rule.node = new MapVal(rule.node)

      // return out
      return undefined
    })

    return rs
  })


  jsonic.rule('list', (rs: RuleSpec) => {
    // let orig_bc = rs.def.bc
    // rs.def.bc = function(rule: Rule, ctx: Context) {
    //   let out = orig_bc ? orig_bc.call(this, rule, ctx) : undefined

    rs.bc(false, (rule: Rule) => {
      rule.node = new ListVal(rule.node)

      // return out
      return undefined
    })

    return rs
  })



  jsonic.rule('pair', (rs: RuleSpec) => {
    // let orig_bc: any = rs.def.bc
    rs
      .open([{ s: [CJ, CL], p: 'val', u: { spread: true }, g: 'spread' }])

      // .bc((...rest: any) => {
      //   orig_bc(...rest)


      .bc(false, (rule: Rule) => {
        // let rule = rest[0]
        // console.log('PAIR RULE', rule.use, rule.node,
        //  rule.parent.name, rule.parent.use)

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
