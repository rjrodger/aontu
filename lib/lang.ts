/* Copyright (c) 2021 Richard Rodger, MIT License */

import {
  Jsonic,
  Plugin,
  Rule,
  RuleSpec,
  Context,
} from 'jsonic'

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
    }
  })


  // console.log('VAL', jsonic.options.value)

  jsonic.rule('val', (rs: RuleSpec) => {
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


function AontuLang<T extends string | string[]>(src: T):
  (T extends string ? Val : Val[]) {
  let jsonic = Jsonic.make().use(AontuJsonic)
  if (Array.isArray(src)) {
    return (src.map(s => jsonic(s)) as any)
  }
  else {
    return jsonic(src)
  }

}


export {
  AontuLang
}
