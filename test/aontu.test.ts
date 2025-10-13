/* Copyright (c) 2020-2025 Richard Rodger and other contributors, MIT License */


import Fs from 'node:fs'
import { describe, it } from 'node:test'
import { memfs as Memfs } from 'memfs'
import { expect } from '@hapi/code'

import { Aontu, Lang, util, AontuX } from '../dist/aontu'

type FST = typeof Fs


describe('aontu', function() {

  it('basic-api', async () => {
    let a0 = new AontuX()

    let p0 = a0.parse('a:number')
    expect(p0.canon).equal('{"a":number}')

    let v0 = a0.unify('a:1')
    expect(v0.canon).equal('{"a":1}')

    let v0a = a0.unify(v0)
    expect(v0a.canon).equal('{"a":1}')

    let d0 = a0.generate('a:2')
    expect(d0).equal({ a: 2 })
  })


  it('error-api', async () => {
    let a0 = new AontuX()

    expect(() => a0.parse('a::number')).throws('QQQ')
    expect(a0.parse('a:number a:A').canon).equal('WWW')

    expect(() => a0.unify('a::1')).throws('QQQ')
    expect(() => a0.unify('a:1 a:2')).throws('QQQ')

    expect(() => a0.generate('a::A')).throws('QQQ')
    expect(() => a0.generate('a:A a:B')).throws('QQQ')
  })



  it('happy', async () => {
    let v0 = Aontu('a:1')
    expect(v0.canon).equal('{"a":1}')

    expect(Aontu('a:{b:1},a:{c:2}').canon).equal('{"a":{"b":1,"c":2}}')
    expect(Aontu('a:b:1,a:c:2').canon).equal('{"a":{"b":1,"c":2}}')

    expect(
      Aontu(`
a:{b:1}
a:{c:2}
`).canon
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
      Aontu(`
q: a: { x: 1 }
w0: b: $.q.a & {y:2,z:3}
w1: b: {y:2,z:3} & $.q.a
`).gen()
    ).equal({
      q: { a: { x: 1 } },
      w0: { b: { x: 1, y: 2, z: 3 } },
      w1: { b: { x: 1, y: 2, z: 3 } },
    })

    // TODO: fix in jsonic
    expect(Aontu('{a:b:1\na:c:2}').canon).equal('{"a":{"b":1,"c":2}}')
  })


  it('util', async () => {
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


  it('file', async () => {
    let v0 = Aontu('@"' + __dirname + '/../test/t02.jsonic"')

    expect(v0.canon).equal(
      '{"sys":{"ent":{"name":string}},"ent":{"foo":{"name":"foo","fields":{"f0":{"kind":"string"}}},"bar":{"name":"bar","fields":{"f0":{"kind":"number"}}}}}'
    )

    expect(v0.gen()).equal({
      sys: { ent: { name: undefined } },
      ent: {
        foo: {
          name: 'foo',
          fields: {
            f0: {
              kind: 'string',
            },
          },
        },
        bar: {
          name: 'bar',
          fields: {
            f0: {
              kind: 'number',
            },
          },
        },
      },
    })
  })


  it('pref', async () => {
    try {
      Aontu('@"' + __dirname + '/../test/t03.jsonic"', {
        base: __dirname,
      })
    }
    catch (err: any) {
      expect(err.message).include('Cannot unify value: integer|*1 with value: true')
    }
  })


  it('map-spread', () => {
    let v0 = Aontu('c:{&:{x:2},y:{k:3},z:{k:4}}')
    expect(v0.canon).equal(
      '{"c":{&:{"x":2},"y":{"k":3,"x":2},"z":{"k":4,"x":2}}}'
    )

    let v1 = Aontu('c:{&:{x:2},z:{k:4}},c:{y:{k:3}}')
    expect(v1.canon).equal(
      '{"c":{&:{"x":2},"z":{"k":4,"x":2},"y":{"k":3,"x":2}}}'
    )

    let v10 = Aontu('a:{&:{x:1}},b:.a,b:{y:{k:2}},c:{&:{x:2}},c:{y:{k:3}}')
    expect(v10.canon).equal(
      '{"a":{&:{"x":1}},' +
      '"b":{&:{"x":1},"y":{"k":2,"x":1}},' +
      '"c":{&:{"x":2},"y":{"k":3,"x":2}}}'
    )
  })


  it('empty-and-comments', () => {
    expect(Aontu('').gen()).equal({})
    expect(Aontu().gen()).equal({})

    expect(Aontu(`
    # comment
    `).gen()).equal({})
  })


  it('spread-edges', () => {
    expect(Aontu('a:b:{} a:&:{x:1}').gen()).equal({ a: { b: { x: 1 } } })

    // FIX
    // expect(Aontu('a:{} &:{x:1}').gen()).toEqual({ a: { x: 1 } })
  })


  it('key-edges', () => {
    expect(Aontu('a:{k:.$KEY}').gen()).equal({ a: { k: 'a' } })
    expect(Aontu('a:b:{k:.$KEY}').gen()).equal({ a: { b: { k: 'b' } } })

    expect(Aontu('a:{k:.$KEY} x:1').gen()).equal({ x: 1, a: { k: 'a' } })
    expect(Aontu('a:b:{k:.$KEY} x:1').gen()).equal({ x: 1, a: { b: { k: 'b' } } })

    expect(Aontu('x:1 a:{k:.$KEY}').gen()).equal({ x: 1, a: { k: 'a' } })
    expect(Aontu('x:1 a:b:{k:.$KEY}').gen()).equal({ x: 1, a: { b: { k: 'b' } } })
  })


  it('practical-path-spread', () => {
    let v0 = Aontu(`
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

    expect(v0.gen()).equal({
      micks: {
        porsche: { doors: 4, color: 'silver' },
        ferrari: { doors: 4, color: 'red' },
        telsa: { doors: 4, color: 'green' }
      },
      def: { car: { doors: 4, color: 'green' }, garage: {} }
    })

  })


  it('virtual-fs', () => {
    const mfs = Memfs({
      'foo.jsonic': '{f:11}'
    })
    const fs = mfs.fs as unknown as FST

    let v0 = Aontu(`a:@"/foo.jsonic"`, { fs })
    expect(v0.canon).equal(
      '{"a":{"f":11}}'
    )

    let v1 = Aontu(`a:@"foo.jsonic"`, { fs, path: '/' })
    expect(v1.canon).equal(
      '{"a":{"f":11}}'
    )
  })

})
