/* Copyright (c) 2020 Richard Rodger and other contributors, MIT License */
'use strict'

var Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

var Code = require('@hapi/code')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect

let { Aontu, util } = require('..')

let { FileResolver } = require('@jsonic/multisource/resolver/file')

describe('aontu', function () {
  it('happy', async () => {
    let v0 = Aontu('a:1')
    expect(v0.canon).equals('{"a":1}')
  })

  it('util', async () => {
    expect(util.options('x')).contains({ src: 'x', print: 0 })
    expect(util.options('x', { print: 1 })).contains({ src: 'x', print: 1 })
    expect(util.options({ src: 'x' }, { print: 1 })).contains({
      src: 'x',
      print: 1,
    })
    expect(
      util.options({ src: 'x', print: 1 }, { src: 'y', print: 2 })
    ).contains({ src: 'y', print: 2 })
  })

  it('file', async () => {
    let v0 = Aontu('@"' + __dirname + '/t02.jsonic"', {
      resolver: FileResolver,
    })
    //console.log(v0.canon)
    expect(v0.canon).equal(
      '{"sys":{"ent":{"name":string}},"ent":{"foo":{"name":"foo","fields":{"f0":{"kind":"string"}}},"bar":{"name":"bar","fields":{"f0":{"kind":"number"}}}}}'
    )
    expect(v0.gen([])).equal({
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
    let v0 = Aontu('@"' + __dirname + '/t03.jsonic"', {
      resolver: FileResolver,
    })

    //console.log(v0.canon)
    //console.dir(v0.gen([]),{depth:null})

    expect(v0.canon).equal(
      '{"uxc":{"name":string,"size":integer|*1},"foo":{"name":string,"size":integer|*1},"bar":{"name":"bar","size":integer|*1},"zed":{"name":"zed","size":2},"qaz":{"name":"bar","size":nil:|:empty}}'
    )
    expect(v0.gen([])).equal({
      uxc: { name: undefined, size: 1 },
      foo: { name: undefined, size: 1 },
      bar: { name: 'bar', size: 1 },
      zed: { name: 'zed', size: 2 },
      qaz: { name: 'bar', size: undefined },
    })
  })
})
