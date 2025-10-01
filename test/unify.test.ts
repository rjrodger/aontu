
import { describe, test } from 'node:test'

import { expect } from '@hapi/code'

import {
  Context,
  Unify,
} from '../dist/unify'


import {
  Lang
} from '../dist/lang'


import { MapVal } from '../dist/val/MapVal'


let lang = new Lang()

const G = (x: string, ctx?: any) => new Unify(x, lang)
  .res.gen(ctx || new Context({ root: new MapVal({ peg: {} }) }))


describe('unify-x', function() {


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
    expect(G('a|b')).equal(undefined)
    expect(G('a&b')).equal(undefined)

    expect(G('x:a')).equal({ x: 'a' })
    expect(G('x:a|b')).equal({ x: undefined })
    expect(G('x:a&b')).equal({ x: undefined })

    expect(G('(a|b)&a')).equal('a')
    expect(G('a&(a|b)')).equal('a')
    expect(G('a&(a|b)&a')).equal('a')

    expect(G('a|b&a')).equal('a')
    expect(G('a|(b&a)')).equal('a')
    expect(G('(a|b)&a)')).equal('a')

    expect(G('a&a|b')).equal(undefined)
    expect(G('a&a|b&a')).equal('a')
    expect(G('(a&a)|(b&a)')).equal('a')
    expect(G('(a&a)|nil')).equal('a')
    expect(G('a&a|nil')).equal('a')

    expect(G('a|(b&a)')).equal('a')

    expect(G('(a|b)&a')).equal('a')
    expect(G('(a|b)&b')).equal('b')
    expect(G('(a|b)&c')).equal(undefined)
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


})




