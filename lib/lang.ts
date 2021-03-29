/* Copyright (c) 2021 Richard Rodger, MIT License */

import {
  Jsonic,
  Plugin,
  Rule,
  RuleSpec,
  Context,
} from 'jsonic'

import {
  ScalarTypeVal,
  Integer,
  StringVal,
  NumberVal,
  IntegerVal,
  BooleanVal,
} from './val'


let AontuLang: Plugin = function aontu(jsonic: Jsonic) {

  jsonic.options({
    value: {
      src: {
        'string': new ScalarTypeVal(String),
        'number': new ScalarTypeVal(Number),
        'integer': new ScalarTypeVal(Integer),
        'boolean': new ScalarTypeVal(Boolean),
      }
    }
  })


  console.log('VAL', jsonic.options.value)

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

}


export {
  AontuLang
}
