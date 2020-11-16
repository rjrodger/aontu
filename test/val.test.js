/* Copyright (c) 2020 Richard Rodger and other contributors, MIT License */
'use strict'

var Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

var Code = require('@hapi/code')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect



let {
  parseVal
} = require('../lib/parse')


let {
  Path,
  Context,
  TopVal,
  IntTypeVal,
  IntScalarVal,
  MapVal,
  MeetVal,
  RefVal,
} = require('../lib/val')


const pv = (vstr,path)=>parseVal(path||'$',vstr)
const us = (vs0,vs1,ctx)=>pv(vs0).unify(pv(vs1),ctx||new Context())+''


describe('val', function () {
  it('boundary', () => {
    expect(pv('$T')+'').equal('$T')
    expect(pv('$B')+'').equal('$B')
    expect(us('$T','$T')).equal('$T')
    expect(us('$T','$B')).equal('$B')
    expect(us('$B','$T')).equal('$B')
    expect(us('$B','$B')).equal('$B')
  })


  it('int', () => {
    expect(pv('$int')+'').equal('$int')
    expect(us('$int','$int')).equal('$int')
    expect(us('$T','$int')).equal('$int')
    expect(us('$int','$T')).equal('$int')

    expect(pv('1')+'').equal('1')
    expect(us('$int','1')).equal('1')
    expect(us('1','$int')).equal('1')
    expect(us('1','1')).equal('1')
  })


  it('context', () => {
    let c0 = new Context()

    c0.add(pv('1','$.a'))
    console.log(c0.describe())

    c0.add(pv('2','$.b'))
    console.log(c0.describe())

  })

  it('meet', () => {
    expect(pv('$int & 1')+'').equal('$int & 1')
    expect(pv('1 & $int')+'').equal('1 & $int')

    expect(us('1 & $int','$T')).equal('1')
    expect(us('$T','1 & $int')).equal('1')

    expect(us('1 & $int & 1','$T')).equal('1')
    expect(us('$T','$int & 1 & $int')).equal('1')

    expect(us('1 & $int','1 & $int')).equal('1')
    
    let p = new Path('$')
    let c = new Context()

    let m0 = new MeetVal([
      pv('$int'),
      pv('1'),
    ],p)

    let u0 = m0.unify(pv('$T'),c)
    //console.log(u0)
    //console.log(m0)
    expect(u0+'').equals('1')
    
    let m1 = new MeetVal([
      pv('$int'),
      pv('1'),
      new MeetVal([
        pv('1')
      ])
    ],p)

    let u1 = m1.unify(pv('$T'),c)
    //console.log(u1)
    //console.log(m1)
    expect(u1+'').equals('1')

    
    let m2 = new MeetVal([
      new MeetVal([
        pv('1'),
        new MeetVal([
          pv('1')
        ]),
        pv('$int'),
      ]),
      pv('$int'),
      pv('1'),
    ],p)

    let u2 = m2.unify(pv('$T'),c)
    //console.log(u1)
    //console.log(m1)
    expect(u2+'').equals('1')

  })

  
/*    
  it('map', () => {
    let p = new Path('$')
    
    let m0 = new MapVal(p,{
      a: pv('1'),
      b: pv('2')
    })
    console.log('m0'+m0)
    
    let m1 = new MapVal(p,{
      b: pv('2'),
      c: pv('3'),
    })
    console.log('m1'+m1)
    
    let m2 = m0.unify(m1)
    console.log('m2'+m2)

    let m3 = new MapVal(p,{
      a: pv('11'),
    })
    let m4 = m2.unify(m3)
    console.log('m4'+m4)

  })
*/  



  it('ref', () => {
    console.log('REF')
    let c0 = new Context()

    c0.add(pv('1','$.a'))
    c0.add(pv('$.a','$.b'))

    let $_b = c0.get('$.b')
    console.log($_b)

    let u0 = $_b.unify(pv('$T'),c0)
    console.log('u0:'+u0)

    let u1 = pv('$.d','$.c').unify(pv('1'),c0)
    console.log('u1:'+u1)

    let u2 = pv('$.a','$.e').unify(pv('$.g','$.f'),c0)
    console.log('u2:'+u2)

    let rv0 = pv('$.a','$.b')
    let rv1 = pv('$.a','$.b')
    let u_same = rv1.unify(rv0,c0)
    console.log('u_same:'+u_same)


    let u_i0 = pv('1','$.g').unify(pv('$.a','$.f'), c0)
    console.log('u_i0:'+u_i0)
    let u_i1 = pv('$.a','$.h').unify(pv('1','$.i'), c0)
    console.log('u_i1:'+u_i1)


    
    let c1 = new Context()

    c1.add(pv('$.b','$.a'))
    c1.add(pv('$.a','$.b'))
    console.log(c1)
    console.log(c1.describe())

    let $1_a = c1.get('$.a')
    let $1_b = c1.get('$.b')
    let u3 = $1_b.unify($1_a,c1)
    console.log('u3:'+u3)

    

        
    c1.add(pv('$.e','$.c'))
    c1.add(pv('$.f','$.e'))
    c1.add(pv('$.c','$.f'))
    console.log(c1)
    console.log(c1.describe())

    let $1_c = c1.get('$.c')
    let $1_f = c1.get('$.f')
    let u4 = $1_c.unify($1_f,c1)
    console.log('u4:'+u4)

    

    
    let c2 = new Context()

    c2.add(pv('1 & $.b','$.a'))
    //c2.add(pv('$int','$.b'))
    c2.add(pv('$.a','$.b'))
    console.log(c2)
    console.log(c2.describe())

    let $2_a = c2.get('$.a')
    let $2_b = c2.get('$.b')


    console.log('=======')
    console.log('$2_a', $2_a)
    console.log('$2_b', $2_b)
    
    let u5 = $2_a.unify(pv('$T'),c2)
    //let u5 = $2_a.unify($2_b,c2)
    console.log('u5:'+u5)


    
    
    
    /*
    let p = new Path('$')
    let p_a = new Path('$.a')
    
    c0.pathmap['$.a'] = new IntScalarVal(p_a,1)

    let r0 = parseVal('$.b','$.a')
    console.log('r0:'+r0)
    
    let v0 = r0.unify(new TopVal(p),c0)
    console.log('v0:'+v0)
    console.log('r0:'+r0)


    let p_b = new Path('$.b')
    let m0 = new MapVal(p_b,{
      x: pv('1')
    })
    c0.pathmap['$.c'] = m0
    
    let m1 = new MapVal(p,{
      y: pv('2')
    })

    let m2 = parseVal('$.d','$.c').unify(m1,c0)
    console.log('m2:'+m2)


    c0.pathmap['$.a1'] = new MapVal(new Path('$.a1'),{x:pv('1')})
    c0.pathmap['$.a2'] = new MapVal(new Path('$.a2'),{y:pv('2')})

    let mt0 = new MeetVal(p,[
      parseVal('$.b1','$.a1'),
      parseVal('$.b1','$.a2'),
    ])

    let mt1 = mt0.unify(new TopVal(p),c0)
    console.log('mt1:'+mt0)
*/    
  })

})
