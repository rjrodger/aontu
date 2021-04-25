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
} from './val'



let AontuJsonic: Plugin = function aontu(jsonic: Jsonic) {

  jsonic.options({
    value: {
      src: {
        // NOTE: specify with functions as jsonic/deep will
        // remove class prototype as options are assumed plain
        // (except for functions).
        'string': () => new ScalarTypeVal(String),
        'number': () => new ScalarTypeVal(Number),
        'integer': () => new ScalarTypeVal(Integer),
        'boolean': () => new ScalarTypeVal(Boolean),
        'nil': () => new Nil(),
        'top': () => TOP,
      }
    },

    token: {
      '#A&': { c: '&' },
      '#A|': { c: '|' },
      '#A/': { c: '/' },
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


  jsonic.rule('expr', () => {
    return new RuleSpec({
      open: [
        { s: [[CJ, DJ]], p: 'disjunct', b: 1, n: { expr: 1 } },
      ],
      close: [
        { s: [] }
      ],

      // NOTE: expr node are meta structures, not Vals
      // t=most recent term on the left, o=Val
      bo: (r: Rule) => r.node = { t: r.node },

      ac: (r: Rule) => {
        // replace first val with expr val
        r.node = r.child.node.o
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
            r.node.o.val.push(cn)
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
            r.node.o.val.push(cn)
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




  jsonic.rule('val', (rs: RuleSpec) => {
    rs.def.open.unshift(
      {
        s: [FS, [TX, ST, NR, VL]], p: 'path', b: 2
      },
    )
    rs.def.close.unshift(
      {
        s: [[CJ, DJ]], p: 'expr', b: 1, c: (r: Rule) => {
          return null == r.n.expr || 0 === r.n.expr
        }
      },
    )

    let orig_bc = rs.def.bc
    rs.def.bc = function(rule: Rule, ctx: Context) {
      let out = orig_bc.call(this, rule, ctx)

      let valnode = rule.node
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



// support MultiSource - convert AontuLang to class with jsonic instance spec'd by ctor params
//let jsonic = Jsonic.make().use(AontuJsonic)


class Lang {
  jsonic: Jsonic

  constructor(options?: Partial<Options>) {
    this.jsonic = Jsonic.make()
      .use(AontuJsonic)
      .use(MultiSource, {
        resolver: options ? options.resolver : undefined
      })
  }

  parse<T extends string | string[]>(src: T, opts?: any):
    (T extends string ? Val : Val[]) {

    let jm: any = {}

    if (opts && null != opts.log && Number.isInteger(opts.log)) {
      jm.log = opts.log
    }

    if (Array.isArray(src)) {
      return (src.map(s => this.jsonic(s, jm)) as any)
    }
    else {
      return this.jsonic(src, jm)
    }

  }
}


export {
  Lang
}
