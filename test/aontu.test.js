/* Copyright (c) 2020 Richard Rodger and other contributors, MIT License */
'use strict'

var Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

var Code = require('@hapi/code')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect



let { Aontu } = require('..')

describe('aontu', function () {

  it('happy', async () => {
    
    expect(Aontu({a:String,b:1},{a:'A',c:2})).equals({a:'A',b:1,c:2})
  })

})
