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
} = require('../lib/val')


const pv = (vstr)=>parseVal('$',vstr)


describe('val', function () {
  it('boundary', () => {
    expect(''+pv('$T')).equal('$T')
    expect(''+pv('$B')).equal('$B')
    expect(''+pv('$T').unify(pv('$T'))).equal('$T')
    expect(''+pv('$T').unify(pv('$B'))).equal('$B')
    expect(''+pv('$B').unify(pv('$T'))).equal('$B')
    expect(''+pv('$B').unify(pv('$B'))).equal('$B')
  })

  
  it('int', () => {
    let it0 = pv('$int')
    let iv0 = pv('1')
    let v0 = it0.unify(iv0)

    expect(''+v0).equal('1')
    expect(v0.val.scalar).equal(1)
    expect(v0 === iv0).true()
    expect(v0 === it0.val).true()

    expect(''+(pv('2').unify(pv('2')))).equal('2')
  })

  
  it('meet', () => {
    let p = new Path('$')
    
    let mt0 = new MeetVal(p,[pv('1'),pv('$int')])
    console.log('mt0:'+mt0)
    
    let mt1 = mt0.unify(new TopVal(p))
    console.log('mt1:'+mt1)

    let mt2 = new MeetVal(p,[pv('$int'),pv('1')])
    console.log('mt2:'+mt2)
    
    let mt3 = new TopVal(p).unify(mt2)
    console.log('mt3:'+mt3)

    console.log('mt4:'+(new TopVal(p).unify(new MeetVal(p,[
      pv('$int'),
      new MeetVal(p,[pv('2'),pv('2')])
    ]))))
  })

  

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
  



  it('ref', () => {
    let c0 = new Context()
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
    
  })

})
