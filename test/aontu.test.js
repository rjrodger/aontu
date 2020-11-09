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
  Node,
  Path,
  unify,
  reify,
  parseVal,
} = require('..')

/*
function rs(x) {
  return x.toString(true).replace(/\s+/g, '').replace(/\n+/g, '')
}
*/

describe('aontu', function () {
  it('happy', async () => {})

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

    let n0u = n0.unify()
    expect(n0u + '').equal('int=1')

    let n1 = new Node('$', ['1', 'int'])
    expect(n1 + '').equal('$: undefined # int=1,int')
    let n1u = n1.unify()
    expect(n1u + '').equal('int=1')

    let n2 = new Node(new Path('$'), 'int,1,int,1')
    expect(n2 + '').equal('$: undefined # int,int=1,int,int=1')
    let n2u = n2.unify()
    expect(n2u + '').equal('int=1')
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
    expect(nodes3.length).equal(2)
    expect(reify(nodes3)).equal({ $: { a: 1, b: { c: 1 } } })
  })
})
