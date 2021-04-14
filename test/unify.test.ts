import Lab from '@hapi/lab'
import Code from '@hapi/code'



var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect


//import { Jsonic } from 'jsonic'





import {
  Context
} from '../lib/unify'

import {
  RefVal
} from '../lib/val'

import {
  AontuLang
} from '../lib/lang'


describe('unify', function() {

  it('find', () => {
    let al = AontuLang
    let ref = (s: string) => (al(s) as RefVal)

    let m0 = al('{a:1,b:{c:2},d:{e:{f:3}}')

    let c0 = new Context({
      root: m0
    })

    expect(c0.find(ref('/a')).canon).equals('1')
    expect(c0.find(ref('/b/c')).canon).equals('2')
    expect(c0.find(ref('/d/e/f')).canon).equals('3')
    expect(c0.find(ref('/b')).canon).equals('{"c":2}')

    expect(c0.find(ref('/x'))).equals(undefined)
  })

})

