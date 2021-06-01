/* Copyright (c) 2021 Richard Rodger, MIT License */

import {
  Jsonic,
  Plugin,
  Rule,
  RuleSpec,
  Context,
} from 'jsonic'

import {
  MultiSource
} from '@jsonic/multisource'


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



let AontuJsonic: Plugin = function aontu(jsonic: Jsonic) {

  jsonic.options({
    value: {
      src: {
        // NOTE: specify with functions as jsonic/deep will
        // remove class prototype as options are assumed plain
        // (except for functions).
        // TODO: jsonic should be able to pass context into these
        'string': () => new ScalarTypeVal(String),
        'number': () => new ScalarTypeVal(Number),
        'integer': () => new ScalarTypeVal(Integer),
        'boolean': () => new ScalarTypeVal(Boolean),
        'nil': () => new Nil('literal'),
        'top': () => TOP,
      }
    },

    token: {
      '#A&': { c: '&' },
      '#A|': { c: '|' },
      '#A/': { c: '/' },
      '#A*': { c: '*' }, // TODO: REVIEW char as * is a bit overloaded
      '#A=': { c: '=' },
    },

    map: {
      merge: (prev: any, curr: any) => {
        let pval = (prev as Val)
        let cval = (curr as Val)
        return new ConjunctVal([pval, cval])
      }
    }
  })


  let NR = jsonic.token.NR
  let TX = jsonic.token.TX
  let ST = jsonic.token.ST
  let VL = jsonic.token.VL
  let OB = jsonic.token.OB
  let OS = jsonic.token.OS

  let CJ = jsonic.token['#A&']
  let DJ = jsonic.token['#A|']
  let FS = jsonic.token['#A/']
  let AK = jsonic.token['#A*']
  let EQ = jsonic.token['#A=']


  jsonic.rule('expr', () => {
    return new RuleSpec({
      open: [
        { s: [[CJ, DJ, AK]], p: 'disjunct', b: 1, n: { expr: 1 } },
      ],
      close: [
        { s: [] }
      ],

      // NOTE: expr node are meta structures, not Vals
      // t=most recent term on the left, o=Val
      bo: (r: Rule) => r.node = { t: r.node },

      ac: (r: Rule) => {
        let cn = r.child.node.o

        if (cn instanceof PrefVal) {
          return { err: 'single-pref' }
        }

        // replace first val with expr val
        r.node = cn
      },
    })
  })


  jsonic.rule('disjunct', () => {
    return new RuleSpec({
      open: [
        {
          s: [CJ], p: 'conjunct', b: 1
        },
        {
          s: [AK], p: 'pref', b: 1
        },
        {
          s: [DJ, AK], p: 'pref', b: 1,
          a: (r: Rule) => {
            // Append to existing or start new
            r.node.o = r.node.o instanceof DisjunctVal ?
              r.node.o : new DisjunctVal([r.node.t])
          }
        },
        {
          s: [DJ, [NR, TX, ST, VL, OB, OS]], b: 1,
          p: 'val',
          a: (r: Rule) => {
            // Append to existing or start new
            r.node.o = r.node.o instanceof DisjunctVal ?
              r.node.o : new DisjunctVal([r.node.t])
          }
        },
      ],
      close: [
        {
          s: [DJ], r: 'disjunct', b: 1, a: (r: Rule) => {
            // higher precedence term (e.g &) was on the left
            let cn = r.child.node?.o || r.child.node
            r.node.t = cn
          }
        },
        {
          s: [CJ], r: 'disjunct', b: 1, a: (r: Rule) => {
            // & with higher precedence to the right
            let cn = r.child.node?.o || r.child.node
            r.node.t = cn
            r.child.node = null
          }
        },
        {}
      ],
      ac: (r: Rule) => {
        // child values may be normal or expr metas
        let cn = r.child.node?.o || r.child.node
        if (cn) {
          if (r.node.o instanceof DisjunctVal) {
            r.node.o.append(cn)
          }
          else {
            // this rule was just a pass-through
            r.node.o = cn
          }
        }
      }
    })
  })



  jsonic.rule('conjunct', () => {
    return new RuleSpec({
      open: [
        {
          s: [CJ, [NR, TX, ST, VL, OB, OS, FS]], b: 1,
          p: 'val',
          a: (r: Rule) => {
            r.node = {
              o: r.node.o instanceof ConjunctVal ?
                r.node.o : new ConjunctVal([r.node.t])
            }
          }
        },
      ],
      close: [
        {
          s: [CJ], r: 'conjunct', b: 1
        },
        {}
      ],
      ac: (r: Rule) => {
        let cn = r.child.node?.o || r.child.node
        if (cn) {
          if (r.node.o instanceof ConjunctVal) {
            r.node.o.append(cn)
          }
          else {
            r.node.o = cn
          }
        }
      }
    })
  })


  jsonic.rule('path', () => {
    return new RuleSpec({
      open: [
        { s: [FS, [TX, ST, NR, VL]], p: 'part', b: 2 }
      ],
      bo: (r: Rule) => r.node = new RefVal('/')
    })
  })


  jsonic.rule('part', () => {
    return new RuleSpec({
      open: [
        {
          s: [FS, [TX, ST, NR, VL]], r: 'part', a: (r: Rule) => {
            r.node.append(r.open[1].src)
          }
        },
        {}, // no more parts
      ],
    })
  })


  jsonic.rule('pair', (rs: RuleSpec) => {
    rs.def.open.unshift({
      s: [[CJ, DJ], EQ], p: 'val', u: { spread: true }
    })

    // TODO: make before/after function[]
    let orig_bc = rs.def.bc
    rs.def.bc = function(rule: Rule, ctx: Context) {
      let out = orig_bc.call(this, rule, ctx)

      if (rule.use.spread) {
        rule.node[MapVal.SPREAD] =
          (rule.node[MapVal.SPREAD] || { o: rule.open[0].src, v: [] })
        rule.node[MapVal.SPREAD].v.push(rule.child.node)
      }

      return out
    }

    return rs
  })


  jsonic.rule('pref', () => {
    return new RuleSpec({
      open: [
        {
          s: [AK, [NR, TX, ST, VL, OB, OS, FS]], b: 1,
          p: 'val',
        },
      ],
      close: [
        // Can't be in a conjunct
        { s: [CJ], e: (r: Rule) => r.open[1] },
        {}
      ],
      ac: (r: Rule) => {
        r.node = new PrefVal(r.child.node)
      }
    })
  })



  jsonic.rule('val', (rs: RuleSpec) => {
    rs.def.open.unshift(
      // Prefs are always within an expression
      { s: [AK, [NR, TX, ST, VL, OB, OS, FS]], p: 'expr', b: 2 },
      { s: [FS, [TX, ST, NR, VL]], p: 'path', b: 2 },
    )
    rs.def.close.unshift(
      {
        s: [[CJ, DJ]], p: 'expr', b: 1, c: (r: Rule) => {
          return null == r.n.expr || 0 === r.n.expr
        }
      },
    )


    // TODO: wrap utility needed for jsonic to do this?
    let orig_bc = rs.def.bc
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

      let st = rule.open[0]
      valnode.row = st.row
      valnode.col = st.col
      valnode.url = ctx.meta.multisource && ctx.meta.multisource.path

      // console.log('VAL META', valnode.canon, valnode.url)

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

}




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
        resolver: options ? options.resolver : undefined
      })

    // console.log('AL options', this.options)
  }

  parse(src: string, opts?: any): Val {

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

    // console.log('ALp jm', jm)

    let val = this.jsonic(src, jm)

    return val
  }
}

export {
  Lang
}
