/* Copyright (c) 2020-2025 Richard Rodger and other contributors, MIT License */

import { describe, test } from 'node:test'

import {
  AontuContext,
} from '../dist/ctx'

import { Aontu } from '../dist/aontu'


import { expect } from './expect'
import { MapVal } from '../dist/val/MapVal'
import { PrefVal } from '../dist/val/PrefVal'
import { NumberVal } from '../dist/val/NumberVal'
import { StringVal } from '../dist/val/StringVal'
import { BooleanVal } from '../dist/val/BooleanVal'
import { NullVal } from '../dist/val/NullVal'


describe('val-pref', function() {

  test('construct', () => {
    let r0 = new PrefVal({ peg: new NumberVal({ peg: 1 }) })
    expect(r0.canon).equal('*1.0')
    expect(r0.rank).equal(0)

    let r1 = new PrefVal({ peg: new StringVal({ peg: 'a' }) })
    expect(r1.canon).equal('*"a"')
    expect(r1.rank).equal(0)

    let r2 = new PrefVal({
      peg: new PrefVal({ peg: new BooleanVal({ peg: false }) })
    })
    expect(r2.canon).equal('**false')
    expect(r2.rank).equal(1)

    let r3 = new PrefVal({
      peg:
        new PrefVal({
          peg: new PrefVal({ peg: new NullVal({ peg: null }) })
        })
    })
    expect(r3.canon).equal('***null')
    expect(r3.rank).equal(2)

  })


  test('conjunct', () => {
    let a0 = new Aontu()
    let G = a0.generate.bind(a0)

    expect(G('*1&2')).equal(2)
    expect(G('(*1)&3')).equal(3)
    expect(G('*1&(4)')).equal(4)
    expect(G('(*1&5)')).equal(5)
    expect(G('((*1)&6)')).equal(6)
    expect(G('((*1)&(7))')).equal(7)
    expect(G('(((*1)&(8)))')).equal(8)

    expect(G('12&*1')).equal(12)
    expect(G('13&(*1)')).equal(13)
    expect(G('(14)&*1')).equal(14)
    expect(G('(15&*1)')).equal(15)
    expect(G('(16&(*1))')).equal(16)
    expect(G('((17)&(*1))')).equal(17)
    expect(G('(((18)&(*1)))')).equal(18)


    expect(() => G('21 & *1 & *2')).throws(/Cannot unify/)
    expect(() => G('*1 & 22 & *2')).throws(/Cannot unify/)
    expect(() => G('*1 & *2 & 23')).throws(/Cannot unify/)

    expect(() => G('24 & **1 & **2')).throws(/Cannot unify/)
    expect(() => G('**1 & 25 & **2')).throws(/Cannot unify/)
    expect(() => G('**1 & **2 & 26')).throws(/Cannot unify/)

    expect(() => G('(21) & *1 & *2')).throws(/Cannot unify/)
    expect(() => G('(21 & *1) & *2')).throws(/Cannot unify/)
    expect(() => G('(21 & *1 & *2)')).throws(/Cannot unify/)
    expect(() => G('21 & (*1 & *2)')).throws(/Cannot unify/)
    expect(() => G('21 & *1 & (*2)')).throws(/Cannot unify/)

    expect(() => G('((21) & *1 & *2)')).throws(/Cannot unify/)
    expect(() => G('((21 & *1) & *2)')).throws(/Cannot unify/)
    expect(() => G('((21 & *1 & *2))')).throws(/Cannot unify/)
    expect(() => G('(21 & (*1 & *2))')).throws(/Cannot unify/)
    expect(() => G('(21 & *1 & (*2))')).throws(/Cannot unify/)


    expect(G('31 & *1 & **2')).equal(31)
    expect(G('*1 & 32 & **2')).equal(32)
    expect(G('*1 & **2 & 33')).equal(33)

    expect(G('34&*1&**2&***3')).equal(34)
  })


  test('func', () => {
    let a0 = new Aontu()
    let G = a0.generate.bind(a0)

    // `lower` answers a FLOAT (`lower(1.1)` is `1.0`), so a float peer
    // overrides and an integer one conflicts: the numeric leaves are
    // disjoint kinds and the gate is the preferred value's own kind.
    expect(G('*lower(1.1)&2.5')).equal(2.5)
    expect(() => G('*lower(1.1)&2')).throws(/Cannot unify/)
    expect(() => G('*lower(1.1)&a')).throws(/Cannot unify/)
  })


  test('numeric-leaf-override', () => {
    let a0 = new Aontu()
    let G = a0.generate.bind(a0)

    // A preference is a DEFAULT, and a concrete peer OF THE SAME KIND
    // overrides it. That is the whole point: plain `1 & 2` is a
    // conflict, and `*1 & 2` is 2.
    expect(G('x:*1 & 2')).equal({ x: 2 })
    expect(G('x:*1.5 & 2.5')).equal({ x: 2.5 })

    expect(() => G('x:*1.0 & 2')).throws(/Cannot unify/)
    expect(() => G('x:*1 & 2.0')).throws(/Cannot unify/)
    expect(() => G('x:*1 & 2.5')).throws(/Cannot unify/)

    // A peer of another kind is still a conflict, not an override.
    expect(() => G('x:*1 & a')).throws(/Cannot unify/)
    expect(() => G('x:*1.5 & true')).throws(/Cannot unify/)
    expect(() => G('x:*a & 1')).throws(/Cannot unify/)

    // A peer that only restates a kind the preferred value already
    // satisfies leaves the preference standing.
    expect(G('x:*1 & integer')).equal({ x: 1 })
    expect(G('x:*1 & number')).equal({ x: 1 })
    expect(G('x:*1.5 & float')).equal({ x: 1.5 })
    expect(G('x:*1.5 & number')).equal({ x: 1.5 })

    expect(() => G('x:*1 & float')).throws(/Cannot unify/)
    expect(() => G('x:*1.5 & integer')).throws(/Cannot unify/)

    expect(G('x:*integer & 7')).equal({ x: 7 })
    expect(() => G('x:*integer & a')).throws(/Cannot unify/)

    expect(G('x:*float & 1')).equal({ x: 1 })
  })


})


function makeCtx(r?: any, p?: string[]) {
  return new AontuContext({
    root: r || new MapVal({ peg: {} }),
    // path: p
  })
}
