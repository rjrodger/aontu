import Lab from '@hapi/lab'
import Code from '@hapi/code'




var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect


import { FileResolver } from '@jsonic/multisource/resolver/file'




import {
  TOP,
  Val,
  MapVal,
} from '../lib/val'

import {
  Lang
} from '../lib/lang'

import {
  Unify,
  Context,
} from '../lib/unify'


let lang = new Lang()
let P: (s: string, o?: any) => Val = lang.parse.bind(lang)


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


  it('merge', () => {
    let ctx = makeCtx()

    let v0 = P('a:{x:1},a:{y:2}')
    //console.dir(v0, { depth: null })
    expect(v0.canon).equal('{"a":{"x":1}&{"y":2}}')

    let u0 = v0.unify(TOP, ctx)
    //console.dir(u0, { depth: null })
    expect(u0.canon).equal('{"a":{"x":1,"y":2}}')

    expect(u0.gen([])).equal({ a: { x: 1, y: 2 } })
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


  it('conjunct', () => {
    expect(() => P('*1')).throws()
    expect(() => P('*1&number')).throws()
    expect(() => P('number&*1')).throws()
  })


  it('disjunct', () => {
    expect(() => P('*1')).throws()

    let v1 = P('*1|number')
    //console.dir(v1, { depth: null })
    expect(v1.canon).equals('*1|number')

    let v2 = P('integer|*2', { xlog: -1 })
    //console.dir(v2, { depth: null })
    expect(v2.canon).equals('integer|*2')
  })
})


function makeCtx() {
  return new Context({ root: new MapVal({}) })
}
