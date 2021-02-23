/* Copyright (c) 2020 Richard Rodger and other contributors, MIT License */
'use strict'

var Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

var Code = require('@hapi/code')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect

let { Aontu, unify, evaluate, DefaultVal } = require('..')

describe('aontu', function () {
  it('happy', async () => {
    expect(
      unify({ a: String, b: Number, x: 10 }, { a: 'A', b: 1, y: 20 })
    ).equals({ a: 'A', b: 1, x: 10, y: 20 })

    expect(
      unify(
        { a: String, b: Number, c: { d: String }, e: { f: Number }, x: 10 },
        { a: 'A', b: 1, c: { d: 'D' }, y: 20 }
      )
    ).equals({ a: 'A', b: 1, c: { d: 'D' }, e: { f: Number }, x: 10, y: 20 })

    expect(evaluate({ a: 1 })).equal({ a: 1 })
    expect(evaluate({ a: new DefaultVal(String, 'A') })).equal({ a: 'A' })
    expect(evaluate({ a: 1, b: { c: 2 } })).equal({ a: 1, b: { c: 2 } })
    expect(
      evaluate({ a: 1, b: { c: 2, d: new DefaultVal(Number, 3) } })
    ).equal({ a: 1, b: { c: 2, d: 3 } })
  })

  it('defaults', async () => {
    let dvB = new DefaultVal(String, 'B')
    let dvC = new DefaultVal(Number, 1)
    let dvD = new DefaultVal(String, 'D')

    expect(
      unify(
        {
          a: new DefaultVal(String, 'A'),
          b: dvB,
          c: 1,
          d: dvD,
        },
        {
          a: 'AA',
          c: dvC,
          d: String,
        }
      )
    ).equals({
      a: 'AA',
      b: dvB,
      c: 1,
      d: dvD, // default val is more specific
    })

    expect(
      Aontu(
        {
          a: new DefaultVal(String, 'A'),
          b: dvB,
          c: 1,
          d: dvD,
        },
        {
          a: 'AA',
          c: dvC,
          d: String,
        }
      )
    ).equals({
      a: 'AA',
      b: 'B',
      c: 1,
      d: 'D',
    })
  })

  it('metapeer', async () => {
    expect(
      unify(
        meta(
          {
            a: 1,
            b: 'B',
          },
          {
            peers: [
              {
                a: Number,
                c: 2,
              },
              {
                d: new DefaultVal(String, 'D'),
              },
            ],
          }
        )
      )
    ).equals({
      a: 1,
      b: 'B',
      c: 2,
      d: 'D',
    })
  })

  it('childpeer', async () => {
    expect(
      unify(
        meta(
          {
            a: {
              x: 1,
            },
            b: {
              x: 2,
            },
          },
          {
            children: [
              {
                x: Number,
                y: 3,
              },
              {
                d: new DefaultVal(String, 'D'),
              },
            ],
          }
        )
      )
    ).equals({
      a: { x: 1, y: 3, d: 'D' },
      b: { x: 2, y: 3, d: 'D' },
    })
  })

  it('peers', async () => {
    expect(
      unify(
        meta(
          {
            a: {
              x: 1,
            },
            b: {
              x: 2,
            },
          },
          {
            peers: [
              {
                c: {
                  x: 3,
                },
                d: {
                  x: 4,
                },
              },
            ],
            children: [
              {
                x: Number,
                y: 3,
              },
              {
                d: new DefaultVal(String, 'D'),
              },
            ],
          }
        )
      )
    ).equals({
      a: { x: 1, y: 3, d: 'D' },
      b: { x: 2, y: 3, d: 'D' },
      c: { x: 3, y: 3, d: 'D' },
      d: { x: 4, y: 3, d: 'D' },
    })
  })
})

function meta(o, m) {
  Object.defineProperty(o, '$', { value: m })
  return o
}
