import Lab from '@hapi/lab'
import Code from '@hapi/code'



var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect



import {
  Lang
} from '../lib/lang'

import {
  Context
} from '../lib/unify'

import {
  MapVal
} from '../lib/val'

import {
  disjunct,
  unite,
} from '../lib/op/op'


let lang = new Lang()
let PL = lang.parse.bind(lang)
let P = (x: string | string[], ctx?: any) =>
  'string' === typeof (x) ? PL(x, ctx) : x.map(s => PL(s, ctx))


describe('op', () => {
  it('happy', () => {
    expect(unite.name).equal('unite')
    expect(disjunct.name).equal('disjunct')
  })

  it('unite-scalar-val', () => {
    let U = makeUnite()

    expect(U('nil nil')).equal('nil')
    // EXPANSION: expect(unite(ctx, P('nil'), P('nil')).canon).equal('nil')

    expect(U('undef nil')).equal('nil')
    // EXPANSION: expect(unite(ctx, undefined, P('nil')).canon).equal('nil')

    expect(U('nil')).equal('nil')
    // EXPANSION: expect(unite(ctx, P('nil')).canon).equal('nil')

    expect(U('')).equal('nil')
    // EXPANSION: expect(unite(ctx).canon).equal('nil')


    expect(U('top          ')).equal('top')
    expect(U('undef  top   ')).equal('top')
    expect(U('top    top   ')).equal('top')
    expect(U('top    1     ')).equal('1')
    expect(U('1      top   ')).equal('1')
    expect(U('top    nil   ')).equal('nil')
    expect(U('nil    top   ')).equal('nil')

    expect(U('1            ')).equal('1')
    expect(U('undef  1     ')).equal('1')
    expect(U('1      1     ')).equal('1')
    expect(U('1      2     ')).equal('nil')
    expect(U('2      1     ')).equal('nil')
    expect(U('1      "a"   ')).equal('nil')
    expect(U('"a"    1     ')).equal('nil')
    expect(U('1      nil   ')).equal('nil')
    expect(U('nil    1     ')).equal('nil')

    expect(U('true         ')).equal('true')
    expect(U('undef  true  ')).equal('true')
    expect(U('true   true  ')).equal('true')
    expect(U('true   2     ')).equal('nil')
    expect(U('2      true  ')).equal('nil')
    expect(U('true  "a"    ')).equal('nil')
    expect(U('"a"    true  ')).equal('nil')
    expect(U('true   false ')).equal('nil')
    expect(U('false  true  ')).equal('nil')
    expect(U('true   nil   ')).equal('nil')
    expect(U('nil    true  ')).equal('nil')

    expect(U('false        ')).equal('false')
    expect(U('undef  false ')).equal('false')
    expect(U('false  false ')).equal('false')
    expect(U('false  2     ')).equal('nil')
    expect(U('2      false ')).equal('nil')
    expect(U('false  "a"   ')).equal('nil')
    expect(U('"a"    false ')).equal('nil')
    expect(U('false  nil   ')).equal('nil')
    expect(U('nil    false ')).equal('nil')

    expect(U('"a"          ')).equal('"a"')
    expect(U('undef  "a"   ')).equal('"a"')
    expect(U('"a"    "a"   ')).equal('"a"')
    expect(U('"a"    "b"   ')).equal('nil')
    expect(U('"b"    "a"   ')).equal('nil')
    expect(U('"a"    nil   ')).equal('nil')
    expect(U('nil    "a"   ')).equal('nil')
  })


  it('unite-scalar-type', () => {
    let U = makeUnite()

    expect(U('number')).equal('number')
    expect(U('number  number')).equal('number')
    expect(U('number  top')).equal('number')
    expect(U('top     number')).equal('number')
    expect(U('number  nil')).equal('nil')
    expect(U('nil     number')).equal('nil')
    expect(U('number  integer')).equal('integer')
    expect(U('integer number')).equal('integer')
    expect(U('number  string')).equal('nil')
    expect(U('string  number')).equal('nil')
    expect(U('number  boolean')).equal('nil')
    expect(U('boolean number')).equal('nil')
    expect(U('number  1')).equal('1')
    expect(U('1       number')).equal('1')
    expect(U('number  1.1')).equal('1.1')
    expect(U('1.1     number')).equal('1.1')
    expect(U('number  "a"')).equal('nil')
    expect(U('"a"     number')).equal('nil')
    expect(U('number  true')).equal('nil')
    expect(U('true    number')).equal('nil')
    expect(U('number  false')).equal('nil')
    expect(U('false   number')).equal('nil')

    expect(U('integer')).equal('integer')
    expect(U('integer  integer')).equal('integer')
    expect(U('integer  top')).equal('integer')
    expect(U('top      integer')).equal('integer')
    expect(U('integer  nil')).equal('nil')
    expect(U('nil      integer')).equal('nil')
    expect(U('integer  string')).equal('nil')
    expect(U('string   integer')).equal('nil')
    expect(U('integer  boolean')).equal('nil')
    expect(U('boolean  integer')).equal('nil')
    expect(U('integer  1')).equal('1')
    expect(U('1        integer')).equal('1')
    expect(U('integer  "a"')).equal('nil')
    expect(U('"a"      integer')).equal('nil')
    expect(U('integer  true')).equal('nil')
    expect(U('true     integer')).equal('nil')
    expect(U('integer  false')).equal('nil')
    expect(U('false    integer')).equal('nil')

    expect(U('string')).equal('string')
    expect(U('string   string')).equal('string')
    expect(U('string   top')).equal('string')
    expect(U('top      string')).equal('string')
    expect(U('string   nil')).equal('nil')
    expect(U('nil      string')).equal('nil')
    expect(U('string   boolean')).equal('nil')
    expect(U('boolean  string')).equal('nil')
    expect(U('string   1')).equal('nil')
    expect(U('1        string')).equal('nil')
    expect(U('string   "a"')).equal('"a"')
    expect(U('"a"      string')).equal('"a"')
    expect(U('string   true')).equal('nil')
    expect(U('true     string')).equal('nil')
    expect(U('string   false')).equal('nil')
    expect(U('false    string')).equal('nil')

    expect(U('boolean')).equal('boolean')
    expect(U('boolean  boolean')).equal('boolean')
    expect(U('boolean  top')).equal('boolean')
    expect(U('top      boolean')).equal('boolean')
    expect(U('boolean  nil')).equal('nil')
    expect(U('nil      boolean')).equal('nil')
    expect(U('boolean  1')).equal('nil')
    expect(U('1        boolean')).equal('nil')
    expect(U('boolean  "a"')).equal('nil')
    expect(U('"a"      boolean')).equal('nil')
    expect(U('boolean  true')).equal('true')
    expect(U('true     boolean')).equal('true')
    expect(U('boolean  false')).equal('false')
    expect(U('false    boolean')).equal('false')
  })

  it('unite-map-scalar', () => {
    let U = makeUnite()

    expect(U('{a:1}')).equal('{"a":1}')
    expect(U('undef  {a:1}')).equal('{"a":1}')
    expect(U('{a:1}  {a:1}')).equal('{"a":1}')
    expect(U('{a:1}  top')).equal('{"a":1}')
    expect(U('top    {a:1}')).equal('{"a":1}')

    expect(U('{a:1}    nil')).equal('nil')
    expect(U('nil      {a:1}')).equal('nil')
    expect(U('{a:1}    1')).equal('nil')
    expect(U('1        {a:1}')).equal('nil')
    expect(U('{a:1}    "b"')).equal('nil')
    expect(U('"b"      {a:1}')).equal('nil')
    expect(U('{a:1}    true')).equal('nil')
    expect(U('true     {a:1}')).equal('nil')
    expect(U('{a:1}    false')).equal('nil')
    expect(U('false    {a:1}')).equal('nil')
    expect(U('{a:1}    number')).equal('nil')
    expect(U('number   {a:1}')).equal('nil')
    expect(U('{a:1}    integer')).equal('nil')
    expect(U('integer  {a:1}')).equal('nil')
    expect(U('{a:1}    string')).equal('nil')
    expect(U('string   {a:1}')).equal('nil')
    expect(U('{a:1}    boolean')).equal('nil')
    expect(U('boolean  {a:1}')).equal('nil')

    expect(U('{a:top}    {a:top}')).equal('{"a":top}')
    expect(U('{a:nil}    {a:nil}')).equal('{"a":nil}')
    expect(U('{a:top}    {a:nil}')).equal('{"a":nil}')
    expect(U('{a:nil}    {a:top}')).equal('{"a":nil}')
    expect(U('{a:1}      {a:nil}')).equal('{"a":nil}')
    expect(U('{a:nil}    {a:1}')).equal('{"a":nil}')
    expect(U('{a:1}      {a:top}')).equal('{"a":1}')
    expect(U('{a:top}    {a:1}')).equal('{"a":1}')
    expect(U('{a:1}      {a:2}')).equal('{"a":nil}')
    expect(U('{a:2}      {a:1}')).equal('{"a":nil}')
    expect(U('{a:1}      {a:true}')).equal('{"a":nil}')
    expect(U('{a:true}   {a:1}')).equal('{"a":nil}')
    expect(U('{a:1}      {a:false}')).equal('{"a":nil}')
    expect(U('{a:false}  {a:1}')).equal('{"a":nil}')

    expect(U('{a:number}   {a:1}')).equal('{"a":1}')
    expect(U('{a:integer}  {a:1}')).equal('{"a":1}')
    expect(U('{a:integer}  {a:1.1}')).equal('{"a":nil}')
    expect(U('{a:string}   {a:1}')).equal('{"a":nil}')
    expect(U('{a:boolean}  {a:1}')).equal('{"a":nil}')
    expect(U('{a:1}        {a:number}')).equal('{"a":1}')
    expect(U('{a:1}        {a:integer}')).equal('{"a":1}')
    expect(U('{a:1.1}      {a:integer}')).equal('{"a":nil}')
    expect(U('{a:1}        {a:string}')).equal('{"a":nil}')
    expect(U('{a:1}        {a:boolean}')).equal('{"a":nil}')

    expect(U('{a:number}   {a:"x"}')).equal('{"a":nil}')
    expect(U('{a:integer}  {a:"x"}')).equal('{"a":nil}')
    expect(U('{a:string}   {a:"x"}')).equal('{"a":"x"}')
    expect(U('{a:boolean}  {a:"x"}')).equal('{"a":nil}')
    expect(U('{a:"x"}      {a:number}')).equal('{"a":nil}')
    expect(U('{a:"x"}      {a:integer}')).equal('{"a":nil}')
    expect(U('{a:"x"}      {a:string}')).equal('{"a":"x"}')
    expect(U('{a:"x"}      {a:boolean}')).equal('{"a":nil}')

    expect(U('{a:true}     {a:number}')).equal('{"a":nil}')
    expect(U('{a:true}     {a:integer}')).equal('{"a":nil}')
    expect(U('{a:true}     {a:string}')).equal('{"a":nil}')
    expect(U('{a:true}     {a:boolean}')).equal('{"a":true}')
    expect(U('{a:number}   {a:true}')).equal('{"a":nil}')
    expect(U('{a:integer}  {a:true}')).equal('{"a":nil}')
    expect(U('{a:string}   {a:true}')).equal('{"a":nil}')
    expect(U('{a:boolean}  {a:true}')).equal('{"a":true}')

    expect(U('{a:number}   {a:false}')).equal('{"a":nil}')
    expect(U('{a:integer}  {a:false}')).equal('{"a":nil}')
    expect(U('{a:string}   {a:false}')).equal('{"a":nil}')
    expect(U('{a:boolean}  {a:false}')).equal('{"a":false}')
    expect(U('{a:false}    {a:number}')).equal('{"a":nil}')
    expect(U('{a:false}    {a:integer}')).equal('{"a":nil}')
    expect(U('{a:false}    {a:string}')).equal('{"a":nil}')
    expect(U('{a:false}    {a:boolean}')).equal('{"a":false}')

    expect(U('{a:1}        {b:2}')).equal('{"a":1,"b":2}')
    expect(U('{b:2}        {a:1}')).equal('{"b":2,"a":1}')
  })


  it('unite-conjunct', () => {
    let U = makeUnite()

    //expect(U('1&1')).equal('1')
    expect(U('1&number')).equal('1')
  })
})


function makeCtx(r?: any) {
  return new Context({ root: r || new MapVal({}) })
}


function makeUnite(r?: any) {
  let ctx = makeCtx(r)
  return (s: string) =>
    unite(ctx,
      ...P(s.trim().split(/\s+/).map(x => 'undef' === x ? undefined : x))).canon
}
