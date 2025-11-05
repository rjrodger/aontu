/* Copyright (c) 2020-2025 Richard Rodger and other contributors, MIT License */


import Fs from 'node:fs'
import { describe, test } from 'node:test'
import { memfs as Memfs } from 'memfs'
import { expect } from '@hapi/code'
import { MapVal } from '../dist/val/MapVal'

import { Lang, util, Aontu, AontuContext } from '../dist/aontu'

type FST = typeof Fs


describe('aontu', function() {

  test('basic-api', async () => {
    let a0 = new Aontu()

    let p0 = a0.parse('a:number')
    expect(p0?.canon).equal('{"a":number}')

    let v0 = a0.unify('a:1')
    expect(v0?.canon).equal('{"a":1}')

    let v0a = a0.unify(v0 as any)
    expect(v0a?.canon).equal('{"a":1}')

    let d0 = a0.generate('a:2')
    expect(d0).equal({ a: 2 })
  })


  test('error-api', async () => {
    let a0 = new Aontu()

    expect(() => a0.parse('a::number')).throws(/unexpected char/)
    expect((a0 as any).parse('a:number a:A').canon).equal('{"a":number&"A"}')

    expect(() => a0.unify('a::1')).throws(/unexpected char/)
    expect(() => a0.unify('a:1 a:2')).throws(/Cannot unify value: 2 with value: 1/)

    expect(() => a0.generate('a::A')).throws(/unexpected char/)
    expect(() => a0.generate('a:A a:B')).throws(/Cannot unify value: "B" with value: "A"/)
  })


  test('happy', async () => {
    let ctx = makeCtx()
    let a0 = new Aontu()

    let v0 = a0.unify('a:1') as any
    expect(v0.canon).equal('{"a":1}')

    expect((a0.unify('a:{b:1},a:{c:2}') as any).canon).equal('{"a":{"b":1,"c":2}}')
    expect((a0.unify('a:b:1,a:c:2') as any).canon).equal('{"a":{"b":1,"c":2}}')

    expect(
      (a0.unify(`
a:{b:1}
a:{c:2}
`) as any).canon
    ).equal('{"a":{"b":1,"c":2}}')

    let p0 = new Lang()

    expect(
      p0.parse(`
u: { x: 1, y: number}
q: a: $.u
w: b: $.q.a & {y:2,z:3}
`).canon
    ).equal(
      '{"u":{"x":1,"y":number},"q":{"a":$.u},"w":{"b":$.q.a&{"y":2,"z":3}}}'
    )

    expect(
      (a0.unify(`
q: a: { x: 1 }
w0: b: $.q.a & {y:2,z:3}
w1: b: {y:2,z:3} & $.q.a
`) as any).gen(ctx)
    ).equal({
      q: { a: { x: 1 } },
      w0: { b: { x: 1, y: 2, z: 3 } },
      w1: { b: { x: 1, y: 2, z: 3 } },
    })

    // TODO: fix in jsonic
    expect((a0.unify('{a:b:1\na:c:2}') as any).canon).equal('{"a":{"b":1,"c":2}}')
  })


  // TODO: create ctx.test.ts
  /*
  test('util', async () => {
    expect(util.options('x')).include({ src: 'x', print: 0 })
    expect(util.options('x', { print: 1 })).include({ src: 'x', print: 1 })
    expect(util.options({ src: 'x' }, { print: 1 })).include({
      src: 'x',
      print: 1,
    })
    expect(
      util.options({ src: 'x', print: 1 }, { src: 'y', print: 2 })
    ).include({ src: 'y', print: 2 })
  })
  */

  test('file', async () => {
    let ctx = makeCtx()
    let a0 = new Aontu()

    let v0 = a0.unify('@"' + __dirname + '/../test/t02.jsonic"') as any

    expect(v0.canon).equal(
      '{"sys":{"ent":{"name":string}},"ent":{"foo":{"name":"foo","fields":{"f0":{"kind":"String"}}},"bar":{"name":"bar","fields":{"f0":{"kind":"Number"}}}}}'
    )

    expect(v0.gen(ctx)).equal({
      // sys: { ent: { name: undefined } },
      ent: {
        foo: {
          name: 'foo',
          fields: {
            f0: {
              kind: 'String',
            },
          },
        },
        bar: {
          name: 'bar',
          fields: {
            f0: {
              kind: 'Number',
            },
          },
        },
      },
    })
  })


  test('pref', async () => {
    let a0 = new Aontu()

    try {
      a0.unify('@"' + __dirname + '/../test/t03.jsonic"', {
        base: __dirname,
      })
    }
    catch (err: any) {
      expect(err.message).include('Cannot unify value: integer|*1 with value: true')
    }
  })


  test('map-spread', () => {
    let a0 = new Aontu()

    let v0 = a0.unify('c:{&:{x:2},y:{k:3},z:{k:4}}') as any
    expect(v0.canon).equal(
      '{"c":{&:{"x":2},"y":{"k":3,"x":2},"z":{"k":4,"x":2}}}'
    )

    let v1 = a0.unify('c:{&:{x:2},z:{k:4}},c:{y:{k:3}}') as any

    expect(v1.canon).equal(
      '{"c":{&:{"x":2},"z":{"k":4,"x":2},"y":{"k":3,"x":2}}}'
    )

    let v10 = a0.unify('a:{&:{x:1}},b:.a,b:{y:{k:2}},c:{&:{x:2}},c:{y:{k:3}}') as any
    expect(v10.canon).equal(
      '{"a":{&:{"x":1}},' +
      '"b":{&:{"x":1},"y":{"k":2,"x":1}},' +
      '"c":{&:{"x":2},"y":{"k":3,"x":2}}}'
    )
  })


  test('empty-and-comments', () => {
    let ctx = makeCtx()
    let a0 = new Aontu()

    expect(a0.unify('').gen(ctx)).equal({})
    expect(a0.unify(undefined as any).gen(ctx)).equal(undefined)

    expect(a0.unify(`
    # comment
    `).gen(ctx)).equal({})
  })


  test('spread-edges', () => {
    let ctx = makeCtx()
    let a0 = new Aontu()

    expect(a0.unify('a:b:{} a:&:{x:1}').gen(ctx)).equal({ a: { b: { x: 1 } } })

    // FIX
    // expect(a0.unify('a:{} &:{x:1}').gen(ctx)).toEqual({ a: { x: 1 } })
  })


  test('key-edges', () => {
    let ctx = makeCtx()
    let a0 = new Aontu()

    expect(a0.unify('a:{k:.$KEY}').gen(ctx)).equal({ a: { k: 'a' } })
    expect(a0.unify('a:b:{k:.$KEY}').gen(ctx)).equal({ a: { b: { k: 'b' } } })

    expect(a0.unify('a:{k:.$KEY} x:1').gen(ctx)).equal({ x: 1, a: { k: 'a' } })
    expect(a0.unify('a:b:{k:.$KEY} x:1').gen(ctx)).equal({ x: 1, a: { b: { k: 'b' } } })

    expect(a0.unify('x:1 a:{k:.$KEY}').gen(ctx)).equal({ x: 1, a: { k: 'a' } })
    expect(a0.unify('x:1 a:b:{k:.$KEY}').gen(ctx)).equal({ x: 1, a: { b: { k: 'b' } } })
  })


  test('practical-path-spread', () => {
    let ctx = makeCtx()
    let a0 = new Aontu()

    let v0 = a0.unify(`
micks: $.def.garage & {

  porsche: {
    color: silver
  }

  ferrari: {
    color: red
  }

  telsa: {
  }
}

def: car: {
  doors: *4 | number
  color: *green | string
}

def: garage: {
  &: $.def.car
}
`)

    expect(v0.gen(ctx)).equal({
      micks: {
        porsche: { doors: 4, color: 'silver' },
        ferrari: { doors: 4, color: 'red' },
        telsa: { doors: 4, color: 'green' }
      },
      def: { car: { doors: 4, color: 'green' }, garage: {} }
    })

  })


  test('virtual-fs', () => {
    let a0 = new Aontu()

    const mfs = Memfs({
      'foo.jsonic': '{f:11}'
    })
    const fs = mfs.fs as unknown as FST
      ; (fs as any).aaa = 1

    /*
    let v0 = a0.unify(`a:@"/foo.jsonic"`, { fs })
    expect(v0.canon).equal(
      '{"a":{"f":11}}'
    )
    */

    let v1 = a0.unify(`a:@"foo.jsonic"`, { fs, path: '/' })
    expect(v1.canon).equal(
      '{"a":{"f":11}}'
    )
  })

})


function makeCtx(r?: any) {
  return new AontuContext({ root: r || new MapVal({ peg: {} }) })
}
