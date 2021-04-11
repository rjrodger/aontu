import Lab from '@hapi/lab'
import Code from '@hapi/code'



var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect


import { Jsonic } from 'jsonic'





import {
  TOP,
  Bottom,
  NumberVal,
  StringVal,
  BooleanVal,
  IntegerVal,
  ScalarTypeVal,
  Integer,
} from '../lib/val'

import {
  AontuLang
} from '../lib/lang'


describe('lang', function() {

  it('happy', () => {
    let al = AontuLang


    expect(al('1').canon).equal('1')
    expect(al('a:1').canon).equal('{"a":1}')
    expect(al('{a:{b:x}}').canon).equal('{"a":{"b":"x"}}')

    expect(al('a:11|22,b:33', { xlog: -1 }).canon).equal('{"a":11|22,"b":33}')
    expect(al('a:11|22|33,b:44', { xlog: -1 }).canon).equal('{"a":11|22|33,"b":44}')


    expect(al('a:{b:11}|{c:22},b:33', { xlog: -1 }).canon)
      .equal('{"a":{"b":11}|{"c":22},"b":33}')
    //console.dir(al('a:{b:11}|{c:22},b:33'), { depth: null })



    expect(al('a:11&22,b:33', { xlog: -1 }).canon).equal('{"a":11&22,"b":33}')
    expect(al('a:11&22&33,b:44', { xlog: -1 }).canon).equal('{"a":11&22&33,"b":44}')

    expect(al('a:{b:11}&{c:22},b:33', { xlog: -1 }).canon)
      .equal('{"a":{"b":11}&{"c":22},"b":33}')
    //console.dir(al('a:{b:11}&{c:22},b:33'), { depth: null })


    expect(al('a:11&22|33,b:44', { xlog: -1 }).canon).equal('{"a":11&22|33,"b":44}')
    console.dir(al('a:11&22|33,b:44', { xlog: -1 }), { depth: null })

    expect(al('a:11|22&33,b:44', { xlog: -1 }).canon).equal('{"a":11|22&33,"b":44}')
    console.dir(al('a:11|22&33,b:44', { xlog: -1 }), { depth: null })


  })


  it('ref', () => {
    let al = AontuLang
    console.dir(al.jsonic.internal().config)

    let v0 = al('a:/x')
    console.log(v0)
    expect(v0.val.a.parts).equals(['x'])

    let v1 = al('a:/x/y', { xlog: -1 })
    console.log(v1)
    expect(v1.val.a.parts).equals(['x', 'y'])
  })

})

