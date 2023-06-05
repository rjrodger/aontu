/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */


import {
  Lang
} from '../lib/lang'

import {
  Context
} from '../lib/unify'


import { MapVal } from '../lib/val/MapVal'
import { Nil } from '../lib/val/Nil'

import {
  disjunct,
  unite,
} from '../lib/op/op'



let lang = new Lang()
let PL = lang.parse.bind(lang)
let P = (x: string, ctx?: any) => PL(x, ctx)
let PA = (x: string[], ctx?: any) => x.map(s => PL(s, ctx))

describe('op', () => {
  it('happy', () => {
    expect(unite.name).toEqual('unite')
    expect(disjunct.name).toEqual('disjunct')
  })

  it('unite-scalar-val', () => {
    let U = makeUnite()

    expect(U('nil nil')).toEqual('nil')
    // EXPANSION: expect(unite(ctx, P('nil'), P('nil')).canon).toEqual('nil')

    expect(U('undef nil')).toEqual('nil')
    // EXPANSION: expect(unite(ctx, undefined, P('nil')).canon).toEqual('nil')

    expect(U('nil')).toEqual('nil')
    // EXPANSION: expect(unite(ctx, P('nil')).canon).toEqual('nil')

    expect(U('')).toEqual('nil')
    // EXPANSION: expect(unite(ctx).canon).toEqual('nil')

    expect(U('top          ')).toEqual('top')
    expect(U('undef  top   ')).toEqual('top')
    expect(U('top    top   ')).toEqual('top')
    expect(U('top    1     ')).toEqual('1')
    expect(U('1      top   ')).toEqual('1')
    expect(U('top    nil   ')).toEqual('nil')
    expect(U('nil    top   ')).toEqual('nil')

    expect(U('1            ')).toEqual('1')
    expect(U('undef  1     ')).toEqual('1')
    expect(U('1      1     ')).toEqual('1')
    expect(U('1      2     ')).toEqual('nil')
    expect(U('2      1     ')).toEqual('nil')
    expect(U('1      "a"   ')).toEqual('nil')
    expect(U('"a"    1     ')).toEqual('nil')
    expect(U('1      nil   ')).toEqual('nil')
    expect(U('nil    1     ')).toEqual('nil')

    expect(U('true         ')).toEqual('true')
    expect(U('undef  true  ')).toEqual('true')
    expect(U('true   true  ')).toEqual('true')
    expect(U('true   2     ')).toEqual('nil')
    expect(U('2      true  ')).toEqual('nil')
    expect(U('true  "a"    ')).toEqual('nil')
    expect(U('"a"    true  ')).toEqual('nil')
    expect(U('true   false ')).toEqual('nil')
    expect(U('false  true  ')).toEqual('nil')
    expect(U('true   nil   ')).toEqual('nil')
    expect(U('nil    true  ')).toEqual('nil')

    expect(U('false        ')).toEqual('false')
    expect(U('undef  false ')).toEqual('false')
    expect(U('false  false ')).toEqual('false')
    expect(U('false  2     ')).toEqual('nil')
    expect(U('2      false ')).toEqual('nil')
    expect(U('false  "a"   ')).toEqual('nil')
    expect(U('"a"    false ')).toEqual('nil')
    expect(U('false  nil   ')).toEqual('nil')
    expect(U('nil    false ')).toEqual('nil')

    expect(U('"a"          ')).toEqual('"a"')
    expect(U('undef  "a"   ')).toEqual('"a"')
    expect(U('"a"    "a"   ')).toEqual('"a"')
    expect(U('"a"    "b"   ')).toEqual('nil')
    expect(U('"b"    "a"   ')).toEqual('nil')
    expect(U('"a"    nil   ')).toEqual('nil')
    expect(U('nil    "a"   ')).toEqual('nil')
  })


  it('unite-scalar-type', () => {
    let U = makeUnite()

    expect(U('number')).toEqual('number')
    expect(U('number  number')).toEqual('number')
    expect(U('number  top')).toEqual('number')
    expect(U('top     number')).toEqual('number')
    expect(U('number  nil')).toEqual('nil')
    expect(U('nil     number')).toEqual('nil')
    expect(U('number  integer')).toEqual('integer')
    expect(U('integer number')).toEqual('integer')
    expect(U('number  string')).toEqual('nil')
    expect(U('string  number')).toEqual('nil')
    expect(U('number  boolean')).toEqual('nil')
    expect(U('boolean number')).toEqual('nil')
    expect(U('number  1')).toEqual('1')
    expect(U('1       number')).toEqual('1')
    expect(U('number  1.1')).toEqual('1.1')
    expect(U('1.1     number')).toEqual('1.1')
    expect(U('number  "a"')).toEqual('nil')
    expect(U('"a"     number')).toEqual('nil')
    expect(U('number  true')).toEqual('nil')
    expect(U('true    number')).toEqual('nil')
    expect(U('number  false')).toEqual('nil')
    expect(U('false   number')).toEqual('nil')

    expect(U('integer')).toEqual('integer')
    expect(U('integer  integer')).toEqual('integer')
    expect(U('integer  top')).toEqual('integer')
    expect(U('top      integer')).toEqual('integer')
    expect(U('integer  nil')).toEqual('nil')
    expect(U('nil      integer')).toEqual('nil')
    expect(U('integer  string')).toEqual('nil')
    expect(U('string   integer')).toEqual('nil')
    expect(U('integer  boolean')).toEqual('nil')
    expect(U('boolean  integer')).toEqual('nil')
    expect(U('integer  1')).toEqual('1')
    expect(U('1        integer')).toEqual('1')
    expect(U('integer  "a"')).toEqual('nil')
    expect(U('"a"      integer')).toEqual('nil')
    expect(U('integer  true')).toEqual('nil')
    expect(U('true     integer')).toEqual('nil')
    expect(U('integer  false')).toEqual('nil')
    expect(U('false    integer')).toEqual('nil')

    expect(U('string')).toEqual('string')
    expect(U('string   string')).toEqual('string')
    expect(U('string   top')).toEqual('string')
    expect(U('top      string')).toEqual('string')
    expect(U('string   nil')).toEqual('nil')
    expect(U('nil      string')).toEqual('nil')
    expect(U('string   boolean')).toEqual('nil')
    expect(U('boolean  string')).toEqual('nil')
    expect(U('string   1')).toEqual('nil')
    expect(U('1        string')).toEqual('nil')
    expect(U('string   "a"')).toEqual('"a"')
    expect(U('"a"      string')).toEqual('"a"')
    expect(U('string   true')).toEqual('nil')
    expect(U('true     string')).toEqual('nil')
    expect(U('string   false')).toEqual('nil')
    expect(U('false    string')).toEqual('nil')

    expect(U('boolean')).toEqual('boolean')
    expect(U('boolean  boolean')).toEqual('boolean')
    expect(U('boolean  top')).toEqual('boolean')
    expect(U('top      boolean')).toEqual('boolean')
    expect(U('boolean  nil')).toEqual('nil')
    expect(U('nil      boolean')).toEqual('nil')
    expect(U('boolean  1')).toEqual('nil')
    expect(U('1        boolean')).toEqual('nil')
    expect(U('boolean  "a"')).toEqual('nil')
    expect(U('"a"      boolean')).toEqual('nil')
    expect(U('boolean  true')).toEqual('true')
    expect(U('true     boolean')).toEqual('true')
    expect(U('boolean  false')).toEqual('false')
    expect(U('false    boolean')).toEqual('false')
  })

  it('unite-map-scalar', () => {
    let U = makeUnite()

    expect(U('{a:1}')).toEqual('{"a":1}')
    expect(U('undef  {a:1}')).toEqual('{"a":1}')
    expect(U('{a:1}  {a:1}')).toEqual('{"a":1}')
    expect(U('{a:1}  top')).toEqual('{"a":1}')
    expect(U('top    {a:1}')).toEqual('{"a":1}')

    expect(U('{a:1}    nil')).toEqual('nil')
    expect(U('nil      {a:1}')).toEqual('nil')
    expect(U('{a:1}    1')).toEqual('nil')
    expect(U('1        {a:1}')).toEqual('nil')
    expect(U('{a:1}    "b"')).toEqual('nil')
    expect(U('"b"      {a:1}')).toEqual('nil')
    expect(U('{a:1}    true')).toEqual('nil')
    expect(U('true     {a:1}')).toEqual('nil')
    expect(U('{a:1}    false')).toEqual('nil')
    expect(U('false    {a:1}')).toEqual('nil')
    expect(U('{a:1}    number')).toEqual('nil')
    expect(U('number   {a:1}')).toEqual('nil')
    expect(U('{a:1}    integer')).toEqual('nil')
    expect(U('integer  {a:1}')).toEqual('nil')
    expect(U('{a:1}    string')).toEqual('nil')
    expect(U('string   {a:1}')).toEqual('nil')
    expect(U('{a:1}    boolean')).toEqual('nil')
    expect(U('boolean  {a:1}')).toEqual('nil')

    expect(U('{a:top}    {a:top}')).toEqual('{"a":top}')
    expect(U('{a:nil}    {a:nil}')).toEqual('{"a":nil}')
    expect(U('{a:top}    {a:nil}')).toEqual('{"a":nil}')
    expect(U('{a:nil}    {a:top}')).toEqual('{"a":nil}')
    expect(U('{a:1}      {a:nil}')).toEqual('{"a":nil}')
    expect(U('{a:nil}    {a:1}')).toEqual('{"a":nil}')
    expect(U('{a:1}      {a:top}')).toEqual('{"a":1}')
    expect(U('{a:top}    {a:1}')).toEqual('{"a":1}')
    expect(U('{a:1}      {a:2}')).toEqual('{"a":nil}')
    expect(U('{a:2}      {a:1}')).toEqual('{"a":nil}')
    expect(U('{a:1}      {a:true}')).toEqual('{"a":nil}')
    expect(U('{a:true}   {a:1}')).toEqual('{"a":nil}')
    expect(U('{a:1}      {a:false}')).toEqual('{"a":nil}')
    expect(U('{a:false}  {a:1}')).toEqual('{"a":nil}')

    expect(U('{a:number}   {a:1}')).toEqual('{"a":1}')
    expect(U('{a:integer}  {a:1}')).toEqual('{"a":1}')
    expect(U('{a:integer}  {a:1.1}')).toEqual('{"a":nil}')
    expect(U('{a:string}   {a:1}')).toEqual('{"a":nil}')
    expect(U('{a:boolean}  {a:1}')).toEqual('{"a":nil}')
    expect(U('{a:1}        {a:number}')).toEqual('{"a":1}')
    expect(U('{a:1}        {a:integer}')).toEqual('{"a":1}')
    expect(U('{a:1.1}      {a:integer}')).toEqual('{"a":nil}')
    expect(U('{a:1}        {a:string}')).toEqual('{"a":nil}')
    expect(U('{a:1}        {a:boolean}')).toEqual('{"a":nil}')

    expect(U('{a:number}   {a:"x"}')).toEqual('{"a":nil}')
    expect(U('{a:integer}  {a:"x"}')).toEqual('{"a":nil}')
    expect(U('{a:string}   {a:"x"}')).toEqual('{"a":"x"}')
    expect(U('{a:boolean}  {a:"x"}')).toEqual('{"a":nil}')
    expect(U('{a:"x"}      {a:number}')).toEqual('{"a":nil}')
    expect(U('{a:"x"}      {a:integer}')).toEqual('{"a":nil}')
    expect(U('{a:"x"}      {a:string}')).toEqual('{"a":"x"}')
    expect(U('{a:"x"}      {a:boolean}')).toEqual('{"a":nil}')

    expect(U('{a:true}     {a:number}')).toEqual('{"a":nil}')
    expect(U('{a:true}     {a:integer}')).toEqual('{"a":nil}')
    expect(U('{a:true}     {a:string}')).toEqual('{"a":nil}')
    expect(U('{a:true}     {a:boolean}')).toEqual('{"a":true}')
    expect(U('{a:number}   {a:true}')).toEqual('{"a":nil}')
    expect(U('{a:integer}  {a:true}')).toEqual('{"a":nil}')
    expect(U('{a:string}   {a:true}')).toEqual('{"a":nil}')
    expect(U('{a:boolean}  {a:true}')).toEqual('{"a":true}')

    expect(U('{a:number}   {a:false}')).toEqual('{"a":nil}')
    expect(U('{a:integer}  {a:false}')).toEqual('{"a":nil}')
    expect(U('{a:string}   {a:false}')).toEqual('{"a":nil}')
    expect(U('{a:boolean}  {a:false}')).toEqual('{"a":false}')
    expect(U('{a:false}    {a:number}')).toEqual('{"a":nil}')
    expect(U('{a:false}    {a:integer}')).toEqual('{"a":nil}')
    expect(U('{a:false}    {a:string}')).toEqual('{"a":nil}')
    expect(U('{a:false}    {a:boolean}')).toEqual('{"a":false}')

    expect(U('{a:1}        {b:2}')).toEqual('{"a":1,"b":2}')
    expect(U('{b:2}        {a:1}')).toEqual('{"b":2,"a":1}')
  })


  it('unite-conjunct', () => {
    let U = makeUnite()

    //expect(U('1&1')).toEqual('1')
    expect(U('1&number')).toEqual('1')
  })
})


function makeCtx(r?: any) {
  return new Context({ root: r || new MapVal({ peg: {} }) })
}



function makeUnite(r?: any) {
  let ctx = makeCtx(r)
  return (s: string) => {
    let terms: any[] = s.trim().split(/\s+/).map(x => 'undef' === x ? undefined : x)
    return unite(ctx, ...PA(terms)).canon
  }
}

