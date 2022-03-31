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

// import { Resolver } from '@jsonic/multisource'

import { Options } from '../lib/common'
import { Lang } from '../lib/lang'
import { Unify } from '../lib/unify'
import { Val, Nil } from '../lib/val'

// let { makeFileResolver } = require('@jsonic/multisource')

describe('error', function() {

  it('file-e01', async () => {
    /*
    let v0 = Aontu('@"' + __dirname + '/error/e01.jsonic"', {
      resolver: makeFileResolver(),
    })

    console.log(v0)
    */

    let opts = {
      src: '@"' + __dirname + '/error/e01.jsonic"',
      // resolver: makeFileResolver(),
    }
    let lang = new Lang(opts)
    let deps = {}
    let val = lang.parse(opts.src, { deps: deps })
    // console.log('INITIAL', val.canon)
    // console.dir(val, { depth: null })

    let uni = new Unify((val as unknown as Val))
    //let res = uni.res

    // console.log('UNIFIED', uni.res.canon)
    // console.dir(uni.res, { depth: null })
    // console.dir(uni.err, { depth: null })
  })

})
