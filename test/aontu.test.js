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
    expect(Aontu(
      {a:String,b:Number,x:10},
      {a:'A',b:1,y:20}
    )).equals({a:'A',b:1,x:10,y:20})

    expect(Aontu(
      {a:String,b:Number,c:{d:String},e:{f:Number},x:10},
      {a:'A',b:1,c:{d:'D'},y:20}
    )).equals({a:'A',b:1,c:{d:'D'},e:{f:Number},x:10,y:20})

  })

})
