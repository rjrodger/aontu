import Lab from '@hapi/lab'
import Code from '@hapi/code'




var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect


import { FileResolver } from '@jsonic/multisource/resolver/file'




import {
  TOP,
  Nil,
  NumberVal,
  StringVal,
  BooleanVal,
  IntegerVal,
  ScalarTypeVal,
  Integer,
} from '../lib/val'

import {
  Lang
} from '../lib/lang'

import {
  Unify
} from '../lib/unify'


let lang = new Lang()
let P = lang.parse.bind(lang)


describe('lang', function() {

  it('happy', () => {
    expect(P('1').canon).equal('1')
    expect(P('a:1').canon).equal('{"a":1}')
    expect(P('{a:{b:x}}').canon).equal('{"a":{"b":"x"}}')

    expect(P('a:11|22,b:33', { xlog: -1 }).canon).equal('{"a":11|22,"b":33}')
    expect(P('a:11|22|33,b:44', { xlog: -1 }).canon).equal('{"a":11|22|33,"b":44}')


    expect(P('a:{b:11}|{c:22},b:33', { xlog: -1 }).canon)
      .equal('{"a":{"b":11}|{"c":22},"b":33}')
    //console.dir(P('a:{b:11}|{c:22},b:33'), { depth: null })



    expect(P('a:11&22,b:33', { xlog: -1 }).canon).equal('{"a":11&22,"b":33}')
    expect(P('a:11&22&33,b:44', { xlog: -1 }).canon).equal('{"a":11&22&33,"b":44}')

    expect(P('a:{b:11}&{c:22},b:33', { xlog: -1 }).canon)
      .equal('{"a":{"b":11}&{"c":22},"b":33}')
    //console.dir(P('a:{b:11}&{c:22},b:33'), { depth: null })


    expect(P('a:11&22|33,b:44', { xlog: -1 }).canon).equal('{"a":11&22|33,"b":44}')
    console.dir(P('a:11&22|33,b:44', { xlog: -1 }), { depth: null })

    expect(P('a:11|22&33,b:44', { xlog: -1 }).canon).equal('{"a":11|22&33,"b":44}')
    console.dir(P('a:11|22&33,b:44', { xlog: -1 }), { depth: null })


  })


  it('ref', () => {
    // console.dir(lang.jsonic.internal().config)

    let v0 = P('a:/x')
    console.log(v0)
    expect(v0.val.a.parts).equals(['x'])

    let v1 = P('a:/x/y', { xlog: -1 })
    console.log(v1)
    expect(v1.val.a.parts).equals(['x', 'y'])
  })


  it('file', () => {
    let g0 = new Lang({ resolver: FileResolver })

    let t01v = g0.parse('@"' + __dirname + '/t01.jsonic"')
    expect(t01v.canon).equals('{"a":1,"b":{"d":2},"c":3}')

    let t02v = g0.parse('@"' + __dirname + '/t02.jsonic"')
    console.dir(t02v, { depth: null })
    console.log(t02v.canon)


    let u02 = new Unify(t02v)
    console.log(u02.res.canon)
    console.log(u02.res.gen([]))
  })

})

