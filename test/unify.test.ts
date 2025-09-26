
import { describe, test } from 'node:test'

import { expect } from '@hapi/code'

import {
  Context,
  Unify,
} from '../dist/unify'


import {
  Lang
} from '../dist/lang'


import { TOP } from '../dist/val'
import { ConjunctVal } from '../dist/val/ConjunctVal'
import { DisjunctVal } from '../dist/val/DisjunctVal'
import { ListVal } from '../dist/val/ListVal'
import { MapVal } from '../dist/val/MapVal'
import { Nil } from '../dist/val/Nil'
import { PrefVal } from '../dist/val/PrefVal'
import { RefVal } from '../dist/val/RefVal'
import { ValBase } from '../dist/val/ValBase'


let lang = new Lang()

const G = (x: string, ctx?: any) => new Unify(x, lang).res
  .gen(ctx || new Context({ root: new MapVal({ peg: {} }) }))


describe('unify', function() {

  test('condis-same', () => {
    expect(G('a')).equal('a')
    expect(G('a&a')).equal('a')
    expect(G('a|a')).equal('a')

    expect(G('(a)')).equal('a')
    expect(G('(a&a)')).equal('a')
    expect(G('(a|a)')).equal('a')

    expect(G('(a)&a')).equal('a')
    expect(G('(a&a)&a')).equal('a')
    expect(G('(a|a)&a')).equal('a')

    expect(G('a&(a)')).equal('a')
    expect(G('a&(a&a)')).equal('a')
    expect(G('a&(a|a)')).equal('a')

    expect(G('a&(a)&a')).equal('a')
    expect(G('a&(a&a)&a')).equal('a')
    expect(G('a&(a|a)&a')).equal('a')

    expect(G('a&a')).equal('a')
    expect(G('a&a&a')).equal('a')
    expect(G('a|a&a')).equal('a')

    expect(G('a&a|a')).equal('a')

    expect(G('a&a&a&a')).equal('a')
    expect(G('a&a|a&a')).equal('a')

    expect(G('(a)|a')).equal('a')
    expect(G('(a&a)|a')).equal('a')
    expect(G('(a|a)|a')).equal('a')

    expect(G('a|(a)')).equal('a')
    expect(G('a|(a&a)')).equal('a')
    expect(G('a|(a|a)')).equal('a')

    expect(G('a|(a)|a')).equal('a')
    expect(G('a|(a&a)|a')).equal('a')
    expect(G('a|(a|a)|a')).equal('a')

    expect(G('a|a')).equal('a')
    expect(G('a&a|a')).equal('a')
    expect(G('a|a|a')).equal('a')

    expect(G('a|a&a')).equal('a')

    expect(G('a|a|a|a')).equal('a')
    expect(G('a|a&a|a')).equal('a')


    expect(G('x:a')).equal({ x: 'a' })
    expect(G('x:a&a')).equal({ x: 'a' })
    expect(G('x:a|a')).equal({ x: 'a' })

    expect(G('x:(a)')).equal({ x: 'a' })
    expect(G('x:(a&a)')).equal({ x: 'a' })
    expect(G('x:(a|a)')).equal({ x: 'a' })

    expect(G('x:(a)&a')).equal({ x: 'a' })
    expect(G('x:(a&a)&a')).equal({ x: 'a' })
    expect(G('x:(a|a)&a')).equal({ x: 'a' })

    expect(G('x:a&(a)')).equal({ x: 'a' })
    expect(G('x:a&(a&a)')).equal({ x: 'a' })
    expect(G('x:a&(a|a)')).equal({ x: 'a' })

    expect(G('x:a&(a)&a')).equal({ x: 'a' })
    expect(G('x:a&(a&a)&a')).equal({ x: 'a' })
    expect(G('x:a&(a|a)&a')).equal({ x: 'a' })

    expect(G('x:a&a')).equal({ x: 'a' })
    expect(G('x:a&a&a')).equal({ x: 'a' })
    expect(G('x:a|a&a')).equal({ x: 'a' })

    expect(G('x:a&a|a')).equal({ x: 'a' })

    expect(G('x:a&a&a&a')).equal({ x: 'a' })
    expect(G('x:a&a|a&a')).equal({ x: 'a' })

    expect(G('x:(a)|a')).equal({ x: 'a' })
    expect(G('x:(a&a)|a')).equal({ x: 'a' })
    expect(G('x:(a|a)|a')).equal({ x: 'a' })

    expect(G('x:a|(a)')).equal({ x: 'a' })
    expect(G('x:a|(a&a)')).equal({ x: 'a' })
    expect(G('x:a|(a|a)')).equal({ x: 'a' })

    expect(G('x:a|(a)|a')).equal({ x: 'a' })
    expect(G('x:a|(a&a)|a')).equal({ x: 'a' })
    expect(G('x:a|(a|a)|a')).equal({ x: 'a' })

    expect(G('x:a|a')).equal({ x: 'a' })
    expect(G('x:a&a|a')).equal({ x: 'a' })
    expect(G('x:a|a|a')).equal({ x: 'a' })

    expect(G('x:a|a&a')).equal({ x: 'a' })

    expect(G('x:a|a|a|a')).equal({ x: 'a' })
    expect(G('x:a|a&a|a')).equal({ x: 'a' })


    expect(G('[a]')).equal(['a'])
    expect(G('[a&a]')).equal(['a'])
    expect(G('[a|a]')).equal(['a'])

    expect(G('[(a)]')).equal(['a'])
    expect(G('[(a&a)]')).equal(['a'])
    expect(G('[(a|a)]')).equal(['a'])

    expect(G('[(a)&a]')).equal(['a'])
    expect(G('[(a&a)&a]')).equal(['a'])
    expect(G('[(a|a)&a]')).equal(['a'])

    expect(G('[a&(a)]')).equal(['a'])
    expect(G('[a&(a&a)]')).equal(['a'])
    expect(G('[a&(a|a)]')).equal(['a'])

    expect(G('[a&(a)&a]')).equal(['a'])
    expect(G('[a&(a&a)&a]')).equal(['a'])
    expect(G('[a&(a|a)&a]')).equal(['a'])

    expect(G('[a&a]')).equal(['a'])
    expect(G('[a&a&a]')).equal(['a'])
    expect(G('[a|a&a]')).equal(['a'])

    expect(G('[a&a|a]')).equal(['a'])

    expect(G('[a&a&a&a]')).equal(['a'])
    expect(G('[a&a|a&a]')).equal(['a'])

    expect(G('[(a)|a]')).equal(['a'])
    expect(G('[(a&a)|a]')).equal(['a'])
    expect(G('[(a|a)|a]')).equal(['a'])

    expect(G('[a|(a)]')).equal(['a'])
    expect(G('[a|(a&a)]')).equal(['a'])
    expect(G('[a|(a|a)]')).equal(['a'])

    expect(G('[a|(a)|a]')).equal(['a'])
    expect(G('[a|(a&a)|a]')).equal(['a'])
    expect(G('[a|(a|a)|a]')).equal(['a'])

    expect(G('[a|a]')).equal(['a'])
    expect(G('[a&a|a]')).equal(['a'])
    expect(G('[a|a|a]')).equal(['a'])

    expect(G('[a|a&a]')).equal(['a'])

    expect(G('[a|a|a|a]')).equal(['a'])
    expect(G('[a|a&a|a]')).equal(['a'])

  })


  test('condis-different', () => {
    expect(G('a')).equal('a')
    expect(G('a|b')).equal(undefined)
    expect(G('a&b')).equal(undefined)

    expect(G('x:a')).equal({ x: 'a' })
    expect(G('x:a|b')).equal({ x: undefined })
    expect(G('x:a&b')).equal({ x: undefined })

    expect(G('(a|b)&a')).equal('a')
    expect(G('a&(a|b)')).equal('a')
    expect(G('a&(a|b)&a')).equal('a')

    expect(G('a|b&a')).equal('a')
    expect(G('a&a|b')).equal('a')
    expect(G('a&a|b&a')).equal('a')

    expect(G('a|(b&a)')).equal('a')

    expect(G('(a|b)&a')).equal('a')
    expect(G('(a|b)&b')).equal('b')
    expect(G('(a|b)&c')).equal(undefined)
  })


  test('pref', () => {
    expect(G('*a|string')).equal('a')
    expect(G('*a|b')).equal('a')
    expect(G('**1|*b')).equal('b')
    expect(G('***1|**2|*3')).equal(3)
    expect(G('***a|**b|*c')).equal('c')
    expect(G('***1|**b|*true')).equal(true)
    expect(G('***1|*true')).equal(true)

    expect(G('x:*a')).equal({ x: 'a' })
    // expect(G('x:*a x:b')).equal({ x: 'b' })

    expect(G('x:*{a:1}')).equal({ x: { a: 1 } })
    expect(G('x:*{a:1} x:{a:2}')).equal({ x: { a: 2 } })

    expect(G('x:*{a:1}|{a:number}')).equal({ x: { a: 1 } })
    expect(G('x:*{a:1}|{a:number} x:{a:2}')).equal({ x: { a: 2 } })
  })

  // test('find', () => {
  // let ref = (s: string) => (P(s) as RefVal)

  // let m0 = P('{a:1,b:{c:2},d:{e:{f:3}}')

  // let c0 = new Context({
  //   root: m0
  // })

  // expect(c0.find(ref('.a'))?.canon).equal('1')
  // expect(c0.find(ref('.b.c'))?.canon).equal('2')
  // expect(c0.find(ref('.d.e.f'))?.canon).equal('3')
  // expect(c0.find(ref('.b'))?.canon).equal('{"c":2}')

  // expect(c0.find(ref('.x'))).equal(undefined)
  // })


  /*  
  test('basic', () => {
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


    test('merge-is-conjunct', () => {
      // let ur = (s: string) => new Unify(s).res
      let uc = (s: string) => new Unify(s).res.canon
  
      let u0 = new Unify('a:1,a:integer')
      expect(u0.root.canon).equal('{"a":1}')
  
      expect(uc('a:number,a:1')).equal('{"a":1}')
      expect(uc('a:{b:1},a:{c:2}')).equal('{"a":{"b":1,"c":2}}')
      expect(uc('a:{b:1,c:number,d:boolean},a:{c:2},a:{d:true}'))
        .equal('{"a":{"b":1,"c":2,"d":true}}')
  
      expect(uc('a:number,a:true')).match(/^\{"a":nil/)
    })
  
  
    test('pref-in-conjunct', () => {
      let uc = (s: string) => new Unify(s).res.canon
  
      expect(uc('a:{z:*3|number},d:{&:.a,b:{},c:{z:4}}'))
        .equal('{"a":{"z":*3|number},' +
          '"d":{&:{"z":*3|number},"b":{"z":*3|number},"c":{"z":4}}}')
  
      expect(uc('a:{z:*3|number},d:{&:.a,b:{z:"bad"},c:{z:4}}'))
        .equal('{"a":{"z":*3|number},' +
          '"d":{&:{"z":*3|number},"b":{"z":nil},"c":{"z":4}}}')
  
      expect(new Unify('a:{z:*3|number},d:{&:.a,b:{},c:{z:4}}').res.gen())
        .equal({ a: { z: 3 }, d: { b: { z: 3 }, c: { z: 4 } } })
  
  
      return;
  
  
      // conjunct prefs only resolve on generate, not unify
      expect(uc('*1|number')).equal('*1|number')
      expect(uc('a:*1|number')).equal('{"a":*1|number}')
      expect(uc('{a:*1|number}&{a:2}')).equal('{"a":2}')
      expect(uc('q:{a:*1|number},w:.q&{a:2}'))
        .equal('{"q":{"a":*1|number},"w":{"a":2}}')
  
      expect(uc('b:{y:1}&{x:1,y:integer,z:*3|number},c:{y:true,z:4}&{x:1,y:integer,z:*3|number}'))
        .equal('{"b":{"y":1,"x":1,"z":*3|number},"c":{"y":nil,"z":4,"x":1}}')
  
      expect(uc('a:{x:1,y:integer,z:*3|number},b:{y:1}&/a,c:{y:true,z:4}&/a'))
        .equal('{"a":{"x":1,"y":integer,"z":*3|number},"b":{"y":1,"x":1,"z":*3|number},"c":{"y":nil,"z":4,"x":1}}')
  
  
      expect(uc('a:{x:1,y:integer,z:*3|number},d:{b:{y:1}&/a,c:{y:true,z:4}&/a}'))
        .equal('{"a":{"x":1,"y":integer,"z":*3|number},"d":{"b":{"y":1,"x":1,"z":*3|number},"c":{"y":nil,"z":4,"x":1}}}')
  
      expect(uc('a:{x:1,y:integer,z:*3|number},d:{&:.a,b:{y:1},c:{y:true,z:4}}'))
        .equal('{"a":{"x":1,"y":integer,"z":*3|number},"d":{"b":{"y":1,"x":1,"z":*3|number},"c":{"y":nil,"z":4,"x":1}}}')
  
  
    })
  
  
  
    test('ref', () => {
      let uc = (s: string) => {
        let u = new Unify(s)
        return { c: u.res.canon, d: u.dc }
      }
  
      expect(uc('a:1,b:.a')).equal({ c: '{"a":1,"b":1}', d: 1 })
      expect(uc('a:.b,b:1')).equal({ c: '{"a":1,"b":1}', d: 1 })
  
      expect(uc('a:1,b:.a,c:.b')).equal({ c: '{"a":1,"b":1,"c":1}', d: 1 })
  
      expect(uc('a:{b:1}')).equal({ c: '{"a":{"b":1}}', d: 1 })
      expect(uc('{a:{b:1}} & c:2')).equal({ c: '{"a":{"b":1},"c":2}', d: 1 })
  
      expect(uc('a:{b:1}, c:.a.b')).equal({ c: '{"a":{"b":1},"c":1}', d: 1 })
      expect(uc('c:.a.b, a:{b:1},')).equal({ c: '{"c":1,"a":{"b":1}}', d: 1 })
  
      expect(uc('c:.a.b, a:{b:.d}, d:1'))
        .equal({ c: '{"c":1,"a":{"b":1},"d":1}', d: 2 })
  
      expect(uc('a:{b:1},x:.a&{y:2}'))
        .equal({ c: '{"a":{"b":1},"x":{"b":1,"y":2}}', d: 1 })
  
      expect(uc('a:{b:1,y:number},x:{z2:.a&{y:2},z3:.a&{y:3}}'))
        .equal({
          c: '{"a":{"b":1,"y":number},' +
            '"x":{"z2":{"b":1,"y":2},"z3":{"b":1,"y":3}}}', d: 1
        })
  
    })
  
  
    test('spreads', () => {
      let uc = (s: string) => new Unify(s).res.canon
  
      expect(uc('a:{&:{x:1,y:integer},b:{y:1},c:{y:2}}'))
        .equal('{"a":{&:{"x":1,"y":integer},"b":{"y":1,"x":1},"c":{"y":2,"x":1}}}')
  
      expect(uc('a:{&:{x:1,y:integer},b:{y:1},c:{y:true}}'))
        .equal('{"a":{&:{"x":1,"y":integer},"b":{"y":1,"x":1},"c":{"y":nil,"x":1}}}')
  
      expect(uc('a:{&:{x:1,y:integer,z:*3|number},b:{y:1},c:{y:true}}'))
        .equal('{"a":{&:{"x":1,"y":integer,"z":*3|number},"b":{"y":1,"x":1,"z":*3|number},"c":{"y":nil,"x":1,"z":*3|number}}}')
  
      expect(uc('q:{x:1,y:integer},a:{&:.q,b:{y:1},c:{y:2}}'))
        .equal('{"q":{"x":1,"y":integer},"a":{&:{"x":1,"y":integer},"b":{"y":1,"x":1},"c":{"y":2,"x":1}}}')
  
      expect(uc('q:{x:1,y:integer},a:{&:.q,b:{y:1},c:{y:true}}'))
        .equal('{"q":{"x":1,"y":integer},"a":{&:{"x":1,"y":integer},"b":{"y":1,"x":1},"c":{"y":nil,"x":1}}}')
  
      expect(uc('q:{x:1,y:integer,z:*3|number},a:{&:.q,b:{y:1,z:4},c:{y:2}}'))
        .equal('{"q":{"x":1,"y":integer,"z":*3|number},"a":{&:{"x":1,"y":integer,"z":*3|number},"b":{"y":1,"z":4,"x":1},"c":{"y":2,"x":1,"z":*3|number}}}')
  
  
      expect(uc('p:{x:1},q:{y:2},u:.p&.q,v:{&:.u,a:{z:33},b:{z:44}}'))
        .equal('{"p":{"x":1},"q":{"y":2},"u":{"x":1,"y":2},"v":{&:{"x":1,"y":2},"a":{"z":33,"x":1,"y":2},"b":{"z":44,"x":1,"y":2}}}')
  
      expect(uc('p:x:1,q:y:2,u:.p&.q,v:{&:.u,a:z:33,b:z:44}'))
        .equal('{"p":{"x":1},"q":{"y":2},"u":{"x":1,"y":2},"v":{&:{"x":1,"y":2},"a":{"z":33,"x":1,"y":2},"b":{"z":44,"x":1,"y":2}}}')
  
      expect(uc('p:x:1,q:y:2,v:{&:.p,&:.q,a:z:33,b:z:44}'))
        .equal('{"p":{"x":1},"q":{"y":2},"v":{&:{"x":1,"y":2},"a":{"z":33,"x":1,"y":2},"b":{"z":44,"x":1,"y":2}}}')
  
    })
  
  
  
    /*
    test('error', () => {
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
  
    })
    */
})




