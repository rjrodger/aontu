/* Copyright (c) 2021-2023 Richard Rodger, MIT License */

import type {
  Val,
} from '../type'

import {
  DONE,
} from '../type'

import {
  Context,
} from '../unify'

import {
  Site
} from '../lang'

import { ValBase } from './ValBase'


// There can be only one.
class TopVal extends ValBase {
  isTop = true

  id = 0
  top = true
  peg = undefined
  dc = DONE
  path = []
  row = -1
  col = -1
  url = ''

  constructor() {
    super({ peg: null })

    // TOP is always DONE, by definition.
    this.dc = DONE
  }

  unify(peer: Val, _ctx?: Context): Val {
    return peer
  }

  get canon() { return 'top' }

  get site(): Site { return new Site(this) }

  same(peer: Val): boolean {
    return this === peer
  }

  clone(_ctx: Context, _spec?: any) {
    return this
  }

  gen(_ctx?: Context) {
    return undefined
  }
}


const TOP = new TopVal()


export {
  TOP,
  TopVal,
}
