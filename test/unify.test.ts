

import { describe, test } from 'node:test'

import { expect } from '@hapi/code'



import {
  Unify,
} from '../dist/unify'


import {
  Lang
} from '../dist/lang'

import {
  Aontu
} from '..'






let lang = new Lang()


const N = (x: string, _ctx?: any) => new Unify(x, lang).res.canon
// const G = (x: string, ctx?: any) => new Unify(x, lang)
//  .res.gen(ctx || new Context({ root: new MapVal({ peg: {} }) }))

const A = new Aontu()
const G = (s: string) => A.generate(s)


describe('unify', function() {

  test('condis-same', () => {
    expect(G('a')).equal('a')
    expect(G('a&a')).equal('a')
    expect(G('a|a')).equal('a')

    expect(G('(a)')).equal('a')

    expect(G('(a&a)')).equal('a')

    expect(G('(a|a)')).equal('a')


    expect(G('(a)&a')).equal('a')
    expect(G('(a&a)&a')).equal('a')

    expect(G('(a|a)&a')).equal('a')

    expect(G('a&(a)')).equal('a')
    expect(G('a&(a&a)')).equal('a')
    expect(G('a&(a|a)')).equal('a')

    expect(G('a&(a)&a')).equal('a')
    expect(G('a&(a&a)&a')).equal('a')
    expect(G('a&(a|a)&a')).equal('a')

    expect(G('a&a')).equal('a')
    expect(G('a&a&a')).equal('a')
    expect(G('a|a&a')).equal('a')

    expect(G('a&a|a')).equal('a')

    expect(G('a&a&a&a')).equal('a')
    expect(G('a&a|a&a')).equal('a')

    expect(G('(a)|a')).equal('a')
    expect(G('(a&a)|a')).equal('a')
    expect(G('(a|a)|a')).equal('a')

    expect(G('a|(a)')).equal('a')
    expect(G('a|(a&a)')).equal('a')
    expect(G('a|(a|a)')).equal('a')

    expect(G('a|(a)|a')).equal('a')
    expect(G('a|(a&a)|a')).equal('a')
    expect(G('a|(a|a)|a')).equal('a')

    expect(G('a|a')).equal('a')
    expect(G('a&a|a')).equal('a')
    expect(G('a|a|a')).equal('a')

    expect(G('a|a&a')).equal('a')

    expect(G('a|a|a|a')).equal('a')
    expect(G('a|a&a|a')).equal('a')


    expect(G('x:a')).equal({ x: 'a' })
    expect(G('x:a&a')).equal({ x: 'a' })
    expect(G('x:a|a')).equal({ x: 'a' })

    expect(G('x:(a)')).equal({ x: 'a' })
    expect(G('x:(a&a)')).equal({ x: 'a' })
    expect(G('x:(a|a)')).equal({ x: 'a' })

    expect(G('x:(a)&a')).equal({ x: 'a' })
    expect(G('x:(a&a)&a')).equal({ x: 'a' })
    expect(G('x:(a|a)&a')).equal({ x: 'a' })

    expect(G('x:a&(a)')).equal({ x: 'a' })
    expect(G('x:a&(a&a)')).equal({ x: 'a' })
    expect(G('x:a&(a|a)')).equal({ x: 'a' })

    expect(G('x:a&(a)&a')).equal({ x: 'a' })
    expect(G('x:a&(a&a)&a')).equal({ x: 'a' })
    expect(G('x:a&(a|a)&a')).equal({ x: 'a' })

    expect(G('x:a&a')).equal({ x: 'a' })
    expect(G('x:a&a&a')).equal({ x: 'a' })
    expect(G('x:a|a&a')).equal({ x: 'a' })

    expect(G('x:a&a|a')).equal({ x: 'a' })

    expect(G('x:a&a&a&a')).equal({ x: 'a' })
    expect(G('x:a&a|a&a')).equal({ x: 'a' })

    expect(G('x:(a)|a')).equal({ x: 'a' })
    expect(G('x:(a&a)|a')).equal({ x: 'a' })
    expect(G('x:(a|a)|a')).equal({ x: 'a' })

    expect(G('x:a|(a)')).equal({ x: 'a' })
    expect(G('x:a|(a&a)')).equal({ x: 'a' })
    expect(G('x:a|(a|a)')).equal({ x: 'a' })

    expect(G('x:a|(a)|a')).equal({ x: 'a' })
    expect(G('x:a|(a&a)|a')).equal({ x: 'a' })
    expect(G('x:a|(a|a)|a')).equal({ x: 'a' })

    expect(G('x:a|a')).equal({ x: 'a' })
    expect(G('x:a&a|a')).equal({ x: 'a' })
    expect(G('x:a|a|a')).equal({ x: 'a' })

    expect(G('x:a|a&a')).equal({ x: 'a' })

    expect(G('x:a|a|a|a')).equal({ x: 'a' })
    expect(G('x:a|a&a|a')).equal({ x: 'a' })


    expect(G('[a]')).equal(['a'])
    expect(G('[a&a]')).equal(['a'])
    expect(G('[a|a]')).equal(['a'])

    expect(G('[(a)]')).equal(['a'])
    expect(G('[(a&a)]')).equal(['a'])
    expect(G('[(a|a)]')).equal(['a'])

    expect(G('[(a)&a]')).equal(['a'])
    expect(G('[(a&a)&a]')).equal(['a'])
    expect(G('[(a|a)&a]')).equal(['a'])

    expect(G('[a&(a)]')).equal(['a'])
    expect(G('[a&(a&a)]')).equal(['a'])
    expect(G('[a&(a|a)]')).equal(['a'])

    expect(G('[a&(a)&a]')).equal(['a'])
    expect(G('[a&(a&a)&a]')).equal(['a'])
    expect(G('[a&(a|a)&a]')).equal(['a'])

    expect(G('[a&a]')).equal(['a'])
    expect(G('[a&a&a]')).equal(['a'])
    expect(G('[a|a&a]')).equal(['a'])

    expect(G('[a&a|a]')).equal(['a'])

    expect(G('[a&a&a&a]')).equal(['a'])
    expect(G('[a&a|a&a]')).equal(['a'])

    expect(G('[(a)|a]')).equal(['a'])
    expect(G('[(a&a)|a]')).equal(['a'])
    expect(G('[(a|a)|a]')).equal(['a'])

    expect(G('[a|(a)]')).equal(['a'])
    expect(G('[a|(a&a)]')).equal(['a'])
    expect(G('[a|(a|a)]')).equal(['a'])

    expect(G('[a|(a)|a]')).equal(['a'])
    expect(G('[a|(a&a)|a]')).equal(['a'])
    expect(G('[a|(a|a)|a]')).equal(['a'])

    expect(G('[a|a]')).equal(['a'])
    expect(G('[a&a|a]')).equal(['a'])
    expect(G('[a|a|a]')).equal(['a'])

    expect(G('[a|a&a]')).equal(['a'])

    expect(G('[a|a|a|a]')).equal(['a'])
    expect(G('[a|a&a|a]')).equal(['a'])

  })


  test('condis-different', () => {
    expect(G('a')).equal('a')
    expect(N('a|b')).equal('"a"|"b"')
    expect(() => G('a|b')).throws(/aontu\/scalar/)
    expect(N('a&b')).equal('nil')
    expect(() => G('a&b')).throws(/aontu\/scalar/)

    expect(G('x:a')).equal({ x: 'a' })
    expect(N('x:a|b')).equal('{"x":"a"|"b"}')
    expect(() => G('x:a|b')).throws(/aontu\/scalar/)
    expect(N('x:a&b')).equal('{"x":nil}')
    expect(() => G('x:a&b')).throws(/aontu\/scalar/)

    expect(G('(a|b)&a')).equal('a')
    expect(G('a&(a|b)')).equal('a')
    expect(G('a&(a|b)&a')).equal('a')

    expect(G('a|b&a')).equal('a')
    expect(G('a|(b&a)')).equal('a')
    expect(G('(a|b)&a)')).equal('a')

    expect(N('a&a|b')).equal('"a"|"b"')
    expect(() => G('a&a|b')).throws(/aontu\/scalar/)
    expect(G('a&a|b&a')).equal('a')
    expect(G('(a&a)|(b&a)')).equal('a')
    expect(G('(a&a)|nil')).equal('a')
    expect(G('a&a|nil')).equal('a')

    expect(G('a|(b&a)')).equal('a')

    expect(G('(a|b)&a')).equal('a')
    expect(G('(a|b)&b')).equal('b')
    expect(N('(a|b)&c')).equal('nil')
    expect(() => G('(a|b)&c')).throws(/aontu\//)
  })


  test('pref', () => {
    expect(G('*a|string')).equal('a')
    expect(G('*a|b')).equal('a')
    expect(G('**1|*b')).equal('b')
    expect(G('***1|**2|*3')).equal(3)
    expect(G('***a|**b|*c')).equal('c')
    expect(G('***1|**b|*true')).equal(true)
    expect(G('***1|*true')).equal(true)

    expect(G('x:*a')).equal({ x: 'a' })
    // expect(G('x:*a x:b')).equal({ x: 'b' })

    expect(G('x:*{a:1}')).equal({ x: { a: 1 } })
    expect(G('x:*{a:1} x:{a:2}')).equal({ x: { a: 2 } })

    expect(G('x:*{a:1}|{a:number}')).equal({ x: { a: 1 } })
    expect(G('x:*{a:1}|{a:number} x:{a:2}')).equal({ x: { a: 2 } })
  })


  test('spread-pref-order-independent', () => {
    // Spread with pref should be order independent.
    // When empty map {} appears before the pref value *K, the spread constraint
    // should still resolve correctly via the pref default.

    // Working order: pref before empty map
    expect(G('a:&:k:string a:x:k:*K a:x:{}')).equal({ a: { x: { k: 'K' } } })

    // Failing order (bug): empty map before pref
    expect(G('a:&:k:string a:x:{} a:x:k:*K')).equal({ a: { x: { k: 'K' } } })

    // Additional order independence checks
    expect(G('a:x:{} a:&:k:string a:x:k:*K')).equal({ a: { x: { k: 'K' } } })
    expect(G('a:x:k:*K a:&:k:string a:x:{}')).equal({ a: { x: { k: 'K' } } })

    // Verify concrete values still work in both orders with spread
    expect(G('a:&:k:string a:x:{} a:x:k:K')).equal({ a: { x: { k: 'K' } } })
    expect(G('a:&:k:string a:x:k:K a:x:{}')).equal({ a: { x: { k: 'K' } } })
  })


  test('spread-pref-ref-order-independent', () => {
    // PrefVal wrapping RefVal should resolve against spread constraints.
    // The PrefVal superpeg must be recomputed after the ref resolves.

    // Pref+ref with spread, no empty map
    expect(G('v:K a:&:k:string a:x:k:*$.v')).equal({ v: 'K', a: { x: { k: 'K' } } })

    // Pref+ref with spread and empty map, both orders
    expect(G('v:K a:&:k:string a:x:{} a:x:k:*$.v')).equal({ v: 'K', a: { x: { k: 'K' } } })
    expect(G('v:K a:&:k:string a:x:k:*$.v a:x:{}')).equal({ v: 'K', a: { x: { k: 'K' } } })

    // Forward ref (target defined after usage)
    expect(G('a:&:k:string a:x:{} a:x:k:*$.v v:K')).equal({ v: 'K', a: { x: { k: 'K' } } })
  })


})




