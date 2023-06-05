



import {
  Context,
  Unify,
} from '../lib/unify'


import {
  Lang
} from '../lib/lang'


import { TOP } from '../lib/val'
import { ConjunctVal } from '../lib/val/ConjunctVal'
import { DisjunctVal } from '../lib/val/DisjunctVal'
import { ListVal } from '../lib/val/ListVal'
import { MapVal } from '../lib/val/MapVal'
import { Nil } from '../lib/val/Nil'
import { PrefVal } from '../lib/val/PrefVal'
import { RefVal } from '../lib/val/RefVal'
import { ValBase } from '../lib/val/ValBase'


let lang = new Lang()
let P = lang.parse.bind(lang)


describe('unify', function() {

  it('find', () => {
    // let ref = (s: string) => (P(s) as RefVal)

    // let m0 = P('{a:1,b:{c:2},d:{e:{f:3}}')

    // let c0 = new Context({
    //   root: m0
    // })

    // expect(c0.find(ref('.a'))?.canon).toEqual('1')
    // expect(c0.find(ref('.b.c'))?.canon).toEqual('2')
    // expect(c0.find(ref('.d.e.f'))?.canon).toEqual('3')
    // expect(c0.find(ref('.b'))?.canon).toEqual('{"c":2}')

    // expect(c0.find(ref('.x'))).toEqual(undefined)
  })


  /*  
  it('basic', () => {
    let u0 = new Unify('1')
    expect(u0.res.canon).toEqual('1')

    let uc = (s: string) => new Unify(s).res.canon

    expect(uc('1')).toEqual('1')
    expect(uc('1&1')).toEqual('1')
    expect(uc('number&1')).toEqual('1')
    expect(uc('top&1')).toEqual('1')
    //expect(uc('nil&1')).toEqual('nil')

    expect(uc('{a:1}')).toEqual('{"a":1}')
    expect(uc('{a:1}&{b:2}')).toEqual('{"a":1,"b":2}')
    expect(uc('{a:1}&{a:number,b:2}')).toEqual('{"a":1,"b":2}')
  })


    it('merge-is-conjunct', () => {
      // let ur = (s: string) => new Unify(s).res
      let uc = (s: string) => new Unify(s).res.canon
  
      let u0 = new Unify('a:1,a:integer')
      expect(u0.root.canon).toEqual('{"a":1}')
  
      expect(uc('a:number,a:1')).toEqual('{"a":1}')
      expect(uc('a:{b:1},a:{c:2}')).toEqual('{"a":{"b":1,"c":2}}')
      expect(uc('a:{b:1,c:number,d:boolean},a:{c:2},a:{d:true}'))
        .toEqual('{"a":{"b":1,"c":2,"d":true}}')
  
      expect(uc('a:number,a:true')).toMatch(/^\{"a":nil/)
    })
  
  
    it('pref-in-conjunct', () => {
      let uc = (s: string) => new Unify(s).res.canon
  
      expect(uc('a:{z:*3|number},d:{&:.a,b:{},c:{z:4}}'))
        .toEqual('{"a":{"z":*3|number},' +
          '"d":{&:{"z":*3|number},"b":{"z":*3|number},"c":{"z":4}}}')
  
      expect(uc('a:{z:*3|number},d:{&:.a,b:{z:"bad"},c:{z:4}}'))
        .toEqual('{"a":{"z":*3|number},' +
          '"d":{&:{"z":*3|number},"b":{"z":nil},"c":{"z":4}}}')
  
      expect(new Unify('a:{z:*3|number},d:{&:.a,b:{},c:{z:4}}').res.gen())
        .toEqual({ a: { z: 3 }, d: { b: { z: 3 }, c: { z: 4 } } })
  
  
      return;
  
  
      // conjunct prefs only resolve on generate, not unify
      expect(uc('*1|number')).toEqual('*1|number')
      expect(uc('a:*1|number')).toEqual('{"a":*1|number}')
      expect(uc('{a:*1|number}&{a:2}')).toEqual('{"a":2}')
      expect(uc('q:{a:*1|number},w:.q&{a:2}'))
        .toEqual('{"q":{"a":*1|number},"w":{"a":2}}')
  
      expect(uc('b:{y:1}&{x:1,y:integer,z:*3|number},c:{y:true,z:4}&{x:1,y:integer,z:*3|number}'))
        .toEqual('{"b":{"y":1,"x":1,"z":*3|number},"c":{"y":nil,"z":4,"x":1}}')
  
      expect(uc('a:{x:1,y:integer,z:*3|number},b:{y:1}&/a,c:{y:true,z:4}&/a'))
        .toEqual('{"a":{"x":1,"y":integer,"z":*3|number},"b":{"y":1,"x":1,"z":*3|number},"c":{"y":nil,"z":4,"x":1}}')
  
  
      expect(uc('a:{x:1,y:integer,z:*3|number},d:{b:{y:1}&/a,c:{y:true,z:4}&/a}'))
        .toEqual('{"a":{"x":1,"y":integer,"z":*3|number},"d":{"b":{"y":1,"x":1,"z":*3|number},"c":{"y":nil,"z":4,"x":1}}}')
  
      expect(uc('a:{x:1,y:integer,z:*3|number},d:{&:.a,b:{y:1},c:{y:true,z:4}}'))
        .toEqual('{"a":{"x":1,"y":integer,"z":*3|number},"d":{"b":{"y":1,"x":1,"z":*3|number},"c":{"y":nil,"z":4,"x":1}}}')
  
  
    })
  
  
  
    it('ref', () => {
      let uc = (s: string) => {
        let u = new Unify(s)
        return { c: u.res.canon, d: u.dc }
      }
  
      expect(uc('a:1,b:.a')).toEqual({ c: '{"a":1,"b":1}', d: 1 })
      expect(uc('a:.b,b:1')).toEqual({ c: '{"a":1,"b":1}', d: 1 })
  
      expect(uc('a:1,b:.a,c:.b')).toEqual({ c: '{"a":1,"b":1,"c":1}', d: 1 })
  
      expect(uc('a:{b:1}')).toEqual({ c: '{"a":{"b":1}}', d: 1 })
      expect(uc('{a:{b:1}} & c:2')).toEqual({ c: '{"a":{"b":1},"c":2}', d: 1 })
  
      expect(uc('a:{b:1}, c:.a.b')).toEqual({ c: '{"a":{"b":1},"c":1}', d: 1 })
      expect(uc('c:.a.b, a:{b:1},')).toEqual({ c: '{"c":1,"a":{"b":1}}', d: 1 })
  
      expect(uc('c:.a.b, a:{b:.d}, d:1'))
        .toEqual({ c: '{"c":1,"a":{"b":1},"d":1}', d: 2 })
  
      expect(uc('a:{b:1},x:.a&{y:2}'))
        .toEqual({ c: '{"a":{"b":1},"x":{"b":1,"y":2}}', d: 1 })
  
      expect(uc('a:{b:1,y:number},x:{z2:.a&{y:2},z3:.a&{y:3}}'))
        .toEqual({
          c: '{"a":{"b":1,"y":number},' +
            '"x":{"z2":{"b":1,"y":2},"z3":{"b":1,"y":3}}}', d: 1
        })
  
    })
  
  
    it('spreads', () => {
      let uc = (s: string) => new Unify(s).res.canon
  
      expect(uc('a:{&:{x:1,y:integer},b:{y:1},c:{y:2}}'))
        .toEqual('{"a":{&:{"x":1,"y":integer},"b":{"y":1,"x":1},"c":{"y":2,"x":1}}}')
  
      expect(uc('a:{&:{x:1,y:integer},b:{y:1},c:{y:true}}'))
        .toEqual('{"a":{&:{"x":1,"y":integer},"b":{"y":1,"x":1},"c":{"y":nil,"x":1}}}')
  
      expect(uc('a:{&:{x:1,y:integer,z:*3|number},b:{y:1},c:{y:true}}'))
        .toEqual('{"a":{&:{"x":1,"y":integer,"z":*3|number},"b":{"y":1,"x":1,"z":*3|number},"c":{"y":nil,"x":1,"z":*3|number}}}')
  
      expect(uc('q:{x:1,y:integer},a:{&:.q,b:{y:1},c:{y:2}}'))
        .toEqual('{"q":{"x":1,"y":integer},"a":{&:{"x":1,"y":integer},"b":{"y":1,"x":1},"c":{"y":2,"x":1}}}')
  
      expect(uc('q:{x:1,y:integer},a:{&:.q,b:{y:1},c:{y:true}}'))
        .toEqual('{"q":{"x":1,"y":integer},"a":{&:{"x":1,"y":integer},"b":{"y":1,"x":1},"c":{"y":nil,"x":1}}}')
  
      expect(uc('q:{x:1,y:integer,z:*3|number},a:{&:.q,b:{y:1,z:4},c:{y:2}}'))
        .toEqual('{"q":{"x":1,"y":integer,"z":*3|number},"a":{&:{"x":1,"y":integer,"z":*3|number},"b":{"y":1,"z":4,"x":1},"c":{"y":2,"x":1,"z":*3|number}}}')
  
  
      expect(uc('p:{x:1},q:{y:2},u:.p&.q,v:{&:.u,a:{z:33},b:{z:44}}'))
        .toEqual('{"p":{"x":1},"q":{"y":2},"u":{"x":1,"y":2},"v":{&:{"x":1,"y":2},"a":{"z":33,"x":1,"y":2},"b":{"z":44,"x":1,"y":2}}}')
  
      expect(uc('p:x:1,q:y:2,u:.p&.q,v:{&:.u,a:z:33,b:z:44}'))
        .toEqual('{"p":{"x":1},"q":{"y":2},"u":{"x":1,"y":2},"v":{&:{"x":1,"y":2},"a":{"z":33,"x":1,"y":2},"b":{"z":44,"x":1,"y":2}}}')
  
      expect(uc('p:x:1,q:y:2,v:{&:.p,&:.q,a:z:33,b:z:44}'))
        .toEqual('{"p":{"x":1},"q":{"y":2},"v":{&:{"x":1,"y":2},"a":{"z":33,"x":1,"y":2},"b":{"z":44,"x":1,"y":2}}}')
  
    })
  
  
  
    /*
    it('error', () => {
      let uc = (s: string) => new Unify(s).res.canon
  
      expect(uc('1&string')).startsWith('nil')
      expect(uc('{a:1}&{a:string}')).startsWith('{"a":nil')
  
  
      let e0 = new Unify('a:b:1&2')
      //console.log(e0.res.canon)
      //console.log(e0.err)
      expect(e0.err[0].path.join('/')).toEqual('a/b')
  
      let e1 = new Unify('a:b:1&2,c:d:e:true&3')
      //console.log(e1.res.canon)
      //console.log(e1.err)
      expect(e1.err[0].path.join('/')).toEqual('a/b')
      expect(e1.err[1].path.join('/')).toEqual('c/d/e')
  
  
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
    */
})




