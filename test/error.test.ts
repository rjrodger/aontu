/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */



let { Aontu, util } = require('..')

// import { Resolver } from '@jsonic/multisource'

import type { Val, Options } from '../lib/type'
import { Lang } from '../lib/lang'
import { Unify } from '../lib/unify'

import { MapVal } from '../lib/val/MapVal'
import { Nil } from '../lib/val/Nil'


// let { makeFileResolver } = require('@jsonic/multisource')

describe('error', function() {

  it('syntax', () => {
    let v0 = Aontu('a::1')
    // console.dir(v0.err, { depth: null })
    expect(v0.err[0]).toMatchObject({ nil: true, why: 'syntax' })
    expect(typeof v0.err[0].msg).toEqual('string')
  })

  it('unify', () => {
    let v0 = Aontu('a:1,a:2')
    // console.dir(v0.err, {depth:null})
    expect(v0.err[0]).toMatchObject({ nil: true, why: 'scalar' })
    expect(typeof v0.err[0].msg).toEqual('string')
  })


  // it('file-e01', async () => {
  //   /*
  //   let v0 = Aontu('@"' + __dirname + '/error/e01.jsonic"', {
  //     resolver: makeFileResolver(),
  //   })

  //   console.log(v0)
  //   */

  //   let opts = {
  //     src: '@"' + __dirname + '/error/e01.jsonic"',
  //     // resolver: makeFileResolver(),
  //   }
  //   let lang = new Lang(opts)
  //   let deps = {}
  //   let val = lang.parse(opts.src, { deps: deps })
  //   // console.log('INITIAL', val.canon)
  //   // console.dir(val, { depth: null })

  //   let uni = new Unify((val as unknown as Val))
  //   //let res = uni.res

  //   // console.log('UNIFIED', uni.res.canon)
  //   // console.dir(uni.res, { depth: null })
  //   // console.dir(uni.err, { depth: null })
  // })

})
