import Lab from '@hapi/lab'
import Code from '@hapi/code'



var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect


//import { Jsonic } from 'jsonic'





import {
  Context,
  Unify,
} from '../lib/unify'

import {
  RefVal
} from '../lib/val'

import {
  Lang
} from '../lib/lang'


let lang = new Lang()
let P = lang.parse.bind(lang)


describe('unify', function() {

  it('find', () => {
    let ref = (s: string) => (P(s) as RefVal)

    let m0 = P('{a:1,b:{c:2},d:{e:{f:3}}')

    let c0 = new Context({
      root: m0
    })

    expect(c0.find(ref('/a')).canon).equals('1')
    expect(c0.find(ref('/b/c')).canon).equals('2')
    expect(c0.find(ref('/d/e/f')).canon).equals('3')
    expect(c0.find(ref('/b')).canon).equals('{"c":2}')

    expect(c0.find(ref('/x'))).equals(undefined)
  })

  it('basic', () => {
    let u0 = new Unify('1')
    expect(u0.res.canon).equal('1')

    let uc = (s: string) => new Unify(s).res.canon

    expect(uc('1')).equal('1')
    expect(uc('1&1')).equal('1')
    expect(uc('number&1')).equal('1')
    expect(uc('top&1')).equal('1')
    //expect(uc('nil&1')).equal('nil')

    expect(uc('{a:1}')).equal('{"a":1}')
    expect(uc('{a:1}&{b:2}')).equal('{"a":1,"b":2}')
    expect(uc('{a:1}&{a:number,b:2}')).equal('{"a":1,"b":2}')
  })


  it('merge-is-conjunct', () => {
    // let ur = (s: string) => new Unify(s).res
    let uc = (s: string) => new Unify(s).res.canon

    let u0 = new Unify('a:1,a:integer')
    expect(u0.root.canon).equal('{"a":1&integer}')

    expect(uc('a:number,a:1')).equals('{"a":1}')
    expect(uc('a:{b:1},a:{c:2}')).equals('{"a":{"b":1,"c":2}}')
    expect(uc('a:{b:1,c:number,d:boolean},a:{c:2},a:{d:true}'))
      .equals('{"a":{"b":1,"c":2,"d":true}}')

    expect(uc('a:number,a:true')).startsWith('{"a":nil')
  })


  it('pref-in-conjunct', () => {
    let uc = (s: string) => new Unify(s).res.canon

    expect(uc('a:{z:*3|number},d:{&=/a,b:{},c:{z:4}}'))
      .equal('{"a":{"z":*3|number},' +
        '"d":{&={"z":*3|number},"b":{"z":*3|number},"c":{"z":4}}}')

    expect(uc('a:{z:*3|number},d:{&=/a,b:{z:"bad"},c:{z:4}}'))
      .equal('{"a":{"z":*3|number},' +
        '"d":{&={"z":*3|number},"b":{"z":nil},"c":{"z":4}}}')

    expect(new Unify('a:{z:*3|number},d:{&=/a,b:{},c:{z:4}}').res.gen([]))
      .equal({ a: { z: 3 }, d: { b: { z: 3 }, c: { z: 4 } } })


    return;


    // conjunct prefs only resolve on generate, not unify
    expect(uc('*1|number')).equals('*1|number')
    expect(uc('a:*1|number')).equals('{"a":*1|number}')
    expect(uc('{a:*1|number}&{a:2}')).equals('{"a":2}')
    expect(uc('q:{a:*1|number},w:/q&{a:2}'))
      .equals('{"q":{"a":*1|number},"w":{"a":2}}')

    expect(uc('b:{y:1}&{x:1,y:integer,z:*3|number},c:{y:true,z:4}&{x:1,y:integer,z:*3|number}'))
      .equal('{"b":{"y":1,"x":1,"z":*3|number},"c":{"y":nil,"z":4,"x":1}}')

    expect(uc('a:{x:1,y:integer,z:*3|number},b:{y:1}&/a,c:{y:true,z:4}&/a'))
      .equal('{"a":{"x":1,"y":integer,"z":*3|number},"b":{"y":1,"x":1,"z":*3|number},"c":{"y":nil,"z":4,"x":1}}')


    expect(uc('a:{x:1,y:integer,z:*3|number},d:{b:{y:1}&/a,c:{y:true,z:4}&/a}'))
      .equal('{"a":{"x":1,"y":integer,"z":*3|number},"d":{"b":{"y":1,"x":1,"z":*3|number},"c":{"y":nil,"z":4,"x":1}}}')

    expect(uc('a:{x:1,y:integer,z:*3|number},d:{&=/a,b:{y:1},c:{y:true,z:4}}'))
      .equal('{"a":{"x":1,"y":integer,"z":*3|number},"d":{"b":{"y":1,"x":1,"z":*3|number},"c":{"y":nil,"z":4,"x":1}}}')


  })



  it('ref', () => {
    let uc = (s: string) => {
      let u = new Unify(s)
      return { c: u.res.canon, d: u.dc }
    }

    expect(uc('a:1,b:/a')).equal({ c: '{"a":1,"b":1}', d: 1 })
    expect(uc('a:/b,b:1')).equal({ c: '{"a":1,"b":1}', d: 1 })

    expect(uc('a:1,b:/a,c:/b')).equal({ c: '{"a":1,"b":1,"c":1}', d: 2 })

    expect(uc('a:{b:1}')).equal({ c: '{"a":{"b":1}}', d: 1 })
    expect(uc('{a:{b:1}} & c:2')).equal({ c: '{"a":{"b":1},"c":2}', d: 1 })

    expect(uc('a:{b:1}, c:/a/b')).equal({ c: '{"a":{"b":1},"c":1}', d: 1 })
    expect(uc('c:/a/b, a:{b:1},')).equal({ c: '{"c":1,"a":{"b":1}}', d: 1 })

    expect(uc('c:/a/b, a:{b:/d}, d:1'))
      .equal({ c: '{"c":1,"a":{"b":1},"d":1}', d: 2 })

    expect(uc('a:{b:1},x:/a&{y:2}'))
      .equal({ c: '{"a":{"b":1},"x":{"b":1,"y":2}}', d: 1 })

    expect(uc('a:{b:1,y:number},x:{z2:/a&{y:2},z3:/a&{y:3}}'))
      .equal({
        c: '{"a":{"b":1,"y":number},' +
          '"x":{"z2":{"b":1,"y":2},"z3":{"b":1,"y":3}}}', d: 1
      })

  })


  it('spreads', () => {
    let uc = (s: string) => new Unify(s).res.canon

    expect(uc('a:{&={x:1,y:integer},b:{y:1},c:{y:2}}'))
      .equal('{"a":{&={"x":1,"y":integer},"b":{"y":1,"x":1},"c":{"y":2,"x":1}}}')

    expect(uc('a:{&={x:1,y:integer},b:{y:1},c:{y:true}}'))
      .equal('{"a":{&={"x":1,"y":integer},"b":{"y":1,"x":1},"c":{"y":nil,"x":1}}}')

    expect(uc('a:{&={x:1,y:integer,z:*3|number},b:{y:1},c:{y:true}}'))
      .equal('{"a":{&={"x":1,"y":integer,"z":*3|number},"b":{"y":1,"x":1,"z":*3|number},"c":{"y":nil,"x":1,"z":*3|number}}}')

    expect(uc('q:{x:1,y:integer},a:{&=/q,b:{y:1},c:{y:2}}'))
      .equal('{"q":{"x":1,"y":integer},"a":{&={"x":1,"y":integer},"b":{"y":1,"x":1},"c":{"y":2,"x":1}}}')

    expect(uc('q:{x:1,y:integer},a:{&=/q,b:{y:1},c:{y:true}}'))
      .equal('{"q":{"x":1,"y":integer},"a":{&={"x":1,"y":integer},"b":{"y":1,"x":1},"c":{"y":nil,"x":1}}}')

    expect(uc('q:{x:1,y:integer,z:*3|number},a:{&=/q,b:{y:1,z:4},c:{y:2}}'))
      .equal('{"q":{"x":1,"y":integer,"z":*3|number},"a":{&={"x":1,"y":integer,"z":*3|number},"b":{"y":1,"z":4,"x":1},"c":{"y":2,"x":1,"z":*3|number}}}')

  })



  it('error', () => {
    let uc = (s: string) => new Unify(s).res.canon

    expect(uc('1&string')).startsWith('nil')
    expect(uc('{a:1}&{a:string}')).startsWith('{"a":nil')


    let e0 = new Unify('a:b:1&2')
    //console.log(e0.res.canon)
    //console.log(e0.err)
    expect(e0.err[0].path.join('/')).equal('a/b')

    let e1 = new Unify('a:b:1&2,c:d:e:true&3')
    //console.log(e1.res.canon)
    //console.log(e1.err)
    expect(e1.err[0].path.join('/')).equal('a/b')
    expect(e1.err[1].path.join('/')).equal('c/d/e')


    let e2 = new Unify(`
a: {
  b: {
    c: 1
    d: 2 & 3 
  }
}
`)

    //console.dir(e2.res, { depth: null })
    //console.dir(e2.err, { depth: null })

  })
})




