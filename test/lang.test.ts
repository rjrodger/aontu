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

    let src = `
a:  string
b:  foo

`


    console.dir(al(src), { depth: null })
    //expect(al(src)).equal()


    console.dir(al(`
a: {
  b: {
    c: 1
  }
}
`), { depth: null })

  })

})

