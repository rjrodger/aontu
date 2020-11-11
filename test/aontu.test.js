/* Copyright (c) 2020 Richard Rodger and other contributors, MIT License */
'use strict'

var Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

var Code = require('@hapi/code')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect

//var Aontu = require('..')

let {
  IntTypeVal,
  IntScalarVal,
  NodesVal,
  top,
  Node,
  Path,
  unify,
  reify,
  parseVal,
  parseNode,
} = require('..')

/*
function rs(x) {
  return x.toString(true).replace(/\s+/g, '').replace(/\n+/g, '')
}
*/

describe('aontu', function () {
  it('happy', async () => {})

  it('path', async () => {
    let p0 = new Path('a.b.c')
    expect(''+p0).equal('a.b.c')

    let p1 = p0.slice(1)
    expect(''+p1).equal('b.c')
    expect(''+p0).equal('a.b.c')

    let p2 = p0.append(new Path('d.e'))
    expect(''+p2).equal('a.b.c.d.e')
    expect(''+p1).equal('b.c')
    expect(''+p0).equal('a.b.c')

    let p3 = p1.append(new Path('f'))
    expect(''+p3).equal('b.c.f')
  })

  it('unify-int', async () => {
    let inttype = new IntTypeVal()
    let int1 = new IntScalarVal(1)

    expect(inttype.unify(int1).scalar).equal(1)
    expect(int1.unify(inttype).scalar).equal(1)
  })

  it('node-unify-ints', async () => {
    let p = new Path(['$'])

    let n0 = new Node(p, [new IntTypeVal(), new IntScalarVal(1)])
    expect(n0 + '').equal('$: undefined # int,int=1')

    expect(n0.unify()).equal([])
    expect(n0.val + '').equal('int=1')

    let n1 = new Node('$', ['1', 'int'])
    expect(n1 + '').equal('$: undefined # int=1,int')
    expect(n1.unify()).equal([])
    expect(n1.val + '').equal('int=1')

    let n2 = new Node(new Path('$'), 'int,1,int,1')
    expect(n2 + '').equal('$: undefined # int,int=1,int,int=1')
    expect(n2.unify()).equal([])
    expect(n2.val + '').equal('int=1')
  })

  it('unify-ints', async () => {
    let nodes = unify(['$:int,1', '$:1'])
    expect(nodes + '').equals('$: int=1 # int,int=1,int=1')

    let nodes1 = unify([
      '$.a:int,1',
      '$.a:1',
      '$.b.c:int',
      '$.b.c:2',
      '$.b.d:3',
    ])
    expect(nodes1.length).equal(3)
    expect(reify(nodes1)).equal({ $: { a: 1, b: { c: 2, d: 3 } } })
  })

  it('ref-ints', async () => {
    let v0 = parseVal('$.b.c')
    expect(v0 + '').equal('$.b.c')

    let nodes1 = unify(['$.a: 1', '$.b.c: $.a'])
    expect(nodes1.length).equal(2)
    expect(reify(nodes1)).equal({ $: { a: 1, b: { c: 1 } } })

    let nodes2 = unify([
      '$.a: 1',
      '$.b.c: $.a',
      '$.b.d: $.b.c',
      '$.b.e.f: $.b.d',
    ])
    expect(nodes2.length).equal(4)
    expect(reify(nodes2)).equal({ $: { a: 1, b: { c: 1, d: 1, e: { f: 1 } } } })

    let nodes3 = unify(['$.a: $.b.c', '$.b.c: 1'])
    expect(nodes3.length).equal(3)
    expect(reify(nodes3)).equal({ $: { a: 1, b: { c: 1 } } })
  })


  it('map-ints', async () => {
    let v0 = parseVal('{}')
    expect(v0 + '').equal('{}')

    let v1 = parseVal('{}')
    expect(v0.unify(v1)).equal(v1)

    let nv2 = new NodesVal(2,new Path('$.c'), new Path('$.e'))
    expect(''+nv2).equals('N=2~$.e:$.c')

    let ctx = {
      path: new Path('$.c'),
      nodes:['$.a:1','$.b:2','$.c:{}','$.c.x:3','$.c.y:4','$.d:5','$.e:$.c']
        .map(s=>parseNode(s)),
      index: 2
    }
    let v2 = nv2.unify(top,ctx)
    expect(''+v2.nodes)
      .equal('$.e: undefined # {},$.e.x: undefined # int=3,$.e.y: undefined # int=4')
    
    let nodes1 = unify(['$.a:1','$.b:2','$.a:-1','$.c:{}','$.c.x:3','$.c.y:4','$.d:5','$.e:$.c'])
    expect(nodes1.length).equal(10)
    expect(reify(nodes1)).equal({'$': { a: undefined, b: 2, c: { x: 3, y: 4 }, d: 5, e: { x: 3, y: 4 } }})
  })

  let nodes2 = unify([
    '$.a:1','$.b:2','$.a:-1',
    '$.c:{}','$.c.x:int','$.c.y:4','$.d:5','$.e:$.c','$.e.x:1','$.e.z:7',
    '$.f:8','$.g.h: $.c','$.g.h.x: 9',
    '$.i:10','$.j.k: $.e',
  ])
  //console.log(nodes2)
  //console.dir(reify(nodes2),{depth:null})
  expect(reify(nodes2)).equals({
    '$': {
      a: undefined,
      b: 2,
      c: { x: undefined, y: 4 },
      d: 5,
      e: { x: 1, z: 7, y: 4 },
      f: 8,
      g: { h: { x: 9, y: 4 } },
      i: 10,
      j: { k: { x: undefined, y: 4, z: 7 } }
    }
  })
})
